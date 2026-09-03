#!/usr/bin/env bash
set -e

SELF="$(readlink -f "$0" 2>/dev/null || echo "$0")"

install() {
    local bin_dir="$HOME/.local/bin"
    mkdir -p "$bin_dir"
    cp "$SELF" "$bin_dir/airlock"
    chmod +x "$bin_dir/airlock"
    sed -i '/# airlock-start/,/# airlock-end/d' ~/.bashrc 2>/dev/null || true
    echo "Airlock installed to $bin_dir/airlock"
    echo "Run 'airlock' from any directory — no .bashrc changes needed."
}

update() {
    echo "Updating airlock..."
    local tmp
    tmp=$(mktemp)
    if curl -fsSL https://raw.githubusercontent.com/besoeasy/airlock/main/airlock.sh -o "$tmp"; then
        chmod +x "$tmp"
        mv "$tmp" "$SELF"
        echo "Airlock updated successfully."
    else
        rm -f "$tmp"
        echo "Error: failed to download update." >&2
        exit 1
    fi
}

detect_runtime() {
    if command -v docker >/dev/null 2>&1; then
        echo "docker"
    elif command -v podman >/dev/null 2>&1; then
        echo "podman"
    else
        echo "Error: docker or podman required." >&2
        exit 1
    fi
}

launch() {
    local name="$1"
    local rt
    rt=$(detect_runtime)

    case "$name" in
        alpine)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                alpine:latest sh
            ;;
        bun)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e BUN_INSTALL_CACHE_DIR=/workspace/.bun-cache \
                oven/bun:latest bash
            ;;
        debian)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                debian:stable bash
            ;;
        deno)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e DENO_DIR=/workspace/.deno-cache \
                --entrypoint /bin/bash \
                denoland/deno:latest
            ;;
        go)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e GOPATH=/workspace/.go -e HOME=/workspace \
                golang:latest bash
            ;;
        node)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e npm_config_cache=/workspace/.npm-cache \
                node:lts bash
            ;;
        opencode)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                ghcr.io/anomalyco/opencode
            ;;
        python)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e PIP_CACHE_DIR=/workspace/.pip-cache \
                -e HOME=/workspace \
                python:3 bash
            ;;
        rust)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e CARGO_HOME=/workspace/.cargo -e HOME=/workspace \
                rust:latest bash
            ;;
        ubuntu)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                ubuntu:latest bash
            ;;
        zig)
            $rt run -it --rm --pids-limit 256 --network host \
                -v "${PWD}:/workspace" -w /workspace \
                -e ZIG_GLOBAL_CACHE_DIR=/workspace/.zig-cache \
                --entrypoint /bin/sh \
                euantorano/zig:latest
            ;;
        *)
            echo "Unknown runtime: $name" >&2
            echo "Runtimes: alpine, bun, debian, deno, go, node, opencode, python, rust, ubuntu, zig" >&2
            exit 1
            ;;
    esac
}

menu() {
    local rt
    rt=$(detect_runtime)
    echo "Airlock — $rt detected"
    echo
    echo "0) Update"
    echo "1) Alpine"
    echo "2) Bun"
    echo "3) Debian"
    echo "4) Deno"
    echo "5) Go"
    echo "6) Node.js"
    echo "7) OpenCode"
    echo "8) Python"
    echo "9) Rust"
    echo "10) Ubuntu"
    echo "11) Zig"
    echo
    read -rp "Select runtime: " choice

    case "$choice" in
        0) update ;;
        1) launch alpine ;;
        2) launch bun ;;
        3) launch debian ;;
        4) launch deno ;;
        5) launch go ;;
        6) launch node ;;
        7) launch opencode ;;
        8) launch python ;;
        9) launch rust ;;
        10) launch ubuntu ;;
        11) launch zig ;;
        *) echo "Invalid option." >&2; exit 1 ;;
    esac
}

if [ "${1:-}" = "--install" ]; then
    install
elif [ "${1:-}" = "--update" ]; then
    update
elif [ -n "${1:-}" ]; then
    launch "$1"
else
    menu
fi
