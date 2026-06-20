# Build the static site (prebuild fetches docs from AetherEngine main, needs network).
FROM node:lts-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve the static output. static-web-server, no nginx; Pangolin fronts TLS/WAF.
FROM joseluisq/static-web-server:2-alpine
ENV SERVER_ROOT=/public \
    SERVER_PORT=8080 \
    SERVER_COMPRESSION=true \
    SERVER_COMPRESSION_LEVEL=default
COPY --from=build /app/dist /public
EXPOSE 8080
