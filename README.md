# link-stash

Save links, tag them, search them and share a list read-only.

A sample product built by the forger work loop: owner requests are GitHub issues
labelled `ready-for-agent`, the loop builds each one on its own branch, and a PR
merges only when the gates in `.forger/workloop.config.json` and CI pass.

## Develop

```
bun install
bun run check
```
