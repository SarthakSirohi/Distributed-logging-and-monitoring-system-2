FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY logging_server/server/ ./

EXPOSE 8000

CMD ["node", "server.js"]