FROM node:19.6.0-alpine3.16

RUN apk update \
 && apk --no-cache add openjdk17-jre-headless \
 && rm -rf /var/cache/apk/*

RUN npm install -g firebase-tools
