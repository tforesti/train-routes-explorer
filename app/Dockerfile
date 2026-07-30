FROM node:22-slim AS front-build
WORKDIR /build/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web ./
RUN npm run build

FROM denoland/deno:2.9.4
WORKDIR /app
COPY deno.json deno.lock ./
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
RUN deno cache src/api/server.ts
COPY --from=front-build /build/web/dist ./web/dist
EXPOSE 8000
CMD ["run", "-A", "src/api/server.ts"]
