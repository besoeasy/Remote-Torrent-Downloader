<img width="941" height="551" alt="image" src="https://github.com/user-attachments/assets/a17b8caa-c63a-4a95-9ed7-52735c2a2476" />


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



https://github.com/user-attachments/assets/d3648565-e047-431d-bc6f-0d38465f2a53



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
