ARG NODE_VERSION="14"

# Base
FROM node:${NODE_VERSION} as fonts

WORKDIR /var/www/fonts

COPY package.json package-lock.json ./

RUN npm ci

COPY download.js ./

RUN node download.js
