# aetherengine-website

The documentation site for [AetherEngine](https://github.com/superuser404notfound/AetherEngine), served at [aetherengine.superuser404.de](https://aetherengine.superuser404.de).

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build). The landing and guides are authored here; the reference docs (Formats, Architecture, CLI) and the Changelog are fetched from the AetherEngine repo `main` at build time by `scripts/sync-docs.mjs`, which also records the latest release tag for the version pill.

## Local development

```bash
npm install
npm run dev      # runs the doc sync, then starts the dev server
npm run build    # runs the doc sync, then builds static output to dist/
```

`npm run sync` (re-run automatically before dev and build) regenerates:

- `src/content/docs/reference/{formats,architecture,cli}.md`
- `src/content/docs/project/changelog.md`
- `src/data/version.json`

These are git-ignored. To update the reference docs, edit them in the AetherEngine repo and rebuild here. The build needs outbound HTTPS to reach `raw.githubusercontent.com` and the GitHub API.

## Deployment (VPS + Docker + Pangolin)

The site is a static build packaged in a multi-stage image whose final stage serves `dist/` with `static-web-server` on port 8080. TLS, the public hostname, and WAF are handled by Pangolin; the container only speaks plain HTTP.

```bash
git pull
docker compose up -d --build
```

Point a Pangolin resource for `aetherengine.superuser404.de` at the container on port 8080. Rebuilding picks up the latest AetherEngine docs and release tag.
