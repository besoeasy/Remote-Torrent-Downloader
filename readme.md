
<img width="1613" height="1366" alt="RTD" src="https://github.com/user-attachments/assets/f7d82c50-7ff6-4796-956d-2bcef351e0aa" />

# Remote-Torrent-Downloader

> **Control your downloads from anywhere. Stream from everywhere.**

Remote-Torrent-Downloader is a minimal, bot-controlled media server. No web UI, no complex setup—just chat with your bot to download, and stream locally via SMB or HTTP.

## Features

- 🤖 **Chat to Control**: Send magnet links to your Telegram or Nostr bot.
- 📱 **Remote First**: Manage downloads from your phone, anywhere.
- 🏠 **Local Streaming**: Watch on your TV, laptop, or phone via SMB/HTTP.
- 🔒 **Secure**: Encrypted messaging and multi-user authorization.
- 🚀 **Lightweight**: Runs on Raspberry Pi, old laptops, or cloud servers.

## Quick Start

### Docker Run

```bash
docker run -d \
  --name remote-torrent-downloader \
  --restart unless-stopped \
  -p 6798:6798 \
  -p 6799:6799 \
  -p 6888:6888/tcp \
  -p 6888:6888/udp \
  -e TELEGRAMBOT="your_bot_token" \
  -v remote-torrent-downloader:/tmp/remote-torrent-downloader \
  ghcr.io/besoeasy/remote-torrent-downloader
```

### Docker Compose

```yaml
version: "3.8"
services:
  remote-torrent-downloader:
    image: ghcr.io/besoeasy/remote-torrent-downloader
    container_name: remote-torrent-downloader
    restart: unless-stopped
    ports:
      - "6798:6798"
      - "6799:6799"
      - "6888:6888/tcp"
      - "6888:6888/udp"
    environment:
      - TELEGRAMBOT=your_bot_token
    volumes:
      - remote-torrent-downloader:/tmp/remote-torrent-downloader

volumes:
  remote-torrent-downloader:
```

### Environment Variables

| Variable      | Description                                | Required |
| :------------ | :----------------------------------------- | :------- |
| `TELEGRAMBOT` | Telegram Bot Token (from @BotFather)       | No       |
| `NSEC`        | Nostr Private Key (nsec)                   | No       |
| `AUTHCODE`    | Custom auth code (auto-generated if empty) | No       |

## Usage

### 1. Control Via Chat

Start a chat with your bot and send a **magnet link** or **torrent URL**.

- **Telegram**: Message your bot.
- **Nostr**: DM the bot's public key.

**Commands**:

- `/help` - Show all commands
- `/dl <link>` - Start download
- `/status` - Check download progress
- `/clean` - Remove old files

### 2. Stream (Watch)

Access your downloaded media on your local network.

- **WebDAV**: `http://YOUR_SERVER_IP:6799`
  - **Windows**: Map Network Drive → "Connect to a web site"
  - **macOS**: Finder → Go → Connect to Server → `http://YOUR_SERVER_IP:6799`
  - **iOS**: Files app → Connect to Server → `http://YOUR_SERVER_IP:6799`
  - **Android**: Use a WebDAV-compatible file manager
  - **VLC/Infuse/Kodi**: Add network location with WebDAV protocol

## Dashboard

Visit `http://YOUR_SERVER_IP:6798` to view system status, usage, and bot credentials.
