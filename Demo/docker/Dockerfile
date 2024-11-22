# syntax=docker/dockerfile:1

FROM node:latest

RUN mkdir -p /app
RUN mkdir -p /app/.certs
RUN mkdir -p /app/public
RUN mkdir -p /app/public/images
RUN mkdir -p /app/src
#RUN mkdir -p /lib/h5dmd

COPY ./ /app/
COPY ./public /app/public/
COPY ./public/images /app/public/images/
#COPY ./src /app/src/

COPY .certs/* /app/.certs/

WORKDIR /app

#RUN mkdir -p node_modules


RUN npm install



ENTRYPOINT ["npm","run","dev"]
#CMD ["/bin/bash", "-c", "npm install && npm run dev"]