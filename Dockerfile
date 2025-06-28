FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./

ARG NPM_MIRROR=https://mirror-npm.runflare.com
RUN npm --registry=$NPM_MIRROR install 

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json .

ARG NPM_MIRROR=https://mirror-npm.runflare.com
RUN npm --registry=$NPM_MIRROR install  --omit=dev


CMD ["node", "dist/src/main.js"]




