# SimVQ

`SimVQ` is a CLI-first inference companion for SimVQ-based POD5 compression and reconstruction workflows.

Current status:

- Project skeleton is in place.
- `doctor`, `model`, and `inspect` commands are scaffolded.
- A local `stub_random` model flow exists so the non-training application structure can be exercised.
- A real `.pod5 -> .vq.tar.gz -> .pod5` round-trip now runs end-to-end with the stub model.

## Install

```bash
pip install -e .
```

## Quick Start

Show environment status:

```bash
simvq doctor
```

List built-in remote model entries:

```bash
simvq model list-remote
```

Pull the stub model into the local cache:

```bash
simvq model pull simvq-v45-stub
```

Show the pulled model:

```bash
simvq model show simvq-v45-stub
```

Inspect a bundle manifest:

```bash
simvq inspect /path/to/sample.vq.tar.gz
```

Encode a POD5 file:

```bash
simvq encode input.pod5 --model simvq-v45-stub --output input.vq.tar.gz
```

Decode a bundle back to POD5:

```bash
simvq decode input.vq.tar.gz --model simvq-v45-stub --output reconstructed.pod5
```

## Desktop GUI

An Electron desktop shell now sits on top of the existing Python CLI.

Install desktop dependencies:

```bash
npm install
```

Run the desktop app in development mode:

```bash
npm run desktop:dev
```

Run the desktop smoke test against the local CLI and the existing sample bundle:

```bash
npm run desktop:smoke
```

Build an unpacked desktop app:

```bash
npm run desktop:pack
```

Notes for the desktop app:

- It still depends on an external Python environment with the SimVQ runtime dependencies installed.
- The GUI calls `python -m simvq.cli.main` and uses `PYTHONPATH=<repo>/src`.
- Real-model execution now uses the built-in SimVQ model builder; an external `SimVQGAN` source checkout is no longer required.
- If you run a packaged app, make sure the Python executable is valid in the Settings page.
- Current GUI pages include Doctor, Models, Encode, Decode, Inspect, and Tasks / History.

## Notes

- This repository is inference-only by design.
- Training and finetuning are explicitly out of scope.
- The current runtime contains a deterministic stub model for scaffolding; it is not meant to represent real reconstruction quality.
