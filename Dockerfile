FROM oven/bun:debian

RUN apt-get update && apt-get install -y aria2 samba

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY . .

EXPOSE 4445 6798 6799 6888/tcp 6888/udp

CMD ["bash", "start.sh"]
