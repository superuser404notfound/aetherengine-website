# Build the static site (prebuild fetches docs from AetherEngine main, needs network).
FROM node:lts-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# ENGINE_SHA busts this layer's cache when AetherEngine main moves, even though
# the website source is unchanged. `npm run build` runs `sync-docs` (prebuild),
# which fetches docs from AetherEngine main; without a changing arg here both the
# Docker layer cache (VPS) and the GHA layer cache (CI) would reuse a stale build
# and the new upstream docs would never be re-fetched. The CI workflow sets this
# to the current AetherEngine main SHA. Referenced in the RUN so the value is part
# of the layer cache key.
ARG ENGINE_SHA=dev
RUN echo "AetherEngine docs @ ${ENGINE_SHA}" && npm run build

# Serve the static output. static-web-server, no nginx; Pangolin fronts TLS/WAF.
FROM joseluisq/static-web-server:2-alpine
ENV SERVER_ROOT=/public \
    SERVER_PORT=8080 \
    SERVER_COMPRESSION=true \
    SERVER_COMPRESSION_LEVEL=default
COPY --from=build /app/dist /public
EXPOSE 8080
