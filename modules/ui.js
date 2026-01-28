/**
 * Generate HTML for the configuration dashboard page
 * @param {Object} config - Configuration object
 * @returns {string} HTML string
 */
export function generateConfigPage(config) {
  const {
    authCode,
    botNsec,
    botPubkey,
    botNpub,
    telegramToken,
    telegramBotUsername,
    autoCleanDays,
    telegramBotEnabled,
    nostrBotEnabled,
    authorizedTelegramUsers,
    authorizedNostrUsers,
    activeDownloads,
    ongoingDownloads,
    ariaStats,
    saveDirectorySize,
    oldestFileName,
    oldestFileSize,
    oldestFileMtime,
    smbCredentials,
  } = config;

  // Calculate ETA for oldest file deletion
  let oldestFileEta = "N/A";
  if (oldestFileMtime && autoCleanDays) {
    const deleteTime = oldestFileMtime + autoCleanDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (deleteTime > now) {
      const remainingMs = deleteTime - now;
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      oldestFileEta = `${remainingDays}d ${remainingHours}h`;
    } else {
      oldestFileEta = "Overdue";
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="20">
  <title>Remote-Torrent-Downloader</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    
    /* Keyframe Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    /* Apply animations */
    header {
      animation: fadeIn 0.6s ease-out;
    }
    
    section {
      animation: slideUp 0.6s ease-out;
      animation-fill-mode: both;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    section:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    
    /* Stagger animations for grid items */
    .grid section:nth-child(1) {
      animation-delay: 0.1s;
    }
    
    .grid section:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .grid section:nth-child(3) {
      animation-delay: 0.3s;
    }
    
    /* Button animations */
    a[href] {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    a[href]:hover {
      transform: translateY(-1px);
    }
    
    a[href]:active {
      transform: translateY(0);
    }
    
    /* Download item animations */
    .download-item {
      animation: slideInLeft 0.5s ease-out;
      animation-fill-mode: both;
      transition: all 0.3s ease;
    }
    
    .download-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    /* Progress bar animation */
    .progress-bar {
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 2s infinite;
    }
    
    /* Stats pulse animation */
    .stat-value {
      animation: pulse 2s ease-in-out infinite;
    }
    
    /* Badge animations */
    .status-badge {
      transition: all 0.3s ease;
    }
    
    .status-badge:hover {
      transform: scale(1.05);
    }
    
    /* Code block hover */
    code {
      transition: all 0.2s ease;
    }
    
    code:hover {
      background-color: rgba(0, 0, 0, 0.08) !important;
      transform: scale(1.02);
    }
    
    /* Icon animations */
    svg {
      transition: transform 0.3s ease;
    }
    
    a:hover svg {
      transform: scale(1.1) rotate(5deg);
    }
    
    /* Empty state animation */
    .empty-state {
      animation: fadeIn 0.8s ease-out;
    }
    
    /* Footer fade in */
    footer {
      animation: fadeIn 1s ease-out 0.5s;
      animation-fill-mode: both;
    }
    
    /* Smooth scroll */
    html {
      scroll-behavior: smooth;
    }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
          }
        }
      }
    }
  </script>
  <script>
    // Apply stagger animation to download items
    document.addEventListener('DOMContentLoaded', function() {
      const downloadItems = document.querySelectorAll('.download-item');
      downloadItems.forEach((item, index) => {
        item.style.animationDelay = \`\${index * 0.1}s\`;
      });
    });
  </script>
</head>
<body class="bg-zinc-50 text-zinc-900 min-h-screen selection:bg-black selection:text-white">
  
  <div class="max-w-6xl mx-auto p-6 space-y-8">
    
    <!-- Header -->
    <header class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
      <div class="text-center sm:text-left">
        <h1 class="text-3xl font-bold tracking-tight text-black">Remote-Torrent-Downloader</h1>
        <p class="text-sm text-zinc-500 font-medium">Dashboard</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="https://sponsor.besoeasy.com/" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-medium rounded-full transition-all shadow-sm hover:shadow-md">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span>Sponsor</span>
        </a>
        <a href="https://github.com/besoeasy/Remote-Torrent-Downloader" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-full transition-all shadow-sm hover:shadow-md">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.262.793-.583 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.004.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.625-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.015 2.899-.015 3.293 0 .323.192.699.8.581C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
          <span>GitHub</span>
        </a>
      </div>
    </header>

    <!-- Auth Code -->
    <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-zinc-50 rounded-xl">
          <svg class="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-zinc-900">Authentication Code</h2>
          <p class="text-xs text-zinc-500">Use this code to authorize new devices</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <code class="text-xl font-mono bg-zinc-50 px-4 py-2 rounded-lg text-zinc-900 font-bold border border-zinc-200 tracking-wider select-all">${authCode}</code>
      </div>
    </section>

    <!-- Top Grid: System & Bots -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- System Status -->
      <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-between">
        <div>
          <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">System Status</h2>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-sm text-zinc-600">Storage Used</span>
              <span class="text-sm font-mono font-bold text-zinc-900">${
                saveDirectorySize || "0 B"
              }</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-zinc-600">Auto Clean</span>
              <span class="text-sm font-mono font-bold text-zinc-900">${autoCleanDays} days</span>
            </div>
          </div>
        </div>
        
        <div class="mt-6 pt-4 border-t border-zinc-50">
           <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">SMB Share</h3>
           <div class="space-y-2">
             <div class="flex justify-between items-center">
              <span class="text-sm text-zinc-600">User</span>
              <code class="text-sm font-mono text-zinc-900">${
                smbCredentials?.smbUser || "N/A"
              }</code>
            </div>
             <div class="flex justify-between items-center">
              <span class="text-sm text-zinc-600">Pass</span>
              <code class="text-sm font-mono text-zinc-900">${
                smbCredentials?.smbPass || "N/A"
              }</code>
            </div>
          </div>
        </div>
      </section>

      <!-- Telegram -->
      <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 relative overflow-hidden">
         <div class="absolute top-0 right-0 p-4 opacity-5">
            <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
         </div>
         <div class="relative z-10">
           <div class="flex items-center justify-between mb-4">
             <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Telegram</h2>
             <span class="status-badge px-2 py-0.5 rounded-full text-[10px] font-bold ${
               telegramBotEnabled
                 ? "bg-emerald-100 text-emerald-700"
                 : "bg-zinc-100 text-zinc-500"
             }">
               ${telegramBotEnabled ? "ONLINE" : "OFFLINE"}
             </span>
           </div>
           
           ${
             telegramBotUsername
               ? `
             <div class="mb-4">
               <div class="text-sm text-zinc-500 mb-1">Bot Username</div>
               <a href="https://t.me/${telegramBotUsername}" target="_blank" class="text-lg font-bold text-blue-600 hover:underline">@${telegramBotUsername}</a>
             </div>
           `
               : ""
           }

           <div class="flex justify-between items-center pt-4 border-t border-zinc-50">
             <span class="text-xs text-zinc-500">Authorized Users</span>
             <span class="text-sm font-bold text-zinc-900">${
               authorizedTelegramUsers || 0
             }</span>
           </div>
         </div>
      </section>

      <!-- Nostr -->
      <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 relative overflow-hidden">
         <div class="absolute top-0 right-0 p-4 opacity-5">
            <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 12c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8 8-3.582 8-8zM8 12h.01M12 12h.01M16 12h.01"/></svg>
         </div>
         <div class="relative z-10">
           <div class="flex items-center justify-between mb-4">
             <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nostr</h2>
             <span class="status-badge px-2 py-0.5 rounded-full text-[10px] font-bold ${
               nostrBotEnabled
                 ? "bg-purple-100 text-purple-700"
                 : "bg-zinc-100 text-zinc-500"
             }">
               ${nostrBotEnabled ? "ONLINE" : "OFFLINE"}
             </span>
           </div>

           ${
             botNpub
               ? `
             <div class="mb-4">
               <div class="text-sm text-zinc-500 mb-1">Public Key</div>
               <div class="text-xs font-mono text-zinc-800 truncate" title="${botNpub}">${botNpub.substring(
                   0,
                   12
                 )}...${botNpub.substring(botNpub.length - 8)}</div>
               <div class="flex gap-2 mt-2">
                 <a href="https://primal.net/p/${botNpub}" target="_blank" class="text-xs font-medium text-purple-600 hover:text-purple-700">Primal ↗</a>
                 <a href="https://nostrudel.ninja/#/u/${botNpub}" target="_blank" class="text-xs font-medium text-purple-600 hover:text-purple-700">Nostrudel ↗</a>
               </div>
             </div>
           `
               : ""
           }

           <div class="flex justify-between items-center pt-4 border-t border-zinc-50">
             <span class="text-xs text-zinc-500">Authorized Users</span>
             <span class="text-sm font-bold text-zinc-900">${
               authorizedNostrUsers || 0
             }</span>
           </div>
         </div>
      </section>

    </div>

    <!-- Bottom Row: Activity & Downloads -->
    <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-bold text-zinc-900">Activity</h2>
          ${
            activeDownloads > 0
              ? `
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          `
              : ""
          }
        </div>
        
        <!-- Global Stats -->
        <div class="flex items-center gap-6 text-sm">
           <div class="flex items-center gap-2">
              <span class="text-zinc-400">⬇</span>
              <span class="stat-value font-mono font-bold text-zinc-900">${
                ariaStats
                  ? (parseInt(ariaStats.downloadSpeed) / 1024 / 1024).toFixed(1)
                  : "0.0"
              } MB/s</span>
           </div>
           <div class="flex items-center gap-2">
              <span class="text-zinc-400">⬆</span>
              <span class="stat-value font-mono font-bold text-zinc-900">${
                ariaStats
                  ? (parseInt(ariaStats.uploadSpeed) / 1024 / 1024).toFixed(1)
                  : "0.0"
              } MB/s</span>
           </div>
        </div>
      </div>

      <!-- Downloads List -->
      <div class="space-y-4">
        ${
          ongoingDownloads && ongoingDownloads.length > 0
            ? ongoingDownloads
                .map(
                  (d) => `
          <div class="download-item bg-zinc-50 rounded-xl p-4 border border-zinc-100">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
              <div class="font-medium text-sm text-zinc-900 truncate max-w-lg" title="${
                d.name
              }">${d.name}</div>
              <div class="flex items-center gap-3 text-xs">
                <span class="font-mono text-zinc-500">${(
                  d.downloadSpeed /
                  1024 /
                  1024
                ).toFixed(1)} MB/s</span>
                <span class="font-bold text-zinc-900">${d.progress}%</span>
              </div>
            </div>
            <div class="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div class="progress-bar bg-black h-2 rounded-full" style="width: ${
                d.progress
              }%"></div>
            </div>
             <div class="flex justify-between items-center mt-2 text-[10px] text-zinc-400 font-mono">
                <span>GID: ${d.gid}</span>
                <span>${(d.completedLength / 1024 / 1024).toFixed(0)} / ${(
                    d.totalLength /
                    1024 /
                    1024
                  ).toFixed(0)} MB</span>
             </div>
          </div>
        `
                )
                .join("")
            : `
          <div class="empty-state text-center py-12 text-zinc-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <p class="text-sm">No active downloads</p>
          </div>
        `
        }
      </div>
    </section>

    <!-- Oldest file (below Activity) -->
    <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mt-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-bold text-zinc-900">Oldest file</h2>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="w-full sm:w-1/3">
          <div class="text-xs text-zinc-500 mb-1">Filename</div>
          <div class="text-sm font-mono text-zinc-900 truncate" title="${oldestFileName || "N/A"}">${oldestFileName || "No files found"}</div>
        </div>
        <div class="w-full sm:w-1/3 text-center">
          <div class="text-xs text-zinc-500 mb-1">Size</div>
          <div class="text-sm font-mono font-bold text-zinc-900">${oldestFileSize || "0 Bytes"}</div>
        </div>
        <div class="w-full sm:w-1/3 text-right">
          <div class="text-xs text-zinc-500 mb-1">ETA Delete</div>
          <div class="text-sm font-mono font-bold text-zinc-900">${oldestFileEta}</div>
        </div>
      </div>
    </section>

    <footer class="text-center pt-8 pb-4">
      <p class="text-xs text-zinc-400 font-mono">${new Date().toISOString()}</p>
    </footer>

  </div>
</body>
</html>
  `;
}
