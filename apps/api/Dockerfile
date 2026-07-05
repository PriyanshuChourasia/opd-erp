# builder mode
FROM node:24-bookworm AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
RUN npm run build

# runtime mode
FROM node:24-bookworm-slim AS runtime
WORKDIR /usr/src/app
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/dist ./dist


USER node
EXPOSE 4000
CMD ["npx", "prisma", "migrate", "deploy", "&&", "node", "dist/main.js"]