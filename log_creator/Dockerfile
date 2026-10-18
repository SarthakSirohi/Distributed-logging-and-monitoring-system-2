FROM node:22-alpine

WORKDIR /app

# Copy the project's dependency files
COPY package*.json ./

RUN npm ci --omit=dev

# Copy the log creator code
COPY log_creator/ ./

RUN mkdir -p /logging_server/server

COPY logging_server/server/kafka-init.js /logging_server/server/kafka-init.js

EXPOSE 3001
EXPOSE 3002

CMD ["node", "app.js"]