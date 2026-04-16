import {mkdir, readdir, writeFile, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const args = new Set(process.argv.slice(2));

const fallbackModuleUrl = pathToFileURL(path.join(rootDir, 'content', 'site-data.local.mjs')).href;
const fallbackData = (await import(fallbackModuleUrl)).default;

async function loadSanityContent() {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  if (!projectId) return null;

  const apiVersion = process.env.SANITY_API_VERSION || 'v2025-04-01';
  const query = encodeURIComponent(`{
    "siteSettings": *[_type=="siteSettings"][0],
    "home": *[_type=="homePage"][0],
    "about": *[_type=="aboutPage"][0],
    "blog": *[_type=="blogPage"][0],
    "blogPosts": *[_type=="blogPost"] | sort(date desc)
  }`);
  const url = `https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}?query=${query}&perspective=published`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  return payload?.result || null;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (override == null) return base;
  if (!isObject(base) || !isObject(override)) return override;
  const out = {...base};
  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) {
      out[key] = value;
    } else if (isObject(value)) {
      out[key] = deepMerge(base[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

async function writeModule(outPath, data) {
  await mkdir(path.dirname(outPath), {recursive: true});
  const body = `export default ${JSON.stringify(data, null, 2)};\n`;
  await writeFile(outPath, body, 'utf8');
}

async function copyFileIfExists(source, target) {
  try {
    await copyFile(source, target);
  } catch {
    // Ignore missing optional files.
  }
}

async function copyDirContents(sourceDir, targetDir) {
  try {
    await mkdir(targetDir, {recursive: true});
    const entries = await readdir(sourceDir, {withFileTypes: true});
    for (const entry of entries) {
      const source = path.join(sourceDir, entry.name);
      const target = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await copyDirContents(source, target);
      } else if (entry.isFile()) {
        await copyFile(source, target);
      }
    }
  } catch {
    // Ignore missing optional folders.
  }
}

async function build() {
  await mkdir(distDir, {recursive: true});
  const sanityContent = await loadSanityContent().catch(() => null);
  const finalData = deepMerge(fallbackData, sanityContent || {});

  await copyFile(path.join(rootDir, 'cms.js'), path.join(distDir, 'cms.js'));

  const staticFiles = [
    'index.html',
    '404.html',
    'netlify.toml',
    'robots.txt',
    'sitemap.xml',
    'beyond-thebet.jpg',
    'comma-forest.png',
    'comma-sage.png',
    'hero-cherries-mobile.jpg',
    'hero-cherries.jpg',
    'irdh-casestudy.png',
    'lise-founder.jpg',
    'logo-mark.png',
    'logo-primary.png',
    'wilma-signature.mp4',
    'manifesto-globe-continents.svg'
  ];

  for (const file of staticFiles) {
    await copyFileIfExists(path.join(rootDir, file), path.join(distDir, file));
  }

  // Carry the content folder so the browser module import resolves in dist.
  await copyDirContents(path.join(rootDir, 'content'), path.join(distDir, 'content'));
  await writeModule(path.join(distDir, 'content', 'site-data.local.mjs'), finalData);

  if (!args.has('--sync-only')) {
    // Nothing else to do here yet. Netlify will publish the dist folder.
  }
}

await build();
