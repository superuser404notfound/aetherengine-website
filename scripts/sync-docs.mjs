// Fetches AetherEngine docs at build time, adds Starlight frontmatter,
// rewrites relative repo links to internal routes, and records the latest
// release tag. Run via `npm run sync` (wired as predev + prebuild).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'superuser404notfound/AetherEngine';
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// source file -> { out, title, description }
const DOCS = [
  { src: 'docs/formats.md', out: 'src/content/docs/reference/formats.md',
    title: 'Formats & codecs', description: 'Container and codec coverage, HDR signaling, audio bridging, subtitles, frames, disc, and edge cases.' },
  { src: 'docs/architecture.md', out: 'src/content/docs/reference/architecture.md',
    title: 'Architecture', description: 'The three playback pipelines, the source-file map, and the dependency surface.' },
  { src: 'docs/cli.md', out: 'src/content/docs/reference/cli.md',
    title: 'aetherctl CLI', description: 'The standalone macOS repro CLI shipped alongside the library.' },
  { src: 'CHANGELOG.md', out: 'src/content/docs/project/changelog.md',
    title: 'Changelog', description: 'Per-release history of AetherEngine.' },
];

// Rewrite repo-relative links to internal Starlight routes. Order matters:
// longer paths first so docs/formats.md is hit before formats.md.
const LINK_RULES = [
  [/\((?:\.\.\/)?docs\/formats\.md/g, '(/reference/formats/'],
  [/\((?:\.\.\/)?docs\/architecture\.md/g, '(/reference/architecture/'],
  [/\((?:\.\.\/)?docs\/cli\.md/g, '(/reference/cli/'],
  [/\(formats\.md/g, '(/reference/formats/'],
  [/\(architecture\.md/g, '(/reference/architecture/'],
  [/\(cli\.md/g, '(/reference/cli/'],
  [/\((?:\.\.\/)?CHANGELOG\.md/g, '(/project/changelog/'],
  [/\((?:\.\.\/)?README\.md/g, '(/guides/introduction/'],
];

function stripLeadingH1(md) {
  // Starlight renders the title from frontmatter; drop the first H1 line.
  return md.replace(/^\s*#\s+.*\r?\n+/, '');
}

function rewriteLinks(md) {
  let out = md;
  for (const [re, repl] of LINK_RULES) out = out.replace(re, repl);
  return out;
}

function frontmatter(title, description) {
  const esc = (s) => s.replace(/"/g, '\\"');
  return `---\ntitle: "${esc(title)}"\ndescription: "${esc(description)}"\n---\n\n`;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'aetherengine-website-sync' } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

async function writeOut(relPath, content) {
  const abs = resolve(ROOT, relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
  console.log(`sync-docs: wrote ${relPath}`);
}

async function syncDocs() {
  for (const d of DOCS) {
    const raw = await fetchText(`${RAW}/${d.src}`); // throws -> fatal
    const body = rewriteLinks(stripLeadingH1(raw));
    await writeOut(d.out, frontmatter(d.title, d.description) + body);
  }
}

async function syncVersion() {
  const releasesPage = `https://github.com/${REPO}/releases`;
  let tag = null, url = releasesPage;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { 'User-Agent': 'aetherengine-website-sync', Accept: 'application/vnd.github+json' } });
    if (res.ok) {
      const json = await res.json();
      tag = json.tag_name ?? null;
      url = json.html_url ?? releasesPage;
    } else {
      console.warn(`sync-docs: version fetch -> ${res.status}, using fallback`);
    }
  } catch (e) {
    console.warn(`sync-docs: version fetch failed (${e.message}), using fallback`);
  }
  await writeOut('src/data/version.json', JSON.stringify({ tag, url }, null, 2) + '\n');
}

await syncDocs();
await syncVersion();
console.log('sync-docs: done');
