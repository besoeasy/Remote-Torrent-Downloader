FROM node:slim

ENV NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends aria2 ca-certificates rclone \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 6798 6799 6888/tcp 6888/udp

CMD ["bash", "start.sh"]
