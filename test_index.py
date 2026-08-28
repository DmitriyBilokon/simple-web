#!/usr/bin/env python3
"""Tests for the simple-web visit tracker."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import threading
import unittest
from collections import OrderedDict
from datetime import datetime, timedelta
from http.server import HTTPServer
from pathlib import Path
from urllib.request import urlopen

import index


class VisitLogicTest(unittest.TestCase):
    def test_record_visit_increments_and_moves_to_end(self) -> None:
        visits: index.VisitMap = OrderedDict()
        index.record_visit(visits, "1.1.1.1", "10.0.0.2", "2026-01-01 00:00:00")
        index.record_visit(visits, "8.8.8.8", "10.0.0.2", "2026-01-01 00:00:01")
        index.record_visit(visits, "1.1.1.1", "10.0.0.2", "2026-01-01 00:00:02")
        self.assertEqual(list(visits.keys()), ["8.8.8.8|10.0.0.2", "1.1.1.1|10.0.0.2"])
        self.assertEqual(visits["1.1.1.1|10.0.0.2"], [2, "2026-01-01 00:00:02"])

    def test_render_marks_current_client_local_and_recent(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        visits: index.VisitMap = OrderedDict()
        visits["10.0.0.5|10.0.0.8"] = [3, now.strftime(index.TIME_FMT)]
        visits["9.9.9.9|10.0.0.8"] = [1, (now - timedelta(seconds=10)).strftime(index.TIME_FMT)]
        page = index.render_html(visits, "10.0.0.5", now)
        self.assertIn("LOCAL: 10.0.0.5", page)
        self.assertIn("9.9.9.9", page)
        self.assertIn('class="recent"', page)
        self.assertIn('class="stale"', page)
        self.assertIn("<span class=\"count\">3</span> requests", page)
        one: index.VisitMap = OrderedDict()
        one["10.0.0.5|10.0.0.8"] = [1, now.strftime(index.TIME_FMT)]
        self.assertIn("<span class=\"count\">1</span> request from", index.render_html(one, "10.0.0.5", now))

    def test_render_escapes_html(self) -> None:
        visits: index.VisitMap = OrderedDict()
        visits['<script>|server'] = [1, "2026-01-01 00:00:00"]
        page = index.render_html(visits, "other", datetime.now())
        self.assertNotIn("<script>", page)
        self.assertIn("&lt;script&gt;", page)

    def test_load_visits_rejects_corrupt_json(self) -> None:
        cwd = os.getcwd()
        tmp = tempfile.mkdtemp()
        try:
            os.chdir(tmp)
            Path("visit_stats.json").write_text("{not json", encoding="utf-8")
            self.assertEqual(index.load_visits(), OrderedDict())
            Path("visit_stats.json").write_text("[]", encoding="utf-8")
            self.assertEqual(index.load_visits(), OrderedDict())
        finally:
            os.chdir(cwd)
            shutil.rmtree(tmp, ignore_errors=True)


class ServerIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self._cwd = os.getcwd()
        self.tmp = tempfile.mkdtemp()
        os.chdir(self.tmp)
        self.httpd = HTTPServer(("127.0.0.1", 0), index.HandlerClass)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()
        os.chdir(self._cwd)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _get(self) -> str:
        with urlopen(f"http://127.0.0.1:{self.port}/", timeout=5) as response:
            self.assertEqual(response.status, 200)
            return response.read().decode("utf-8")

    def test_first_request_shows_visit_and_second_increments(self) -> None:
        first = self._get()
        self.assertIn("Real Visit Results", first)
        self.assertIn("127.0.0.1", first)
        self.assertIn("<span class=\"count\">1</span>", first)

        second = self._get()
        self.assertIn("<span class=\"count\">2</span>", second)
        self.assertIn("LOCAL: 127.0.0.1", second)

        saved = json.loads(Path("visit_stats.json").read_text(encoding="utf-8"))
        self.assertEqual(len(saved), 1)
        self.assertEqual(next(iter(saved.values()))[0], 2)


if __name__ == "__main__":
    unittest.main()
