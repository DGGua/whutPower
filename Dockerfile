FROM node:16
COPY ./ /app
WORKDIR /app
RUN yarn install && yarn build && cp package.json build/package.json

FROM node:16
RUN mkdir /app
COPY --from=0 /app/build /app
WORKDIR /app
RUN yarn install --production

ENTRYPOINT [ "node", "/app/main.js" ]