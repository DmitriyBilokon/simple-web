simple_web
===
A simple web server that shows the source and destination IP addresses of
incoming requests. Useful for testing a load balancer and seeing which backend
actually handled each request.

# Supported tags and respective Dockerfile links

* [`latest` (latest/Dockerfile)](https://github.com/yeasy/simple-web/blob/master/Dockerfile)

For more information about this image and its history, see
[`yeasy/simple-web`](https://github.com/yeasy/simple-web).

# What is simple-web?
[simple-web](https://github.com/yeasy/simple-web) is a small Python HTTP server.
Each visit to `/` is counted and written to `index.html` with:

* client IP (source)
* server IP this request landed on (destination)
* request count and last-seen timestamp

Recent visits (last 3 seconds) are highlighted in red.

# How to use this image?
The docker image is auto built at
[https://registry.hub.docker.com/u/yeasy/simple-web/](https://registry.hub.docker.com/u/yeasy/simple-web/).

## In Dockerfile
```sh
FROM yeasy/simple-web:latest
```

## Local run with Docker
```sh
docker build -t simple-web .
docker run --rm -it -p 80:80 simple-web
```

Then open http://localhost/ — each refresh increments the counter.

## Local run without Docker
Requires Python 3.9+:

```sh
python3 index.py 0.0.0.0 8080
```

Then open http://localhost:8080/

# Which image is based on?
The image is based on `python:3.12-slim`.

# Tests
```sh
python3 -m unittest test_index.py
```
