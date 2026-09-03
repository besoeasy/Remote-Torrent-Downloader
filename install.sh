#!/usr/bin/env bash
set -e

REPO="besoeasy/airlock"
AIRLOCK_URL="https://raw.githubusercontent.com/${REPO}/main/airlock"

echo "==> Airlock Installer"

# 1. Determine target directory
if [ "$(id -u)" -eq 0 ] || [ -w "/usr/local/bin" ]; then
    TARGET_DIR="/usr/local/bin"
    USE_SUDO=false
elif [ -f "$HOME/.local/bin/airlock" ]; then
    TARGET_DIR="$HOME/.local/bin"
    USE_SUDO=false
elif [ -f "/usr/local/bin/airlock" ] && sudo -n true 2>/dev/null; then
    TARGET_DIR="/usr/local/bin"
    USE_SUDO=true
else
    TARGET_DIR="$HOME/.local/bin"
    USE_SUDO=false
fi

TARGET_BIN="${TARGET_DIR}/airlock"
IS_UPDATE=false
if [ -f "$TARGET_BIN" ]; then
    IS_UPDATE=true
fi

if [ "$IS_UPDATE" = true ]; then
    echo "Updating Airlock at ${TARGET_BIN}..."
else
    echo "Installing Airlock to ${TARGET_BIN}..."
fi

# 2. Ensure target directory exists
if [ "$USE_SUDO" = true ]; then
    sudo mkdir -p "$TARGET_DIR"
else
    mkdir -p "$TARGET_DIR"
fi

# 3. Obtain airlock binary
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)"
if [ -f "${SCRIPT_DIR}/airlock" ] && [ "${SCRIPT_DIR}" != "$TARGET_DIR" ]; then
    cp "${SCRIPT_DIR}/airlock" "$TMP_FILE"
elif command -v curl >/dev/null 2>&1; then
    curl -fsSL "$AIRLOCK_URL" -o "$TMP_FILE"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TMP_FILE" "$AIRLOCK_URL"
else
    echo "Error: curl or wget is required to install Airlock." >&2
    exit 1
fi

chmod +x "$TMP_FILE"

# 4. Install binary
if [ "$USE_SUDO" = true ]; then
    sudo mv "$TMP_FILE" "$TARGET_BIN"
else
    mv "$TMP_FILE" "$TARGET_BIN"
fi

# 5. Check PATH if installed to ~/.local/bin
PATH_UPDATED=false
SHELL_RC=""
if [ "$TARGET_DIR" = "$HOME/.local/bin" ] && [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    SHELL_NAME="$(basename "${SHELL:-bash}")"
    case "$SHELL_NAME" in
        zsh)
            SHELL_RC="$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                SHELL_RC="$HOME/.bashrc"
            elif [ -f "$HOME/.bash_profile" ]; then
                SHELL_RC="$HOME/.bash_profile"
            else
                SHELL_RC="$HOME/.bashrc"
            fi
            ;;
        fish)
            SHELL_RC="$HOME/.config/fish/config.fish"
            ;;
        *)
            if [ -f "$HOME/.profile" ]; then
                SHELL_RC="$HOME/.profile"
            else
                SHELL_RC="$HOME/.bashrc"
            fi
            ;;
    esac

    if [ "$SHELL_NAME" = "fish" ]; then
        mkdir -p "$HOME/.config/fish"
        if ! grep -qs 'fish_add_path.*\.local/bin' "$SHELL_RC" 2>/dev/null; then
            echo 'fish_add_path $HOME/.local/bin' >> "$SHELL_RC"
            PATH_UPDATED=true
        fi
    else
        if ! grep -qs 'PATH=.*\.local/bin' "$SHELL_RC" 2>/dev/null; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
            PATH_UPDATED=true
        fi
    fi
fi

# 6. Check for container engine
CONTAINER_MSG=""
if ! command -v podman >/dev/null 2>&1 && ! command -v docker >/dev/null 2>&1; then
    CONTAINER_MSG="Note: Podman or Docker is required to run containers. Podman is recommended (https://podman.io)."
fi

# 7. Print completion message
echo
if [ "$IS_UPDATE" = true ]; then
    echo "✓ Airlock successfully updated at ${TARGET_BIN}"
else
    echo "✓ Airlock successfully installed at ${TARGET_BIN}"
fi

if [ -n "$CONTAINER_MSG" ]; then
    echo
    echo "$CONTAINER_MSG"
fi

if [ "$PATH_UPDATED" = true ]; then
    echo
    echo "Notice: Added ~/.local/bin to ${SHELL_RC}"
    echo "To use 'airlock' immediately in your current terminal session, run:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo "Or start a new terminal session."
else
    echo
    echo "Run 'airlock' to get started."
fi
