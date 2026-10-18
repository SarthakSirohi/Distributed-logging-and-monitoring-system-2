FROM node:22-alpine

WORKDIR /app

# Copy the project's dependency files
COPY package*.json ./

RUN npm ci --omit=dev

# Copy the logging server code
COPY logging_server/server/ ./

EXPOSE 8000

CMD ["node", "server.js"]