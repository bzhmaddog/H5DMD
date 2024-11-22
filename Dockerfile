# syntax=docker/dockerfile:1

FROM node:22-alpine

RUN apk update && apk add --no-cache \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libpng-dev \
    freetype-dev \
    g++ \
    python3

RUN mkdir -p /h5dmd

COPY ./package*.json /h5dmd/
COPY ./tsconfig*.json /h5dmd/
COPY ./jest.config.js /h5dmd/
COPY ./.eslintignore /h5dmd/
COPY ./.eslintrc /h5dmd/

WORKDIR /h5dmd

RUN npm install

ENTRYPOINT ["npm","run","watch"]