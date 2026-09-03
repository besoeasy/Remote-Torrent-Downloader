<img width="910" height="592" alt="airlock" src="https://github.com/user-attachments/assets/8dce039c-01e6-459a-b03a-d8630774a38d" />


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
airlock            # interactive menu with repository and version
airlock node       # direct launch
airlock python     # direct launch
airlock --version  # show local and remote versions
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
