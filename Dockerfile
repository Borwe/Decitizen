FROM node:22-bookworm

WORKDIR /app/
COPY ./ /app/
RUN npm i
CMD ["npm","run","server"]
