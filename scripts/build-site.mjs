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
  const query = encodeURIComponent(`{
    "blogPage": *[_type=="blogPage"][0]{
      ...,
      "featured": featured->{
        _id,
        title,
        "slug": slug.current,
        category,
        publishedAt,
        author,
        excerpt,
        "image": image.asset->{url, metadata},
        imageAlt,
        body,
        seoDescription,
        "ogImage": ogImage.asset->{url}
      }
    },
    "journalPosts": *[_type=="journalPost"] | order(publishedAt desc){
      _id,
      title,
      "slug": slug.current,
      category,
      publishedAt,
      author,
      excerpt,
      "image": image.asset->{url, metadata},
      imageAlt,
      body,
      seoDescription,
      "ogImage": ogImage.asset->{url}
    }
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

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value = '') {
  const base = stripHtml(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'journal-article';
}

function resolveJournalSlug(item = {}) {
  return item.slug || slugify(item.titleHtml || item.title || item.excerpt || item.tag || 'journal-article');
}

function resolveJournalDate(item = {}) {
  return item.date || item.publishedAt || '';
}

function makeFallbackJournalBody(title, excerpt) {
  return [
    excerpt || `${title} gives Lise a clean starting point for a fuller article draft.`,
    'Use the second paragraph to expand the idea with one practical example, a small case study, or a lesson from client work.',
    'Close with a concrete takeaway so the article reads like a real publishable piece, not just a teaser.'
  ];
}

function synthesizeJournalPosts(blogPage = {}) {
  const posts = [];
  const featured = blogPage.featured;
  if (featured) {
    const title = stripHtml(featured.titleHtml || featured.title || 'Featured article');
    posts.push({
      title,
      slug: resolveJournalSlug(featured),
      category: featured.tag || 'Featured',
      excerpt: featured.excerpt || '',
      author: featured.author || 'Lise Kriekemans',
      readingTime: featured.readingTime || '5 min read',
      publishedAt: resolveJournalDate(featured),
      body: makeFallbackJournalBody(title, featured.excerpt)
    });
  }

  for (const card of blogPage.cards || []) {
    const title = stripHtml(card.titleHtml || card.title || 'Journal article');
    posts.push({
      title,
      slug: resolveJournalSlug(card),
      category: card.tag || 'Journal',
      excerpt: card.excerpt || '',
      author: card.author || 'Lise Kriekemans',
      readingTime: card.readingTime || '5 min read',
      publishedAt: resolveJournalDate(card),
      body: makeFallbackJournalBody(title, card.excerpt)
    });
  }

  return posts;
}

function calculateReadingTime(body = []) {
  let wordCount = 0;

  if (Array.isArray(body)) {
    for (const block of body) {
      if (block._type === 'block' && block.children) {
        for (const child of block.children) {
          if (child.text) wordCount += child.text.split(/\s+/).length;
        }
      } else if (typeof block === 'string') {
        wordCount += block.split(/\s+/).length;
      }
    }
  }

  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

function portableTextToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return '';

  let html = '';
  for (const block of blocks) {
    if (block._type === 'block') {
      const tag = block.style || 'p';
      let content = '';

      if (block.children) {
        for (const child of block.children) {
          let text = child.text || '';

          if (child.marks) {
            for (const mark of child.marks) {
              if (mark === 'strong') text = `<strong>${text}</strong>`;
              if (mark === 'em') text = `<em>${text}</em>`;
              if (mark === 'underline') text = `<u>${text}</u>`;
            }
          }

          content += text;
        }
      }

      html += `<${tag}>${content}</${tag}>`;
    }
  }

  return html;
}

function normalizeJournalPost(post = {}) {
  const title = post.title || stripHtml(post.titleHtml || 'Journal article');
  const readingTime = calculateReadingTime(post.body);

  return {
    ...post,
    title,
    titleHtml: undefined,  // strip legacy field; cms.js uses title directly
    slug: post.slug || slugify(title),
    category: post.category || post.tag || 'Journal',
    tag: undefined,        // strip legacy field; use category
    excerpt: post.excerpt || '',
    author: post.author || 'Lise Kriekemans',
    readingTime,
    publishedAt: post.publishedAt || post.date || '',
    date: undefined,       // strip legacy field; use publishedAt
    body: post.body || [],
    image: post.image,
    imageAlt: post.imageAlt,
    seoDescription: post.seoDescription,
    ogImage: post.ogImage
  };
}

function prepareJournalContent(finalData) {
  const blogPage = finalData.blogPage || {};
  const journalPosts = Array.isArray(finalData.journalPosts)
    ? finalData.journalPosts.map(normalizeJournalPost)
    : [];

  // Normalize featured post if it exists
  if (blogPage.featured) {
    blogPage.featured = normalizeJournalPost(blogPage.featured);
  }

  // Auto-generate cards from newest journalPosts
  const articlesToShow = blogPage.articlesToShow || 6;
  const cards = journalPosts.slice(0, articlesToShow).map((post, index) => ({
    slug: post.slug,
    tag: post.category,
    titleHtml: post.title,
    excerpt: post.excerpt,
    readingTime: post.readingTime,
    date: post.publishedAt,
    author: post.author,
    image: post.image,
    imageAlt: post.imageAlt
  }));

  // Auto-generate filter categories from articles
  const categoriesSet = new Set(journalPosts.map(p => p.category).filter(Boolean));
  const categories = Array.from(categoriesSet).sort();
  if (blogPage.filterCategories && blogPage.filterCategories.length > 0) {
    blogPage.filterCategories = blogPage.filterCategories;
  } else {
    blogPage.filterCategories = ['All', ...categories];
  }

  blogPage.cards = cards;

  return {
    ...finalData,
    blogPage,
    journalPosts
  };
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

  // Filter buttons (use filterCategories which are auto-generated from articles)
  const filterCategories = blogPage.filterCategories || ['All'];
  if (Array.isArray(filterCategories) && filterCategories.length) {
    const buttons = filterCategories
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
    const { category, title, excerpt, author, readingTime, slug, publishedAt } = blogPage.featured;
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
    <p class="blog-tag">${category || ''}</p>
    <h2 class="blog-featured-title">${title || ''}</h2>
    <p class="blog-featured-excerpt">${excerpt || ''}</p>
    <div class="blog-meta">
      <span>${author || ''}</span>
      <span class="blog-meta-dot"></span>
      <span>${readingTime || ''}</span>
      <span class="blog-meta-dot"></span>
      <span>${formatJournalDate(publishedAt)}</span>
    </div>
    <a href="#${slug || ''}" class="blog-read-more journal-link" data-journal-slug="${slug || ''}">Read article <span>-></span></a>
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
      const slug = card.slug || resolveJournalSlug(card);
      const num = String(idx + 1).padStart(2, '0');
      return `  <a href="#${slug}" class="blog-card r d${(idx % 3) + 1}" role="link" tabindex="0" data-journal-slug="${slug}">
    <div class="blog-card-img"><div class="blog-card-img-inner"><span class="blog-card-num">${num}</span></div></div>
    <p class="blog-tag">${tag}</p>
    <h3 class="blog-card-title">${titleHtml}</h3>
    <p class="blog-card-excerpt">${excerpt}</p>
    <div class="blog-card-meta">
      <span>${readingTime}</span>
      <span class="blog-meta-dot"></span>
      <span>${date}</span>
    </div>
  </a>`;
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
    const articleCount = sanityContent.journalPosts?.length || 0;
    const featuredTitle = sanityContent.blogPage?.featured?.title || null;
    console.log('✅ Loaded from Sanity:', articleCount, 'articles,', cardCount, 'cards');
    console.log('   blogPage:', sanityContent.blogPage ? 'found' : 'not found (draft or missing — publish it in Sanity Studio)');
    console.log('   featured:', featuredTitle ? `"${featuredTitle}"` : 'not set or not published');
  } else {
    console.log('⚠️  Using fallback data (Sanity fetch failed or not configured)');
  }

  const finalData = prepareJournalContent(deepMerge(fallbackData, sanityContent || {}));
  if (finalData.blogPage?.cards) {
    finalData.blogPage.cards = sortJournalCards(finalData.blogPage.cards);
  }

  await copyFile(path.join(rootDir, 'cms.js'), path.join(distDir, 'cms.js'));

  const cardCount = finalData.blogPage?.cards?.length || 0;
  const articleCount = finalData.journalPosts?.length || 0;
  console.log('📝 Injecting Journal page:', cardCount, 'cards and', articleCount, 'articles');

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
