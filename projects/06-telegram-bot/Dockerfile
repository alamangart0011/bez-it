FROM mirror.gcr.io/library/node:20-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://registry.npmjs.org/ && npm install --omit=dev --no-audit --no-fund
COPY src ./src
CMD ["npm", "start"]
