FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY discord-bot.mjs ./
CMD ["npm", "start"]
