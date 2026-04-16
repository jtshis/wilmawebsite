import {writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'content', 'imports');

async function fetchNotionPages() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_DATABASE_ID');
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': process.env.NOTION_API_VERSION || '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page_size: 100
    })
  });

  if (!response.ok) {
    throw new Error(`Notion query failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

function normalisePage(page) {
  const props = page.properties || {};
  const getTitle = key => props[key]?.title?.map(part => part.plain_text).join('') || '';
  const getText = key => props[key]?.rich_text?.map(part => part.plain_text).join('') || '';
  const getSelect = key => props[key]?.select?.name || '';
  const getDate = key => props[key]?.date?.start || '';

  return {
    notionId: page.id,
    title: getTitle('Title') || getTitle('Name'),
    slug: getText('Slug'),
    status: getSelect('Status'),
    category: getSelect('Category'),
    excerpt: getText('Excerpt'),
    body: getText('Body'),
    publishedAt: getDate('Published')
  };
}

async function run() {
  const pages = await fetchNotionPages();
  await mkdir(outDir, {recursive: true});
  const outPath = path.join(outDir, 'blog.json');
  await writeFile(outPath, JSON.stringify(pages.map(normalisePage), null, 2), 'utf8');
  console.log(`Wrote ${pages.length} Notion records to ${outPath}`);
}

await run();
