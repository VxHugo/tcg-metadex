FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY packages/database ./packages/database
ARG TCGDEX_API_URL=https://api.tcgdex.net/v2/en
ENV TCGDEX_API_URL=$TCGDEX_API_URL
RUN npm run prisma:generate && npm run build

FROM builder AS runner
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --schema packages/database/schema.prisma && npm run start"]
