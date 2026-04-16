import {mkdir, readdir, writeFile, copyFile, readFile} from 'node:fs/promises';
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
  const query = encodeURIComponent(`*[_type=="blogPage"][0]`);
  const url = `https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}?query=${query}&perspective=published`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  const blogPage = payload?.result || null;
  return { blogPage };
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

function generateBlogCardsHtml(cards) {
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  return cards.map((card, idx) => {
    const tag = card.tag || 'Strategy';
    const titleHtml = card.titleHtml || card.title || '';
    const excerpt = card.excerpt || '';
    const readingTime = card.readingTime || '5 min read';
    const date = card.date || '';
    const num = String(idx + 1).padStart(2, '0');

    return `  <article class="blog-card r d${(idx % 3) + 1}">
    <div class="blog-card-img"><div class="blog-card-img-inner"><span class="blog-card-num">${num}</span></div></div>
    <p class="blog-tag">${tag}</p>
    <h3 class="blog-card-title">${titleHtml}</h3>
    <p class="blog-card-excerpt">${excerpt}</p>
    <div class="blog-card-meta">
      <span>${readingTime}</span>
      <span class="blog-meta-dot"></span>
      <span>${date}</span>
    </div>
  </article>`;
  }).join('\n\n');
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
  console.log('🔨 Building site...');
  console.log('Project ID:', process.env.SANITY_PROJECT_ID ? '✓ Set' : '✗ Not set');

  const sanityContent = await loadSanityContent().catch((err) => {
    console.error('❌ Failed to load Sanity content:', err.message);
    return null;
  });

  if (sanityContent) {
    const cardCount = sanityContent.blogPage?.cards?.length || 0;
    console.log('✅ Loaded from Sanity: blogPage with', cardCount, 'cards');
  } else {
    console.log('⚠️  Using fallback data (Sanity fetch failed or not configured)');
  }

  const finalData = deepMerge(fallbackData, sanityContent || {});

  await copyFile(path.join(rootDir, 'cms.js'), path.join(distDir, 'cms.js'));

  // Generate blog cards HTML from Sanity blogPage data
  const blogCards = finalData.blogPage?.cards || [];
  console.log('📝 Generating HTML for', blogCards.length, 'blog cards');
  const generatedBlogHtml = generateBlogCardsHtml(blogCards);

  // Read, modify, and write index.html with generated blog posts
  let indexHtml = await readFile(path.join(rootDir, 'index.html'), 'utf8');

  if (generatedBlogHtml) {
    // Replace the hardcoded blog grid with generated posts
    const blogGridPattern = /<!-- POST GRID -->[\s\S]*?<\/div>\s*<!-- NEWSLETTER -->/;
    const replacement = `<!-- POST GRID -->
<div class="blog-grid">

${generatedBlogHtml}

</div>

<!-- NEWSLETTER -->`;
    indexHtml = indexHtml.replace(blogGridPattern, replacement);
  }

  await writeFile(path.join(distDir, 'index.html'), indexHtml, 'utf8');

  const staticFiles = [
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
