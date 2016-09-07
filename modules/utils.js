import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Convert bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate total size of a directory recursively
 * @param {string} directory - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
export async function getDirectorySize(directory) {
  try {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return getDirectorySize(fullPath);
        }
        return fs.promises.stat(fullPath).then((stat) => stat.size);
      })
    );
    return sizes.reduce((acc, size) => acc + size, 0);
  } catch (error) {
    if (error.code === "ENOENT") {
      return 0; // Directory does not exist
    }
    throw error;
  }
}

/**
 * Get all files recursively from a directory with their metadata
 * @param {string} dir - Directory path
 * @returns {Promise<Array>} Array of file objects with path and mtime
 */
export async function getFilesRecursively(dir) {
  const files = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await getFilesRecursively(fullPath)));
      } else if (entry.isFile()) {
        const stats = await fs.promises.stat(fullPath);
        files.push({ path: fullPath, mtime: stats.mtimeMs });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  return files;
}

/**
 * Remove empty folders recursively
 * @param {string} dir - Directory path
 * @param {string} saveDir - Root save directory (won't delete this)
 */
export async function removeEmptyFolders(dir, saveDir) {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await removeEmptyFolders(fullPath, saveDir);
      }
    }
    const isEmpty = (await fs.promises.readdir(dir)).length === 0;
    if (isEmpty && dir !== saveDir) {
      await fs.promises.rmdir(dir);
      console.log(`🗑️  Removed empty folder: ${dir}`);
    }
  } catch (error) {
    console.error(`Error removing empty folders from ${dir}:`, error.message);
  }
}

/**
 * Delete the oldest file from a directory
 * @param {string} saveDir - Directory to clean
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function deleteOldestFile(saveDir) {
  try {
    const files = await getFilesRecursively(saveDir);
    if (!files.length) {
      return { success: false, message: "No files to delete." };
    }
    files.sort((a, b) => a.mtime - b.mtime);
    const oldestFile = files[0];
    await fs.promises.unlink(oldestFile.path);
    console.log(`🗑️  Deleted: ${oldestFile.path}`);
    await removeEmptyFolders(saveDir, saveDir);
    return { success: true, message: `Deleted: ${path.basename(oldestFile.path)}` };
  } catch (error) {
    console.error("Error deleting files:", error.message);
    return { success: false, message: "Failed to delete files." };
  }
}

/**
 * Auto-clean files older than specified days
 * @param {string} saveDir - Directory to clean
 * @param {number} daysOld - Age threshold in days (default 30)
 * @returns {Promise<Object>} Result object with stats
 */
export async function autoCleanOldFiles(saveDir, daysOld = 30) {
  try {
    const files = await getFilesRecursively(saveDir);
    if (!files.length) {
      return { success: false, message: "No files found to auto-clean." };
    }

    const thresholdTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const oldFiles = files.filter((file) => file.mtime < thresholdTime);

    if (!oldFiles.length) {
      return { success: false, message: `No files older than ${daysOld} days found.` };
    }

    let deletedCount = 0;
    let totalSize = 0;

    for (const file of oldFiles) {
      try {
        const stats = await fs.promises.stat(file.path);
        totalSize += stats.size;
        await fs.promises.unlink(file.path);
        deletedCount++;
        console.log(`🗑️  Auto-deleted: ${file.path}`);
      } catch (error) {
        console.error(`Failed to delete ${file.path}:`, error.message);
      }
    }

    await removeEmptyFolders(saveDir, saveDir);

    return {
      success: true,
      deletedCount,
      totalSize,
      message: `Auto-clean completed!\nDeleted ${deletedCount} files older than ${daysOld} days\nFreed up ${bytesToSize(totalSize)} of space`,
    };
  } catch (error) {
    console.error("Error during auto-clean:", error.message);
    return { success: false, message: "Auto-clean failed. Try again later." };
  }
}

/**
 * Get server IP information
 * @returns {Promise<Object|null>} IP data or null
 */
export async function getIpData() {
  try {
    const { data } = await axios.get("http://ip-api.com/json/");

    if (data.status === "fail") {
      throw new Error(data.message || "IP API request failed");
    }
    return {
      query: data.query,
      country: data.country,
      regionName: data.regionName,
      city: data.city,
      isp: data.isp,
    };
  } catch (error) {
    console.error("Failed to fetch IP data:", error.message);
    return null;
  }
}

/**
 * Shorten a string for display (useful for pubkeys, hashes, etc.)
 * @param {string} str - String to shorten
 * @param {number} startChars - Characters to show at start (default 6)
 * @param {number} endChars - Characters to show at end (default 4)
 * @returns {string} Shortened string
 */
export function short(str, startChars = 6, endChars = 4) {
  if (!str || str.length <= startChars + endChars + 3) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Generate a random alphanumeric code
 * @param {number} minLength - Minimum length (default 10)
 * @param {number} maxLength - Maximum length (default 20)
 * @returns {string} Random code
 */
export function randomCode(minLength = 10, maxLength = 20) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Clean user identifier (convert to string)
 * @param {any} input - User identifier
 * @returns {string} Cleaned string
 */
export function cleanUser(input) {
  return String(input);
}

/**
 * Shuffle an array using Fisher-Yates algorithm and return a new array
 * @param {Array} inputArray - Array to shuffle
 * @returns {Array} Shuffled copy of the array
 */
export function shuffleArray(inputArray) {
  if (!Array.isArray(inputArray)) {
    return inputArray;
  }
  const array = inputArray.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Default Nostr relay list
 */
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.oxtr.dev",
  "wss://relay.nostr.band",
  "wss://nostr.wine",
  "wss://relay.primal.net",
  "wss://nostr.mom",
  "wss://relay.nostr.info",
  "wss://nostr-relay.wlvs.space",
  "wss://relay.current.fyi",
  "wss://brb.io",
  "wss://nostr.fmt.wiz.biz",
];
