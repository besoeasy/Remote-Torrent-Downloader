#!/usr/bin/env bash
set -e

SELF="$(readlink -f "$0" 2>/dev/null || echo "$0")"
VERSION="0.0.1"
REMOTE_VERSION_URL="https://raw.githubusercontent.com/besoeasy/airlock/main/.ver"

show_version() {
    local remote_version
    if remote_version=$(curl -fsSL "$REMOTE_VERSION_URL" 2>/dev/null); then
        remote_version=$(printf '%s' "$remote_version" | tr -d '[:space:]')
    else
        remote_version="unavailable"
    fi

    echo "Airlock version: $VERSION"
    echo "Remote version: $remote_version"
}

show_help() {
    echo "Usage: airlock [--version|-v|--update|--help|-h|runtime]"
    echo
    echo "Commands:"
    echo "  --version, -v  Show local and remote versions"
    echo "  --update       Update airlock"
    echo "  --help, -h     Show this help"
    echo
    echo "Runtimes: alpine, bun, debian, deno, go, node, opencode, python, rust, ubuntu, zig"
}

update() {
    echo "Updating airlock..."
    local tmp
    tmp=$(mktemp)
    local target="$HOME/.local/bin/airlock"
    if curl -fsSL https://raw.githubusercontent.com/besoeasy/airlock/main/airlock.sh -o "$tmp"; then
        chmod +x "$tmp"
        mv "$tmp" "$target"
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

get_network_args() {
    local ports
    read -rp "Ports to open (space-separated, e.g. 3000 8080) or Enter for --network host: " ports

    if [ -z "$ports" ]; then
        echo "--network host"
    else
        local args=""
        local p
        for p in $ports; do
            args="$args -p $p:$p"
        done
        echo "$args"
    fi
}

launch() {
    local name="$1"
    local rt
    rt=$(detect_runtime)
    local net_args
    net_args=$(get_network_args)

    case "$name" in
        alpine)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                alpine:latest sh
            ;;
        bun)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                oven/bun:latest bash
            ;;
        debian)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                debian:stable bash
            ;;
        deno)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                --entrypoint /bin/bash \
                denoland/deno:latest
            ;;
        go)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                golang:latest bash
            ;;
        node)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                node:lts bash
            ;;
        opencode)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                ghcr.io/anomalyco/opencode
            ;;
        python)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                python:3 bash
            ;;
        rust)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                rust:latest bash
            ;;
        ubuntu)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
                -e HOME=/workspace \
                ubuntu:latest bash
            ;;
        zig)
            $rt run -it --rm --pids-limit 256 $net_args \
                -v "${PWD}:/workspace" -w /workspace \
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
    echo "Airlock $VERSION — $rt detected"
    show_version | sed -n '2p'
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

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "help" ]; then
    show_help
elif [ "${1:-}" = "--version" ] || [ "${1:-}" = "-v" ]; then
    show_version
elif [ "${1:-}" = "--update" ]; then
    update
elif [ -n "${1:-}" ]; then
    launch "$1"
else
    menu
fi
