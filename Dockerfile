FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install --allow-git=all

COPY tsconfig.json ./
COPY server ./server
COPY client ./client

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --allow-git=all

COPY --from=build /app/server ./server
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 2567

CMD ["npx", "tsx", "server/src/index.ts"]
