# builder mode
FROM node:24-bookworm AS builder
WORKDIR /usr/src/app
COPY package*.json ./

# FIX: Remove the local @repo/eslint-config dependency so npm doesn't look for it on the internet
RUN sed -i '/@repo\/eslint-config/d' package.json

RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
RUN npm run build

# runtime mode
FROM node:24-bookworm-slim AS runtime
WORKDIR /usr/src/app
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/dist ./dist

USER node
EXPOSE 4000

# FIX: Changed string format to array format so shell operators (&&) execute properly
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
