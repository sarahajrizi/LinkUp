FROM node:18-alpine
WORKDIR /app

# Install only production deps (no lockfile present)
COPY package.json ./
RUN npm install --production --no-progress

# Copy the app source
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "backend/src/server.js"]
