FROM node:18.14.2-alpine3.17

RUN apk update \
 && apk --no-cache add openjdk17-jre-headless \
 && rm -rf /var/cache/apk/*

RUN npm install -g firebase-tools pnpm@8.6.0

WORKDIR /app/firebase
COPY . .

ENTRYPOINT [ "./entrypoint.sh" ]
CMD firebase --debug emulators:start --import=./firebase_data --export-on-exit --project demo-project-id

# COPY functions/package.json functions/package-lock.json ./functions/

# RUN npm ci --prefix functions

# RUN npm run build --prefix functions
