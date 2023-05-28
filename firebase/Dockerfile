FROM node:18.14.2-alpine3.17

RUN apk update \
 && apk --no-cache add openjdk17-jre-headless \
 && rm -rf /var/cache/apk/*

RUN npm install -g firebase-tools

WORKDIR /app/firebase

COPY functions/package.json functions/package-lock.json ./functions/

RUN npm ci --prefix functions
COPY . .
RUN npm run build --prefix functions
