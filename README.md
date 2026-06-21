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

## Deployment (CI + GHCR + Watchtower)

The build runs in GitHub Actions, not on the VPS. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the multi-stage image (whose final stage serves `dist/` with `static-web-server` on port 8080) and pushes it to `ghcr.io/superuser404notfound/aetherengine-website:latest`. On the VPS, Watchtower watches the `latest` tag and redeploys the container when the digest changes. TLS, the public hostname, and WAF are handled by Pangolin; the container only speaks plain HTTP.

The CI rebuilds on three triggers:

- **Website source change** — push to `main` (or `workflow_dispatch`).
- **AetherEngine docs change** — AetherEngine's `notify-website.yml` sends a `repository_dispatch` (`engine-docs-updated`) here with the new `main` SHA whenever `README.md`, `docs/**`, or `CHANGELOG.md` change. This is what keeps the reference docs in sync without touching this repo.
- **Daily schedule** — a safety net (05:00 UTC) in case a dispatch is ever missed.

The docs are fetched at build time from AetherEngine `main`, so the build layer is keyed on an `ENGINE_SHA` build arg (set by CI to the current main SHA). Without it, both the Docker and the GHA layer cache would reuse a stale build and never re-fetch the new docs.

### VPS setup (one-time)

```bash
# docker-compose.yml here pulls the GHCR image; no build on the VPS.
docker compose up -d
```

The container joins the shared external `pangolin` network and publishes **no host port** (host `:8080` is taken by CrowdSec). Pangolin/Traefik reach it **by container name** (`aetherengine-web`); the Pangolin resource for `aetherengine.superuser404.de` targets `http://aetherengine-web:8080`, so the `container_name` must stay in sync with that route. A single Watchtower instance on the host (shared with the other sites) handles redeploys; this service opts in via the `com.centurylinklabs.watchtower.enable=true` label. If the GHCR package is private, run `docker login ghcr.io` once on the VPS; making the package public avoids that.

### Cross-repo trigger token

AetherEngine's `notify-website.yml` needs a `WEBSITE_DISPATCH_TOKEN` secret (a fine-grained PAT with **Contents: read and write** on this repo) to call the dispatch API. Without it the docs still sync via the daily schedule, just not instantly.
