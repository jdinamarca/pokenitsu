# Nitsu Collectibles: one container with the web app, the API and the price jobs (ADR 0020)
FROM node:24-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
# dependencies first, so a code change doesn't reinstall them
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile
# build packages/core (also writes apps/web/public/core.js), then keep only what runs in production
COPY . .
RUN pnpm build && CI=true pnpm prune --prod

# the image that runs: the app without the build tools or pnpm's download store
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/api/src/index.js"]
