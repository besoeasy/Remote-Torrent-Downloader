FROM node:slim

RUN apt-get update && apt-get install -y aria2 samba

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4445 6798 6799 6888/tcp 6888/udp

CMD ["bash", "start.sh"]
