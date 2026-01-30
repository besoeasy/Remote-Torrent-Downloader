#!/usr/bin/env node
import "dotenv/config";
import { Telegraf } from "telegraf";
import { sendmessage, getmessage, nsecToPublic, generateRandomNsec } from "nostr-sdk";

import { randomCode, short, autoCleanOldFiles, getDirectorySize, bytesToSize, deleteOldestFile, getIpData, getFilesRecursively } from "./modules/utils.js";
import fs from "fs";

import { SAVE_DIR, getGlobalStats, downloadAria, getDownloadStatus, getOngoingDownloads, cancelDownload } from "./modules/aria.js";

import { generateConfigPage } from "./modules/ui.js";
import http from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));
const VERSION = packageJson.version;

async function cmdStart(userId, options = {}) {
  try {
    const saveDirSize = await getDirectorySize(SAVE_DIR).catch(() => 0);
    const userIdHash = String(userId).slice(0, 8);

    return {
      success: true,
      name: "Remote-Torrent-Downloader Bot",
      version: VERSION,
      description: "A Telegram/Nostr bot to control Remote-Torrent-Downloader. Download torrents and stream media easily.",
      github: "https://github.com/besoeasy/Remote-Torrent-Downloader",
      userId: userIdHash,
      usedSpace: saveDirSize,
      usedSpaceFormatted: bytesToSize(saveDirSize),
      saveDir: SAVE_DIR,
      webdavPort: options.webdavPort || 6799,
      webPort: options.webPort || 6798,
    };
  } catch (error) {
    console.error("cmdStart error:", error);
    return { success: false, error: error.message };
  }
}

