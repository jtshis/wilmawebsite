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

function parseJournalDate(value) {
  if (!value) return 0;
  const time = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(time) ? 0 : time;
}

function formatJournalDate(value) {
  const time = parseJournalDate(value);
  if (!time) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(time));
}

function sortJournalCards(cards = []) {
  return [...cards].sort((a, b) => parseJournalDate(b.date) - parseJournalDate(a.date));
}

async function writeModule(outPath, data) {
  await mkdir(path.dirname(outPath), {recursive: true});
  const body = `export default ${JSON.stringify(data, null, 2)};\n`;
  await writeFile(outPath, body, 'utf8');
}

function injectBlogPage(html, blogPage) {
  if (!blogPage) return html;

  // Hero
  if (blogPage.hero) {
    const { eyebrow, titleHtml, description, issue } = blogPage.hero;
    html = html.replace(
      /<!-- BLOG HERO -->[\s\S]*?<!-- FILTER BAR -->/,
      `<!-- BLOG HERO -->
<section class="blog-hero">
  <div>
    <p class="about-eyebrow r">${eyebrow || ''}</p>
    <h1 class="blog-hero-title r d1">${titleHtml || ''}</h1>
  </div>
  <div class="blog-hero-right r d2">
    <p class="blog-hero-desc">${description || ''}</p>
    <span class="blog-issue">${issue || ''}</span>
  </div>
</section>

<!-- FILTER BAR -->`
    );
  }

  // Filter buttons
  if (Array.isArray(blogPage.filters) && blogPage.filters.length) {
    const buttons = blogPage.filters
      .map((f, i) => `  <button class="blog-filter${i === 0 ? ' active' : ''}">${f}</button>`)
      .join('\n');
    html = html.replace(
      /<!-- FILTER BAR -->[\s\S]*?<!-- FEATURED POST -->/,
      `<!-- FILTER BAR -->
<div class="blog-filters">
${buttons}
</div>

<!-- FEATURED POST -->`
    );
  }

  // Featured post
  if (blogPage.featured) {
    const { tag, titleHtml, excerpt, author, readingTime, date } = blogPage.featured;
    const initial = author ? author.trim().charAt(0).toUpperCase() : 'W';
    html = html.replace(
      /<!-- FEATURED POST -->[\s\S]*?<!-- POST GRID -->/,
      `<!-- FEATURED POST -->
<article class="blog-featured r">
  <div class="blog-featured-img">
    <div class="blog-featured-img-inner">
      <span class="blog-featured-placeholder">${initial}</span>
    </div>
  </div>
  <div class="blog-featured-content">
    <p class="blog-tag">${tag || ''}</p>
    <h2 class="blog-featured-title">${titleHtml || ''}</h2>
    <p class="blog-featured-excerpt">${excerpt || ''}</p>
    <div class="blog-meta">
      <span>${author || ''}</span>
      <span class="blog-meta-dot"></span>
      <span>${readingTime || ''}</span>
      <span class="blog-meta-dot"></span>
      <span>${formatJournalDate(date)}</span>
    </div>
    <a href="#" class="blog-read-more">Read article <span>-></span></a>
  </div>
</article>

<!-- POST GRID -->`
    );
  }

  // Post grid — sort newest-first by date string (YYYY-MM-DD or any ISO-sortable format)
  if (Array.isArray(blogPage.cards) && blogPage.cards.length) {
    const sorted = sortJournalCards(blogPage.cards);
    const cards = sorted.map((card, idx) => {
      const tag = card.tag || '';
      const titleHtml = card.titleHtml || card.title || '';
      const excerpt = card.excerpt || '';
      const readingTime = card.readingTime || '';
      const date = formatJournalDate(card.date);
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
    html = html.replace(
      /<!-- POST GRID -->[\s\S]*?<!-- NEWSLETTER -->/,
      `<!-- POST GRID -->
<div class="blog-grid">

${cards}

</div>

<!-- NEWSLETTER -->`
    );
  }

  // Newsletter text (preserve existing button href — it is Cloudflare-obfuscated)
  if (blogPage.newsletter) {
    const { eyebrow, titleHtml, body, ctaLabel } = blogPage.newsletter;
    if (eyebrow) html = html.replace(/(<p class="blog-newsletter-label">)[^<]*/, `$1${eyebrow}`);
    if (titleHtml) html = html.replace(/(<h2 class="blog-newsletter-title">)[\s\S]*?(<\/h2>)/, `$1${titleHtml}$2`);
    if (body) html = html.replace(/(<p class="blog-newsletter-body">)[^<]*/, `$1${body}`);
    if (ctaLabel) html = html.replace(/(<a[^>]*class="blog-newsletter-btn[^>]*>)[^<]*/, `$1${ctaLabel}`);
  }

  return html;
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
  if (finalData.blogPage?.cards) {
    finalData.blogPage.cards = sortJournalCards(finalData.blogPage.cards);
  }

  await copyFile(path.join(rootDir, 'cms.js'), path.join(distDir, 'cms.js'));

  const cardCount = finalData.blogPage?.cards?.length || 0;
  console.log('📝 Injecting Journal page:', cardCount, 'cards from blogPage');

  // Read and inject the full Journal page from blogPage singleton
  let indexHtml = await readFile(path.join(rootDir, 'index.html'), 'utf8');
  indexHtml = injectBlogPage(indexHtml, finalData.blogPage);
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
