<img width="800" height="520" alt="airlock" src="https://github.com/user-attachments/assets/b6ee4511-4a93-4bd5-8d0e-bed3409bf07a" />


<div align="center">

# Airlock

**Run untrusted code without trusting it.**

</div>

## Install & Update

```bash
curl -fsSL https://raw.githubusercontent.com/besoeasy/airlock/main/airlock.sh -o ~/.local/bin/airlock && chmod +x ~/.local/bin/airlock
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
