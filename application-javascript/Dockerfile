# Dockerfile for building an image for the fabric rest service.

FROM node:14

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# change exposed port
EXPOSE 8080


# Useful?
FROM node:14-alpine
ENTRYPOINT ["node", "server.js"]