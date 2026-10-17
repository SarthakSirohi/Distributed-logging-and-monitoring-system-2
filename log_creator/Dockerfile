FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY log_creator/ ./

EXPOSE 3001
EXPOSE 3002

CMD ["node", "app.js"]