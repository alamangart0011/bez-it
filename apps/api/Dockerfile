FROM node:20-bookworm-slim
WORKDIR /app
COPY apps/api/package.json ./package.json
COPY apps/api/server.js ./server.js
COPY apps/api/src ./src
EXPOSE 3001
CMD ["node", "server.js"]
