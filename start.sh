#!/bin/bash

# Ensure SAVE_DIR exists
SAVE_DIR=$(node -e "console.log(require('os').tmpdir() + '/remote-torrent-downloader')")

mkdir -p "$SAVE_DIR"

echo "Download directory: $SAVE_DIR"

# Ensure permissions
chmod -R 0775 "$SAVE_DIR"

# Start rclone WebDAV server
rclone serve webdav "$SAVE_DIR" --addr :6799 --no-auth --read-only &

sleep 2

aria2c --enable-rpc --rpc-listen-all --rpc-listen-port=6398 --listen-port=6888 --seed-time=10 --max-concurrent-downloads=20 --enable-dht=true --bt-tracker="udp://tracker.opentrackr.org:1337/announce,udp://open.tracker.cl:1337/announce,udp://tracker.torrent.eu.org:451/announce,udp://open.stealth.si:80/announce,udp://tracker.dler.org:6969/announce,udp://exodus.desync.com:6969/announce,udp://tracker.0x7c0.com:6969/announce,udp://tracker.moeking.me:6969/announce,udp://uploads.gamecoast.net:6969/announce,udp://tracker.altrosky.nl:6969/announce,udp://tracker.tiny-vps.com:6969/announce,udp://tracker.theoks.net:6969/announce,udp://tracker1.myporn.club:9337/announce,udp://bt.ktrackers.com:6666/announce,udp://thouvenin.cloud:6969/announce,udp://tracker.bittor.pw:1337/announce,udp://tracker.swateam.org.uk:2710/announce,http://tracker.openbittorrent.com:80/announce,udp://opentracker.i2p.rocks:6969/announce" &

sleep 4

while true; do
   node app.js
   echo "Bot crashed with exit code $? - restarting in 5 seconds..."
   sleep 7
done
