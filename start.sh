#!/bin/sh

python -m SimpleHTTPServer 8080 &

node ws/server.js
