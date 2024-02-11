FROM node:20.11.0-alpine

RUN npm install -g nodemon 

WORKDIR /usr/src/app

COPY  package*.json .

RUN npm ci

COPY . .

EXPOSE 5000

CMD [ "npm","run","dev"]