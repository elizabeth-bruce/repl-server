FROM node:latest

ADD . /app
WORKDIR /app

RUN npm install

RUN touch session-secret.txt
RUN cat /proc/sys/kernel/random/uuid > session-secret.txt

CMD ["npm start"]
