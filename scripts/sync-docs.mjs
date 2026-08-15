// Fetches AetherEngine docs at build time, adds Starlight frontmatter,
// rewrites relative repo links to internal routes, records the latest
// release tag, and mirrors the README's Used by list.
// Run via `npm run sync` (wired as predev + prebuild).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'superuser404notfound/AetherEngine';
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// source file -> { out, title, description }
const DOCS = [
  { src: 'docs/api.md', out: 'src/content/docs/reference/api.md',
    title: 'API reference', description: 'Every public surface a host consumes, and the contracts that require the host to act.' },
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
  [/\((?:\.\.\/)?docs\/api\.md/g, '(/reference/api/'],
  [/\((?:\.\.\/)?docs\/formats\.md/g, '(/reference/formats/'],
  [/\((?:\.\.\/)?docs\/architecture\.md/g, '(/reference/architecture/'],
  [/\((?:\.\.\/)?docs\/cli\.md/g, '(/reference/cli/'],
  [/\(api\.md/g, '(/reference/api/'],
  [/\(formats\.md/g, '(/reference/formats/'],
  [/\(architecture\.md/g, '(/reference/architecture/'],
  [/\(cli\.md/g, '(/reference/cli/'],
  [/\((?:\.\.\/)?CHANGELOG\.md/g, '(/project/changelog/'],
  // Repo paths that have no page here (samples, sources, tests). They are correct
  // relative links on GitHub, so point at the file there rather than dropping them;
  // the link validator rejects any relative link that resolves to no route.
  [/\((?:\.\.\/)?((?:Examples|Sources|Tests)\/[^)\s]+)\)/g, `(https://github.com/${REPO}/blob/main/$1)`],
  // README section anchors that live on their own pages here. Must precede
  // the generic README rule so the whole "README.md#anchor" is consumed.
  [/\((?:\.\.\/)?README\.md#stability-and-versioning/g, '(/project/stability-versioning/'],
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

// The README's Used by list is maintained by the used-by-add workflow between
// HTML markers. Mirror it so an approved submission lands on the site too.
async function syncUsedBy() {
  const readme = await fetchText(`${RAW}/README.md`); // throws -> fatal
  const block = readme.match(/<!--\s*used-by:start\s*-->([\s\S]*?)<!--\s*used-by:end\s*-->/);
  if (!block) throw new Error('README.md: used-by markers not found');

  const entries = [];
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s*-\s*\[([^\]]+)\]\(([^)]+)\)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const [, name, url, rawDesc] = m;
    const desc = rawDesc.replace(/\.*$/, '');
    entries.push({
      name,
      url,
      description: desc.charAt(0).toUpperCase() + desc.slice(1) + '.',
    });
  }
  if (entries.length === 0) throw new Error('README.md: used-by block parsed to zero entries');

  await writeOut('src/data/used-by.json', JSON.stringify({ entries }, null, 2) + '\n');
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
await syncUsedBy();
await syncVersion();
console.log('sync-docs: done');
