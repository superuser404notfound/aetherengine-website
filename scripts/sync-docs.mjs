// Fetches AetherEngine docs at build time, adds Starlight frontmatter,
// rewrites relative repo links to internal routes, records the latest
// release tag, and mirrors the README's Used by list.
// Run via `npm run sync` (wired as predev + prebuild).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'superuser404notfound/AetherEngine';
// AETHERENGINE_REF lets a local run preview an engine branch before it reaches main.
const RAW = `https://raw.githubusercontent.com/${REPO}/${process.env.AETHERENGINE_REF ?? 'main'}`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// source file -> { out, title, description }
const DOCS = [
  { src: 'docs/installation.md', out: 'src/content/docs/guides/installation.md',
    title: 'Installation', description: 'Add the package, requirements, optional components, privacy manifest and versioning.' },
  { src: 'docs/guide.md', out: 'src/content/docs/guides/host-guide.md',
    title: 'Host guide', description: 'Build a player: loading, state, tracks, subtitles, live TV, tvOS setup and logging.' },
  { src: 'docs/features.md', out: 'src/content/docs/guides/features.md',
    title: 'Features', description: 'What the engine plays and does, area by area.' },
  { src: 'docs/api.md', out: 'src/content/docs/reference/api.md',
    title: 'API reference', description: 'Every public surface a host consumes, and the contracts that require the host to act.' },
  { src: 'docs/formats.md', out: 'src/content/docs/reference/formats.md',
    title: 'Formats & codecs', description: 'Container and codec coverage, HDR signaling, audio bridging, subtitles, frames, disc, and edge cases.' },
  { src: 'docs/architecture.md', out: 'src/content/docs/reference/architecture.md',
    title: 'Architecture', description: 'How the engine is built: the playback routes in one picture, how a load picks one, and where to read next.' },
  { src: 'docs/architecture-native.md', out: 'src/content/docs/reference/architecture-native.md',
    title: 'Architecture: native route', description: 'The AVPlayer route in depth: HLS producer, segment cache, loopback server, live, remote HLS and ingest.' },
  { src: 'docs/architecture-software.md', out: 'src/content/docs/reference/architecture-software.md',
    title: 'Architecture: software route', description: 'The software host in depth: decoders, renderer, packet cache, upscaling, FEL and object audio.' },
  { src: 'docs/source-map.md', out: 'src/content/docs/reference/source-map.md',
    title: 'Source map', description: 'Every Swift source file and what it owns.' },
  { src: 'docs/cli.md', out: 'src/content/docs/reference/cli.md',
    title: 'aetherctl CLI', description: 'The standalone macOS repro CLI shipped alongside the library.' },
  { src: 'docs/dolby-vision-fel.md', out: 'src/content/docs/reference/dolby-vision-fel.md',
    title: 'Dolby Vision FEL', description: 'How Dolby Vision Profile 7 FEL is played: the curve fold and the dual-layer route.' },
  { src: 'docs/comparison.md', out: 'src/content/docs/project/comparison.md',
    title: 'How it compares', description: 'AetherEngine next to AVPlayer, KSPlayer, VLCKit and libmpv, with measurements.' },
  { src: 'docs/licensing.md', out: 'src/content/docs/project/license.md',
    title: 'Licensing', description: 'What an app has to do to ship the engine and each of its dependencies.' },
  { src: 'docs/measurements.md', out: 'src/content/docs/project/measurements.md',
    title: 'Measurements', description: 'Dated measurements and investigation history behind the rules in the other pages.' },
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
  [/\((?:\.\.\/)?docs\/architecture-native\.md/g, '(/reference/architecture-native/'],
  [/\((?:\.\.\/)?docs\/architecture-software\.md/g, '(/reference/architecture-software/'],
  [/\((?:\.\.\/)?docs\/source-map\.md/g, '(/reference/source-map/'],
  [/\((?:\.\.\/)?docs\/measurements\.md/g, '(/project/measurements/'],
  [/\((?:\.\.\/)?docs\/dolby-vision-fel\.md/g, '(/reference/dolby-vision-fel/'],
  [/\((?:\.\.\/)?docs\/installation\.md/g, '(/guides/installation/'],
  [/\((?:\.\.\/)?docs\/guide\.md/g, '(/guides/host-guide/'],
  [/\((?:\.\.\/)?docs\/features\.md/g, '(/guides/features/'],
  [/\((?:\.\.\/)?docs\/comparison\.md/g, '(/project/comparison/'],
  [/\((?:\.\.\/)?docs\/licensing\.md/g, '(/project/license/'],
  [/\(api\.md/g, '(/reference/api/'],
  [/\(formats\.md/g, '(/reference/formats/'],
  [/\(architecture\.md/g, '(/reference/architecture/'],
  [/\(cli\.md/g, '(/reference/cli/'],
  [/\(architecture-native\.md/g, '(/reference/architecture-native/'],
  [/\(architecture-software\.md/g, '(/reference/architecture-software/'],
  [/\(source-map\.md/g, '(/reference/source-map/'],
  [/\(measurements\.md/g, '(/project/measurements/'],
  [/\(dolby-vision-fel\.md/g, '(/reference/dolby-vision-fel/'],
  [/\(installation\.md/g, '(/guides/installation/'],
  [/\(guide\.md/g, '(/guides/host-guide/'],
  [/\(features\.md/g, '(/guides/features/'],
  [/\(comparison\.md/g, '(/project/comparison/'],
  [/\(licensing\.md/g, '(/project/license/'],
  [/\((?:\.\.\/)?CHANGELOG\.md/g, '(/project/changelog/'],
  // README section anchors that live on their own pages here. Must precede
  // the generic README rule so the whole "README.md#anchor" is consumed.
  [/\((?:\.\.\/)?README\.md#stability-and-versioning/g, '(/guides/installation/#stability-and-versioning'],
  [/\((?:\.\.\/)?README\.md#optional-components/g, '(/guides/installation/#optional-components'],
  // Any other README section is not on this site (the introduction is written here, not
  // synced), so the anchor only exists on GitHub. Sending it to the introduction failed the
  // build on "README.md#package-traits" as an invalid hash.
  [/\((?:\.\.\/)?README\.md#/g, '(https://github.com/superuser404notfound/AetherEngine#'],
  [/\((?:\.\.\/)?README\.md/g, '(/guides/introduction/'],
];

function stripLeadingH1(md) {
  // Starlight renders the title from frontmatter; drop the first H1 line.
  return md.replace(/^\s*#\s+.*\r?\n+/, '');
}

// Everything still repo-relative after LINK_RULES points at a file this site does not
// publish: a sample, a source file, a regression note. It is a correct relative link on
// GitHub, so send the reader there instead of dropping it. This is a fallback and not a
// list on purpose. starlight-links-validator fails the whole build on one relative link
// that resolves to no route, and it runs in this repo AFTER the push that caused it, so
// a per-path rule means the next unlisted file breaks the deploy again (Examples/,
// Sources/ and Tests/ were that list; docs/partial-composition-regression.md was the
// next file). Typos cannot hide behind this: AetherEngine's Scripts/check-doc-links.py
// proves every relative target exists in the repo before the merge.
function toRepoFileURL(srcPath, target) {
  const [path, hash] = target.split('#');
  const abs = posix.normalize(posix.join(posix.dirname(srcPath), path));
  return `https://github.com/${REPO}/blob/main/${abs}${hash ? `#${hash}` : ''}`;
}

function rewriteLinks(md, srcPath) {
  let out = md;
  for (const [re, repl] of LINK_RULES) out = out.replace(re, repl);
  // Link targets only: an absolute URL, an internal route (/...) and a same-page
  // anchor (#...) are all already resolvable and stay untouched.
  return out.replace(/\]\((?![a-zA-Z][a-zA-Z0-9+.-]*:|\/|#)([^)\s]+)\)/g,
    (_, target) => `](${toRepoFileURL(srcPath, target)})`);
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
    const body = rewriteLinks(stripLeadingH1(raw), d.src);
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
