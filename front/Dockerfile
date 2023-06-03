FROM node:18.14.2-alpine3.17

RUN npm install -g pnpm@8.6.0

WORKDIR /app/front
COPY . .

ENTRYPOINT [ "./entrypoint.sh" ]
CMD pnpm dev
