FROM mirror.gcr.io/library/node:20-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://registry.npmjs.org/ && npm install --omit=dev --no-audit --no-fund
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
