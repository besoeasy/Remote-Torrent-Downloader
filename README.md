<img width="910" height="592" alt="airlock" src="https://github.com/user-attachments/assets/8dce039c-01e6-459a-b03a-d8630774a38d" />


<div align="center">

# Airlock

**Run untrusted code without trusting it.**

</div>

## Install & Update

```bash
mkdir -p ~/.local/bin && curl -fsSL https://raw.githubusercontent.com/besoeasy/airlock/main/airlock -o ~/.local/bin/airlock && chmod +x ~/.local/bin/airlock
```

> If `~/.local/bin` is not in your `$PATH`, the script will add it to `~/.bashrc` automatically on first run. Log out and back in, or run `source ~/.bashrc` to apply.

## Usage

```bash
airlock            # interactive category menu with repository and version
airlock [runtime]  # directly launch a specific runtime (e.g. airlock python)
airlock --version  # show local and remote versions
```

## Features

- Disposable containers — exit and everything is gone
- Mounts your current directory at `/workspace`
- No data leaks to host
- Fork bomb protection (`--pids-limit 256`)
- Auto-detects Docker or Podman (Podman recommended)
- 20 runtimes organized into 4 categories:
  - **Programming Languages:** Bun, C/C++ (GCC), Deno, Go, Node.js, PHP, Python, Ruby, Rust, Zig
  - **Linux Distributions:** Alpine, Arch Linux, Debian, Fedora, Nix, Ubuntu
  - **AI Coding Agents:** Aider, OpenCode
  - **Security & Auditing:** Kali Linux, Trivy (Security Scanner)

> [!TIP]
> Airlock recommends and works best with **[Podman](https://podman.io/)** — rootless and daemonless containers provide an extra layer of security when running untrusted code. Docker is also supported.

## Use cases

- Run AI coding agents (Aider, OpenCode) safely in a sandbox without giving LLMs host access
- Run `npm install`, `bundle install`, or `composer install` from a cloned repo without trusting it
- Try a language or tool without installing it on your machine
- Scan cloned repositories for vulnerabilities and secrets with Trivy
- Inspect suspicious binaries and reverse-engineer safely in Kali Linux
- Isolate build processes from your host
- Test scripts and packages across different Linux distributions
- Run untrusted scripts safely

## License

MIT
