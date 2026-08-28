#!/usr/bin/env python3
"""Simple HTTP server that shows client and server IPs of received requests.

Useful for testing load balancers: each backend instance reports the real
source and destination addresses of the traffic it handled.
"""

from __future__ import annotations

import html
import json
import socket
import sys
from collections import OrderedDict
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any

DATA_FILE = Path("visit_stats.json")
INDEX_FILE = Path("index.html")
RECENT_SECONDS = 3
TIME_FMT = "%Y-%m-%d %H:%M:%S"
VisitMap = OrderedDict[str, list[Any]]


def load_visits() -> VisitMap:
    if not DATA_FILE.exists():
        return OrderedDict()
    try:
        with DATA_FILE.open(encoding="utf-8") as handle:
            raw = json.load(handle)
    except (OSError, json.JSONDecodeError, TypeError):
        return OrderedDict()
    if not isinstance(raw, dict):
        return OrderedDict()
    visits: VisitMap = OrderedDict()
    for key, value in raw.items():
        if (
            isinstance(key, str)
            and "|" in key
            and isinstance(value, list)
            and len(value) >= 2
        ):
            visits[key] = [int(value[0]), str(value[1])]
    return visits


def save_visits(visits: VisitMap) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(visits, handle, indent=2)


def visit_key(client_ip: str, server_ip: str) -> str:
    return f"{client_ip}|{server_ip}"


def record_visit(visits: VisitMap, client_ip: str, server_ip: str, ts: str) -> None:
    key = visit_key(client_ip, server_ip)
    count = visits[key][0] + 1 if key in visits else 1
    if key in visits:
        del visits[key]
    visits[key] = [count, ts]


def render_html(visits: VisitMap, current_client: str, now: datetime) -> str:
    rows: list[str] = []
    for key, (count, ts) in visits.items():
        client_ip, server_ip = key.split("|", 1)
        guest = f"LOCAL: {client_ip}" if client_ip == current_client else client_ip
        try:
            age = (now - datetime.strptime(ts, TIME_FMT)).total_seconds()
        except ValueError:
            age = RECENT_SECONDS + 1
        css = "recent" if age < RECENT_SECONDS else "stale"
        noun = "request" if count == 1 else "requests"
        rows.append(
            f'<p class="{css}">#{html.escape(ts)}: '
            f'<span class="count">{count}</span> {noun} '
            f"from &lt;<span class=\"ip\">{html.escape(guest)}</span>&gt; "
            f"to WebServer &lt;<span class=\"ip\">{html.escape(server_ip)}</span>&gt;</p>"
        )
    body = "\n".join(rows)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Real Visit Results</title>
  <style>
    body {{ font-family: Georgia, Arial, sans-serif; margin: 2rem; }}
    h1 {{ text-align: center; font-size: 2.5rem; }}
    h1 em {{ color: blue; font-style: italic; }}
    p {{ font-size: 150%; }}
    .recent .count {{ color: red; }}
    .recent .ip {{ color: blue; }}
    .stale .count {{ color: maroon; }}
    .stale .ip {{ color: navy; }}
  </style>
</head>
<body>
  <h1><em>Real</em> Visit Results</h1>
  {body}
</body>
</html>
"""


def ipv4_for_interface(ifname: str) -> str | None:
    """Return IPv4 for a Linux interface, or None if unavailable."""
    import fcntl
    import struct

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            packed = struct.pack("256s", ifname.encode("utf-8")[:15])
            info = fcntl.ioctl(sock.fileno(), 0x8915, packed)  # SIOCGIFADDR
            return socket.inet_ntoa(info[20:24])
    except OSError:
        return None


def primary_ipv4() -> str | None:
    """Best-effort non-loopback IPv4 without assuming eth0 exists."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        pass

    if hasattr(socket, "if_nameindex"):
        for _, name in socket.if_nameindex():
            if name == "lo" or name.startswith("lo"):
                continue
            ip = ipv4_for_interface(name)
            if ip and not ip.startswith("127."):
                return ip
    return None


def destination_ip(handler: SimpleHTTPRequestHandler) -> str:
    """IP this request actually landed on — the real backend address for LB tests."""
    try:
        ip = handler.request.getsockname()[0]
        if ip and ip not in ("0.0.0.0", "::"):
            return ip
    except OSError:
        pass
    return primary_ipv4() or "unknown"


def update_index(client_ip: str, server_ip: str) -> None:
    visits = load_visits()
    now = datetime.now()
    record_visit(visits, client_ip, server_ip, now.strftime(TIME_FMT))
    INDEX_FILE.write_text(render_html(visits, client_ip, now), encoding="utf-8")
    save_visits(visits)


class HandlerClass(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            try:
                update_index(self.client_address[0], destination_ip(self))
            except OSError as exc:
                sys.stderr.write(f"Failed to update visit log: {exc}\n")
        super().do_GET()

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    addr = args[0] if len(args) >= 1 else "0.0.0.0"
    port = int(args[1]) if len(args) >= 2 else 80
    if not INDEX_FILE.exists():
        INDEX_FILE.write_text(render_html(OrderedDict(), "", datetime.now()), encoding="utf-8")
    httpd = HTTPServer((addr, port), HandlerClass)
    host, bound_port = httpd.socket.getsockname()[:2]
    print(f"Serving HTTP on {host} port {bound_port} ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
