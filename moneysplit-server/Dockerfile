FROM node:23-alpine

RUN mkdir /app
WORKDIR /app

COPY ./main.js .
COPY ./package.json .

ENV NODE_ENV="production"
RUN NODE_ENV="production" npm install

CMD ["node", "main.js", "8081"]
EXPOSE 8081
