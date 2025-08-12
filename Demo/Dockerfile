# syntax=docker/dockerfile:1

FROM node:latest

RUN apt-get update && apt-get install -y inotify-tools

RUN mkdir -p /app
RUN mkdir -p /app/.certs
RUN mkdir -p /app/public
RUN mkdir -p /app/public/images
RUN mkdir -p /app/src

COPY ./ /app/
COPY ./public /app/public/
COPY ./public/images /app/public/images/
COPY ./tools/h5dmd-watcher.sh /
COPY ./tools/watch.sh /
COPY .certs/* /app/.certs/

RUN chmod +x /watch.sh
RUN chmod +x /h5dmd-watcher.sh

WORKDIR /app

RUN npm install



ENTRYPOINT ["/watch.sh"]
