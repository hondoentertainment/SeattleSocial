# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npx vite build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npx tsc

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/prisma ./server/prisma
COPY --from=server-build /app/server/package.json ./server/
COPY --from=client-build /app/client/dist ./client/dist
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
