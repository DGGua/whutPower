FROM node:16
COPY ./ /app
WORKDIR /app
RUN npm i -g pnpm && pnpm install && pnpm build && cp package.json build/package.json && cp pnpm-lock.yaml build/pnpm-lock.yaml && cp .npmrc build/.npmrc

FROM node:16
RUN mkdir /app
COPY --from=0 /app/build /app
WORKDIR /app
RUN npm i -g pnpm && pnpm install --production

ENTRYPOINT [ "node", "/app/main.js" ]