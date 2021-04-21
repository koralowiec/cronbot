FROM node:14-alpine as base

RUN mkdir /bot && chown node:node /bot

USER node

WORKDIR /bot

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . ./

RUN npm run build

CMD ["node", "dist/index.js"]

FROM base as dev

RUN npm i -D

CMD ["npx", "nodemon", "src/index.ts"]
