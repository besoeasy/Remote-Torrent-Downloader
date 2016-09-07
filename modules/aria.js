import axios from "axios";
import path from "path";
import os from "os";

const SAVE_DIR = path.join(os.tmpdir(), "streambox");

/**
 * Public tracker list to help find peers faster
 */
const PUBLIC_TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.tracker.cl:1337/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.dler.org:6969/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.0x7c0.com:6969/announce",
  "udp://tracker.moeking.me:6969/announce",
  "udp://uploads.gamecoast.net:6969/announce",
  "udp://tracker.altrosky.nl:6969/announce",
  "udp://tracker.tiny-vps.com:6969/announce",
  "udp://tracker.theoks.net:6969/announce",
  "udp://tracker1.myporn.club:9337/announce",
  "udp://bt.ktrackers.com:6666/announce",
  "udp://thouvenin.cloud:6969/announce",
  "udp://tracker.bittor.pw:1337/announce",
  "udp://tracker.swateam.org.uk:2710/announce",
  "http://tracker.openbittorrent.com:80/announce",
  "udp://opentracker.i2p.rocks:6969/announce",
];

/**
 * Make a JSON-RPC call to Aria2
 * @param {string} method - Aria2 method name
 * @param {Array} params - Method parameters
 * @returns {Promise<Object|null>} Response data or null on error
 */
const axiosPost = async (method, params = []) => {
  try {
    const { data } = await axios.post("http://localhost:6398/jsonrpc", {
      jsonrpc: "2.0",
      method,
      id: 1,
      params,
    });
    return data;
  } catch (error) {
    console.error(`❌ Aria2 ${method} error:`, error.message);
    return null;
  }
};

/**
 * Get global Aria2 statistics
 * @returns {Promise<Object|null>} Global stats or null
 */
export const getGlobalStats = async () => {
  return await axiosPost("aria2.getGlobalStat");
};

/**
 * Start a new download with Aria2
 * @param {string} userId - User identifier for organizing downloads
 * @param {string} url - URL or magnet link to download
 * @returns {Promise<Object|null>} Download info with GID or null
 */
export const downloadAria = async (userId, url) => {
  // Create date-based subdirectory for organization
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${year}${month}${day}`;

  const downloadDir = path.join(SAVE_DIR, userId, dateString);

  // Only set download-specific options (global options are in start.sh)
  const options = {
    dir: downloadDir,
    // Add extra trackers to this specific download
    "bt-tracker": PUBLIC_TRACKERS.join(","),
  };

  return await axiosPost("aria2.addUri", [[url], options]);
};

/**
 * Get status of a specific download
 * @param {string} gid - Aria2 GID (download identifier)
 * @returns {Promise<Object|null>} Download status or null
 */
export const getDownloadStatus = async (gid) => {
  return await axiosPost("aria2.tellStatus", [gid]);
};

/**
 * Get list of active downloads
 * @returns {Promise<Object|null>} Active downloads or null
 */
export const getOngoingDownloads = async () => {
  return await axiosPost("aria2.tellActive");
};

/**
 * Cancel an ongoing download
 * @param {string} gid - Aria2 GID to cancel
 * @returns {Promise<Object|null>} Cancellation result or null
 */
export const cancelDownload = async (gid) => {
  return await axiosPost("aria2.remove", [gid]);
};

/**
 * Get Aria2 version info (useful for health checks)
 * @returns {Promise<Object|null>} Version info or null
 */
export const getVersion = async () => {
  return await axiosPost("aria2.getVersion");
};

/**
 * Get list of waiting downloads
 * @returns {Promise<Object|null>} Waiting downloads or null
 */
export const getWaitingDownloads = async () => {
  return await axiosPost("aria2.tellWaiting", [0, 100]);
};

/**
 * Get list of stopped downloads
 * @returns {Promise<Object|null>} Stopped downloads or null
 */
export const getStoppedDownloads = async () => {
  return await axiosPost("aria2.tellStopped", [0, 100]);
};

/**
 * Health check - verify Aria2 is responding
 * @returns {Promise<boolean>} True if Aria2 is healthy
 */
export const healthCheck = async () => {
  try {
    const version = await getVersion();
    return version && version.result ? true : false;
  } catch (error) {
    return false;
  }
};

export { SAVE_DIR };
