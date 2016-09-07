#!/bin/bash

# Ensure SAVE_DIR exists
SAVE_DIR=$(bun -e "console.log(require('os').tmpdir() + '/streambox')")

mkdir -p "$SAVE_DIR"

echo "Download directory: $SAVE_DIR"

# Generate random SMB credentials
SMB_USER="x$(shuf -i 1000-9999 -n 1)"
SMB_PASS=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-10)

# Create SMB user and set password
useradd -M -s /bin/false "$SMB_USER"
echo "$SMB_USER:$SMB_PASS" | chpasswd
(echo "$SMB_PASS"; echo "$SMB_PASS") | smbpasswd -a "$SMB_USER"

# Save credentials for the bot to display (outside web-accessible directory)
echo "$SMB_USER:$SMB_PASS" > /var/run/smb_credentials.txt

# Verify credentials file was written correctly
if [ -f /var/run/smb_credentials.txt ]; then
    echo "SMB Credentials: $SMB_USER / $SMB_PASS"
else
    echo "ERROR: Failed to create SMB credentials file"
    exit 1
fi

sleep 2

# Create minimal smb.conf for guest access
cat >/etc/samba/smb.conf <<EOL
[global]
   map to guest = Bad User
   guest account = nobody
   server min protocol = SMB2
   disable netbios = yes
   smb ports = 4445

[StreamBox]
   comment = Read-only downloads
   path = $SAVE_DIR
   read only = yes
   guest ok = yes
   force user = nobody
   browseable = yes

[StreamBox-rw]
   comment = Full access downloads
   path = $SAVE_DIR
   read only = no
   valid users = $SMB_USER
   force user = $SMB_USER
   force group = users
   browseable = yes
   create mask = 0664
   directory mask = 0775
EOL

# Ensure permissions for guest access
chown -R nobody:nogroup "$SAVE_DIR"
chmod -R 0775 "$SAVE_DIR"

# Also set permissions for the authenticated user
chown -R "$SMB_USER":users "$SAVE_DIR"
chmod -R 0775 "$SAVE_DIR"

# Start Samba (SMB) server
smbd --foreground --no-process-group &

sleep 2

aria2c --enable-rpc --rpc-listen-all --rpc-listen-port=6398 --listen-port=6888 --seed-time=10 --max-concurrent-downloads=20 --enable-dht=true --bt-tracker="udp://tracker.opentrackr.org:1337/announce,udp://open.tracker.cl:1337/announce,udp://tracker.torrent.eu.org:451/announce,udp://open.stealth.si:80/announce,udp://tracker.dler.org:6969/announce,udp://exodus.desync.com:6969/announce,udp://tracker.0x7c0.com:6969/announce,udp://tracker.moeking.me:6969/announce,udp://uploads.gamecoast.net:6969/announce,udp://tracker.altrosky.nl:6969/announce,udp://tracker.tiny-vps.com:6969/announce,udp://tracker.theoks.net:6969/announce,udp://tracker1.myporn.club:9337/announce,udp://bt.ktrackers.com:6666/announce,udp://thouvenin.cloud:6969/announce,udp://tracker.bittor.pw:1337/announce,udp://tracker.swateam.org.uk:2710/announce,http://tracker.openbittorrent.com:80/announce,udp://opentracker.i2p.rocks:6969/announce" &

sleep 4

while true; do
   bun app.js
   echo "Bot crashed with exit code $? - restarting in 5 seconds..."
   sleep 7
done
