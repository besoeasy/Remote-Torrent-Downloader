<div align="center">

# Airlock

**Run untrusted code without trusting it.**

</div>

## Install & Update

```bash
curl -fsSL https://raw.githubusercontent.com/besoeasy/airlock/main/airlock.sh -o ~/.airlock.sh && chmod +x ~/.airlock.sh && sed -i '/# airlock-start/,/# airlock-end/d' ~/.bashrc 2>/dev/null; printf '\n# airlock-start\nairlock() { bash ~/.airlock.sh "$@"; }\n# airlock-end\n' >> ~/.bashrc && source ~/.bashrc
```

## Usage

```bash
airlock            # interactive menu
airlock node       # direct launch
airlock python     # direct launch
airlock --update   # update to latest version
```

## Features

- Disposable containers — exit and everything is gone
- Mounts your current directory at `/workspace`
- No data leaks to host
- Fork bomb protection (`--pids-limit 256`)
- Auto-detects Docker or Podman
- 11 runtimes: Node, Bun, Deno, Python, Go, Rust, Zig, Debian, Ubuntu, Alpine, OpenCode

## Use cases

- Run `npm install` from a cloned repo without trusting it
- Try a language or tool without installing it on your machine
- Isolate build processes from your host
- Test on a clean Linux environment
- Run untrusted scripts safely

## License

MIT