async function cmdStats() {
  try {
    const statsData = await getGlobalStats();
    if (!statsData || !statsData.result) {
      return { success: false, error: "Could not fetch stats from Aria2" };
    }

    const stats = statsData.result;
    return {
      success: true,
      downloadSpeed: parseInt(stats.downloadSpeed) || 0,
      uploadSpeed: parseInt(stats.uploadSpeed) || 0,
      numActive: parseInt(stats.numActive) || 0,
      numWaiting: parseInt(stats.numWaiting) || 0,
      numStopped: parseInt(stats.numStopped) || 0,
      downloadSpeedFormatted: bytesToSize(parseInt(stats.downloadSpeed)) + "/s",
      uploadSpeedFormatted: bytesToSize(parseInt(stats.uploadSpeed)) + "/s",
    };
  } catch (error) {
    console.error("cmdStats error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Start a new download
 */
async function cmdDownload(userId, input) {
  try {
    if (!input || typeof input !== "string") {
      return { success: false, error: "No URL or magnet link provided" };
    }

    let magnet = null;
    let url = null;
    let type = "unknown";

    // Magnet link detection
    const magnetMatch = input.match(/magnet:\?xt=urn:btih:[a-zA-Z0-9]+[^"]*/);
    if (magnetMatch) {
      magnet = magnetMatch[0];
      type = "magnet";
    } else {
      // URL detection (http/https)
      const urlMatch = input.match(/https?:\/\/[\w\-\.\/\?#&=:%]+/);
      if (urlMatch) {
        url = urlMatch[0];
        type = "url";
      }
    }

    if (!magnet && !url) {
      return { success: false, error: "No valid magnet link or URL found" };
    }

    const userIdHash = String(userId).slice(0, 16);
    const downloadData = await downloadAria(userIdHash, magnet || url);

    if (!downloadData || !downloadData.result) {
      return {
        success: false,
        error: "Failed to start download. Check if Aria2 is running.",
      };
    }

    return {
      success: true,
      gid: downloadData.result,
      type: type,
      url: magnet || url,
    };
  } catch (error) {
    console.error("cmdDownload error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Get status of a specific download
 */
async function cmdStatus(gid) {
  try {
    const downloadData = await getDownloadStatus(gid);
    if (!downloadData || !downloadData.result) {
      return {
        success: false,
        error: "Could not get status. Download may not exist.",
      };
    }

    const result = downloadData.result;
    const completedLength = parseInt(result.completedLength) || 0;
    const totalLength = parseInt(result.totalLength) || 0;
    const downloadSpeed = parseInt(result.downloadSpeed) || 0;
    const uploadSpeed = parseInt(result.uploadSpeed) || 0;

    const completedMB = (completedLength / 1024 / 1024).toFixed(2);
    const totalMB = (totalLength / 1024 / 1024).toFixed(2);
    const progress = totalLength > 0 ? ((completedLength / totalLength) * 100).toFixed(1) : 0;

    return {
      success: true,
      gid: gid,
      status: result.status,
      completedLength: completedLength,
      totalLength: totalLength,
      completedMB: completedMB,
      totalMB: totalMB,
      progress: parseFloat(progress),
      downloadSpeed: downloadSpeed,
      uploadSpeed: uploadSpeed,
      downloadSpeedFormatted: bytesToSize(downloadSpeed) + "/s",
      uploadSpeedFormatted: bytesToSize(uploadSpeed) + "/s",
      files: result.files || [],
    };
  } catch (error) {
    console.error("cmdStatus error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Get list of active downloads
 */
async function cmdDownloading() {
  try {
    const ongoingData = await getOngoingDownloads();
    if (!ongoingData || !ongoingData.result) {
      return { success: false, error: "Failed to fetch downloads" };
    }

    if (ongoingData.result.length === 0) {
      return { success: true, downloads: [], message: "No ongoing downloads" };
    }

    const downloads = ongoingData.result.map((download) => {
      const completedLength = parseInt(download.completedLength) || 0;
      const totalLength = parseInt(download.totalLength) || 0;
      const downloadSpeed = parseInt(download.downloadSpeed) || 0;

      return {
        gid: download.gid,
        status: download.status,
        completedLength: completedLength,
        totalLength: totalLength,
        completedMB: (completedLength / 1024 / 1024).toFixed(2),
        totalMB: (totalLength / 1024 / 1024).toFixed(2),
        progress: totalLength > 0 ? ((completedLength / totalLength) * 100).toFixed(1) : 0,
        downloadSpeed: downloadSpeed,
        downloadSpeedFormatted: bytesToSize(downloadSpeed) + "/s",
      };
    });

    return { success: true, downloads: downloads };
  } catch (error) {
    console.error("cmdDownloading error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Cancel a download
 */
async function cmdCancel(gid) {
  try {
    const result = await cancelDownload(gid);
    if (!result || !result.result) {
      return {
        success: false,
        error: "Failed to cancel. May not exist or already finished.",
      };
    }

    return { success: true, gid: gid, message: `Download ${gid} canceled` };
  } catch (error) {
    console.error("cmdCancel error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Delete oldest file
 */
async function cmdClean() {
  try {
    const result = await deleteOldestFile(SAVE_DIR);
    return result;
  } catch (error) {
    console.error("cmdClean error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Get server IP information
 */
async function cmdIp() {
  try {
    const ipData = await getIpData();
    if (!ipData) {
      return { success: false, error: "Could not fetch IP info" };
    }

    return { success: true, ...ipData };
  } catch (error) {
    console.error("cmdIp error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Command: Get help information
 */
function cmdHelp() {
  return {
    success: true,
    commands: [
      { command: "help", description: "Show available commands" },
      { command: "start", description: "Get bot info and status" },
      { command: "stats", description: "Show global download stats" },
      { command: "download <url>", description: "Start downloading a file" },
      { command: "dl <url>", description: "Alias for download" },
      { command: "downloading", description: "View active downloads" },
      { command: "status_<gid>", description: "Check download status" },
      { command: "cancel_<gid>", description: "Cancel a download" },
      { command: "clean", description: "Delete oldest file" },
      { command: "ip", description: "Show server IP info" },
    ],
  };
}

/**
 * Command: Get current time
 */
function cmdTime() {
  return {
    success: true,
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    human: new Date().toString(),
  };
}

function getAuthCode() {
  if (process.env.AUTHCODE && process.env.AUTHCODE.trim().length > 5) {
    return process.env.AUTHCODE;
  }
  return randomCode();
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAMBOT;
const NOSTR_NSEC = process.env.NSEC;
const AUTH_CODE = getAuthCode();
const SERVER_PORT = 6799;
const CONFIG_PAGE_PORT = 6798;
const AUTO_CLEAN_DAYS = 30;
const AUTO_CLEAN_INTERVAL_MS = 10 * 60 * 60 * 1000;

// In-memory whitelist for authorized users
const whitelist = {
  telegram: new Set(),
  nostr: new Set(),
};

// Track processed events to avoid duplicates
const processedEvents = new Map();
const MAX_STORED_EVENTS = 1000;

function loadOrGenerateNostrKey() {
  // Use provided NSEC or generate one using nostr-sdk
  let nsec = NOSTR_NSEC;
  if (!nsec) {
    nsec = generateRandomNsec();
    console.log("🔑 Generated new Nostr NSEC (add to .env to persist):");
    console.log(`   NSEC=${nsec}`);
  } else {
    console.log("✅ Using NSEC from environment");
  }

  // Convert to public formats
  const info = nsecToPublic(nsec);
  return { nsec, pubkey: info.publicKey, npub: info.npub };
}

const { nsec: BOT_NSEC, pubkey: BOT_PUBKEY, npub: BOT_NPUB } = loadOrGenerateNostrKey();

// ============================================================================
// TELEGRAM BOT
// ============================================================================

let telegramBot = null;
let telegramBotUsername = null;

async function startTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("⏭️  Telegram bot disabled (no TELEGRAM_BOT_TOKEN)");
    return;
  }

  console.log("🚀 Starting Telegram bot...");
  telegramBot = new Telegraf(TELEGRAM_BOT_TOKEN);

  // Fetch bot info to get username
  try {
    const botInfo = await telegramBot.telegram.getMe();
    telegramBotUsername = botInfo.username;
    console.log(`🤖 Telegram bot username: @${telegramBotUsername}`);
  } catch (error) {
    console.error("❌ Failed to fetch bot info:", error.message);
  }

  telegramBot.on("message", async (ctx) => {
    if (!ctx.message.text) return;

    const userId = String(ctx.chat.id);
    const username = ctx.from.username || "unknown";
    const text = ctx.message.text.trim();
    const [cmd, ...args] = text.split(/\s+/);

    console.log(`📱 Telegram @${username} (${userId}): ${text}`);

    // Check authorization
    if (!whitelist.telegram.has(userId)) {
      if (text === AUTH_CODE) {
        whitelist.telegram.add(userId);
        console.log(`✅ Telegram user ${userId} authorized`);
        return ctx.reply(`🔓 Access granted! You are now authorized.\n\nSend /help to see available commands.`);
      }
      return ctx.reply(`🔐 Authorization required.\n\nPlease send the auth code to gain access.\n\nContact the bot owner for the code.`);
    }

    // Handle commands
    await handleCommand(ctx, cmd.toLowerCase(), args, userId, "telegram");
  });

  telegramBot.catch((err, ctx) => {
    console.error(`❌ Telegram error for ${ctx.updateType}:`, err);
  });

  telegramBot.launch();
  console.log("✅ Telegram bot started");
}

let nostrUnsubscribe = null;

function startNostrBot() {
  console.log("🚀 Starting Nostr bot (via nostr-sdk)...");

  // Use nostr-sdk's getmessage to listen for encrypted DMs
  try {
    nostrUnsubscribe = getmessage(
      async (message) => {
        try {
          // Check for duplicate events
          const eventId = message.id;
          if (eventId && processedEvents.has(eventId)) {
            console.log(`⏭️  Skipping duplicate event ${eventId.substring(0, 8)}...`);
            return;
          }

          const sender = message.sender; // pubkey hex
          const content = (message.content || "").trim();
          console.log(`💬 Nostr ${short(sender)}: ${content}`);

          // Mark event as processed
          if (eventId) {
            processedEvents.set(eventId, Date.now());

            // Cleanup old events if we exceed the limit
            if (processedEvents.size > MAX_STORED_EVENTS) {
              const entriesToDelete = processedEvents.size - MAX_STORED_EVENTS;
              const iterator = processedEvents.keys();
              for (let i = 0; i < entriesToDelete; i++) {
                const oldestKey = iterator.next().value;
                processedEvents.delete(oldestKey);
              }
              console.log(`🧹 Cleaned up ${entriesToDelete} old event IDs`);
            }
          }

          // Check authorization
          if (!whitelist.nostr.has(sender)) {
            if (content === AUTH_CODE) {
              whitelist.nostr.add(sender);
              console.log(`✅ Nostr user ${short(sender)} authorized`);
              await sendNostrDM(sender, `🔓 Access granted! You are now authorized.\n\nSend /help to see available commands.`);
              return;
            }
            await sendNostrDM(sender, `🔐 Authorization required.\n\nPlease send the auth code to gain access.\n\nContact the bot owner for the code.`);
            return;
          }

          // Handle commands
          const [cmd, ...args] = content.split(/\s+/);
          await handleCommand({ reply: (msg) => sendNostrDM(sender, msg) }, cmd.toLowerCase(), args, sender, "nostr");
        } catch (err) {
          console.error("❌ Error in nostr message handler:", err);
        }
      },
      {
        nsec: BOT_NSEC,
      }
    );

    console.log("✅ Nostr message listener started");
  } catch (e) {
    console.error("❌ Failed to start nostr message listener:", e);
  }
}

async function sendNostrDM(toPubkey, plaintext) {
  try {
    const res = await sendmessage(toPubkey, plaintext, { nsec: BOT_NSEC });
    if (res && res.success) {
      console.log(`📤 Nostr DM sent to ${short(toPubkey)} (event: ${res.eventId})`);
    } else {
      console.warn(`⚠️  Nostr DM may have failed to ${short(toPubkey)}`);
    }
    return res;
  } catch (e) {
    console.error("❌ Failed to send Nostr DM:", e);
    return null;
  }
}

async function handleCommand(ctx, cmd, args, userId, platform) {
  let result;

  try {
    switch (cmd) {
      case "/help":
        result = cmdHelp();
        await formatAndReply(ctx, result, platform, "help");
        break;

      case "/start":
        result = await cmdStart(userId);
        await formatAndReply(ctx, result, platform, "start");
        break;

      case "/stats":
        result = await cmdStats();
        await formatAndReply(ctx, result, platform, "stats");
        break;

      case "/download":
      case "/dl":
        if (args.length === 0) {
          return ctx.reply("Please provide a URL or magnet link.");
        }
        result = await cmdDownload(userId, args[0]);
        await formatAndReply(ctx, result, platform, "download");
        break;

      case "/downloading":
        result = await cmdDownloading();
        await formatAndReply(ctx, result, platform, "downloading");
        break;

      case "/clean":
        result = await cmdClean();
        await formatAndReply(ctx, result, platform, "clean");
        break;

      case "/ip":
        result = await cmdIp();
        await formatAndReply(ctx, result, platform, "ip");
        break;

      case "/time":
        result = cmdTime();
        await formatAndReply(ctx, result, platform, "time");
        break;

      default:
        if (cmd.startsWith("/status_")) {
          const gid = cmd.split("_")[1];
          result = await cmdStatus(gid);
          await formatAndReply(ctx, result, platform, "status");
        } else if (cmd.startsWith("/cancel_")) {
          const gid = cmd.split("_")[1];
          result = await cmdCancel(gid);
          await formatAndReply(ctx, result, platform, "cancel");
        } else if (cmd.startsWith("/dl_")) {
          const hash = cmd.split("_")[1];
          if (hash) {
            const magnetLink = `magnet:?xt=urn:btih:${hash}`;
            result = await cmdDownload(userId, magnetLink);
            await formatAndReply(ctx, result, platform, "download");
          } else {
            ctx.reply("Invalid download command. Hash missing.");
          }
        } else {
          ctx.reply(`Unknown command: ${cmd}\n\nSend /help for available commands.`);
        }
    }
  } catch (error) {
    console.error(`❌ Command error (${cmd}):`, error);
    ctx.reply("An error occurred. Please try again later.");
  }
}

async function formatAndReply(ctx, result, platform, commandType) {
  if (!result) {
    return ctx.reply("No result returned from command.");
  }

  let message = "";

  if (!result.success && result.error) {
    message = `❌ Error: ${result.error}`;
    return ctx.reply(message);
  }

  switch (commandType) {
    case "help":
      message = "🤖 Available Commands\n\n";
      result.commands.forEach((c) => {
        message += `/${c.command} - ${c.description}\n`;
      });
      break;

    case "start":
      message =
        `🤖 ${result.name}\n` +
        `Version: ${result.version}\n\n` +
        `${result.description}\n\n` +
        `📊 Status\n` +
        `User ID: ${result.userId}\n` +
        `Used Space: ${result.usedSpaceFormatted}\n` +
        `Server Port: ${result.serverPort}\n\n` +
        `GitHub: ${result.github}\n\n` +
        `Send /help for commands.`;
      break;

    case "stats":
      message =
        `📊 Global Statistics\n\n` +
        `🔽 Download: ${result.downloadSpeedFormatted}\n` +
        `🔼 Upload: ${result.uploadSpeedFormatted}\n` +
        `📦 Active: ${result.numActive}\n` +
        `⏳ Waiting: ${result.numWaiting}\n` +
        `🛑 Stopped: ${result.numStopped}`;
      break;

    case "download":
      message = `${result.type === "magnet" ? "🧲" : "🔗"} Download started\n\nTrack: status_${result.gid}\nSee all: /downloading`;
      break;

    case "status":
      message =
        `📊 Download Status\n\n` +
        `Status: ${result.status}\n` +
        `Progress: ${result.completedMB} MB / ${result.totalMB} MB (${result.progress}%)\n` +
        `Speed: ${result.downloadSpeedFormatted}\n`;
      if (result.status === "active") {
        message += `\nCancel: /cancel_${result.gid}`;
      }
      break;

    case "downloading":
      if (result.downloads.length === 0) {
        message = "No ongoing downloads.";
      } else {
        message = `📥 Ongoing Downloads\n\n`;
        result.downloads.slice(0, 5).forEach((d) => {
          message += `🆔 /status_${d.gid}\n`;
          message += `📊 ${d.status} - ${d.progress}%\n`;
          message += `💾 ${d.completedMB}/${d.totalMB} MB\n\n`;
        });
        if (result.downloads.length > 5) {
          message += `... and ${result.downloads.length - 5} more`;
        }
      }
      break;

    case "cancel":
      message = `❌ ${result.message}`;
      break;

    case "clean":
    case "autoclean":
      message = result.message;
      break;

    case "ip":
      message =
        `🌐 Server IP Info\n\n` +
        `IP: ${result.query}\n` +
        `Country: ${result.country}\n` +
        `Region: ${result.regionName}\n` +
        `City: ${result.city}\n` +
        `ISP: ${result.isp}`;
      break;

    case "time":
      message = `⏰ Server Time\n\n${result.iso}`;
      break;

    default:
      message = JSON.stringify(result, null, 2);
  }

  ctx.reply(message);
}

function startConfigPageServer() {
  const server = http.createServer(async (request, response) => {
    let ariaStats = null;
    let activeDownloads = 0;
    try {
      const stats = await getGlobalStats();
      if (stats && stats.result) {
        ariaStats = stats.result;
        activeDownloads = parseInt(stats.result.numActive) || 0;
      }
    } catch (error) {
      // If aria2 isn't running, stats stay null
    }

    // Calculate save directory size
    let saveDirectorySize = "0 Bytes";
    try {
      const sizeInBytes = await getDirectorySize(SAVE_DIR);
      saveDirectorySize = bytesToSize(sizeInBytes);
    } catch (error) {
      console.error("Error calculating directory size:", error.message);
    }

    // Read SMB credentials from file
    let ongoingDownloads = [];
    try {
      const downloadsData = await getOngoingDownloads();
      if (downloadsData && downloadsData.result) {
        ongoingDownloads = downloadsData.result.map((d) => {
          const total = parseInt(d.totalLength) || 0;
          const completed = parseInt(d.completedLength) || 0;
          const progress = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
          // Try to get a name from files
          let name = "Unknown";
          if (d.files && d.files.length > 0 && d.files[0].path) {
            name = d.files[0].path.split("/").pop();
          } else if (d.bittorrent && d.bittorrent.info && d.bittorrent.info.name) {
            name = d.bittorrent.info.name;
          }

          return {
            gid: d.gid,
            name: name,
            progress: progress,
            downloadSpeed: parseInt(d.downloadSpeed) || 0,
            totalLength: total,
            completedLength: completed,
          };
        });
      }
    } catch (error) {
      console.error("Error fetching ongoing downloads:", error.message);
    }

    // Determine the oldest file in the save directory (name + size)
    let oldestFileName = null;
    let oldestFileSize = "0 Bytes";
    let oldestFileMtime = null;
    try {
      const files = await getFilesRecursively(SAVE_DIR);
      if (files && files.length > 0) {
        files.sort((a, b) => a.mtime - b.mtime);
        const oldest = files[0];
        try {
          const stats = await fs.promises.stat(oldest.path);
          oldestFileName = oldest.path.split("/").pop();
          oldestFileSize = bytesToSize(stats.size);
          oldestFileMtime = oldest.mtime;
        } catch (e) {
          console.error("Error reading oldest file stats:", e.message);
        }
      }
    } catch (e) {
      // ignore - if directory doesn't exist or fails we'll just skip showing oldest file
    }

    const html = generateConfigPage({
      authCode: AUTH_CODE,
      botNsec: BOT_NSEC,
      botPubkey: BOT_PUBKEY,
      botNpub: BOT_NPUB,
      telegramToken: TELEGRAM_BOT_TOKEN,
      telegramBotUsername: telegramBotUsername,
      serverPort: SERVER_PORT,
      configPagePort: CONFIG_PAGE_PORT,
      autoCleanDays: AUTO_CLEAN_DAYS,
      telegramBotEnabled: !!telegramBot,
      nostrBotEnabled: !!nostrUnsubscribe,
      authorizedTelegramUsers: whitelist.telegram.size,
      authorizedNostrUsers: whitelist.nostr.size,
      activeDownloads: activeDownloads,
      ongoingDownloads: ongoingDownloads,
      ariaStats: ariaStats,
      version: VERSION,
      saveDirectorySize: saveDirectorySize,
      oldestFileName: oldestFileName,
      oldestFileSize: oldestFileSize,
      oldestFileMtime: oldestFileMtime,
    });

    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(html);
  });

  server.listen(CONFIG_PAGE_PORT, () => {
    console.log(`⚙️  Config page running on http://localhost:${CONFIG_PAGE_PORT}`);
  });
}

console.log("\n🚀 Starting Remote-Torrent-Downloader...\n");

startConfigPageServer();

if (TELEGRAM_BOT_TOKEN) {
  startTelegramBot();
}

startNostrBot();

async function runAutoCleanup() {
  console.log(`🧹 Running automatic cleanup (files older than ${AUTO_CLEAN_DAYS} days)...`);
  try {
    const result = await autoCleanOldFiles(SAVE_DIR, AUTO_CLEAN_DAYS);
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`ℹ️  ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Auto-cleanup error:", error);
  }
}

setTimeout(() => {
  runAutoCleanup();
}, 1000 * 60);

setInterval(() => {
  runAutoCleanup();
}, AUTO_CLEAN_INTERVAL_MS);

console.log(`🕒 Automatic cleanup scheduled every ${AUTO_CLEAN_INTERVAL_MS / 1000 / 60 / 60} hours for files older than ${AUTO_CLEAN_DAYS} days`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");

  if (telegramBot) {
    telegramBot.stop();
    console.log("✅ Telegram bot stopped");
  }

  if (nostrUnsubscribe) {
    try {
      nostrUnsubscribe();
      console.log("✅ Nostr listener unsubscribed");
    } catch (e) {
      console.warn("⚠️  Error while unsubscribing nostr listener:", e.message || e);
    }
  }

  process.exit(0);
});

console.log("\n✅ Bot is ready!\n");
