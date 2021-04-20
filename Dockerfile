FROM node:14-alpine

RUN mkdir /bot && chown node:node /bot

USER node

WORKDIR /bot

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . ./

RUN npm run build

CMD ["node", "dist/index.js"]
