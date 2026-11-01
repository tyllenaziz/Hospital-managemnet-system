FROM node:20

WORKDIR /app

COPY . /app

RUN corepack enable \
    && corepack prepare pnpm@10.28.1 --activate \
    && pnpm --version \
    && pnpm -C backend install --frozen-lockfile --ignore-scripts \
    && pnpm -C frontend install --frozen-lockfile --ignore-scripts \
    && pnpm -C backend run test:run \
    && pnpm -C frontend run build

CMD ["bash"]
