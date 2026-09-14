FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY server.mjs ./
COPY public ./public
EXPOSE 3001
CMD ["node", "server.mjs"]
