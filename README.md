# Wilma Collective Site

Static site for Wilma Collective with a Sanity Studio scaffold and build-time content sync.

## Local site build

```bash
node scripts/build-site.mjs
```

This writes the deployable site into `dist/`.

## Sanity Studio

The Studio lives in [`/studio`](./studio) and is configured for project `x5vhv4vi`.

```bash
cd studio
npm install
npm run dev
```

## Content flow

- Sanity is the live CMS for the Journal landing page and real Journal articles.
- `Journal Page` controls the landing-page hero, filters, featured story, and newsletter.
- `Journal Articles` are the real publishable posts. Lise can log in, create an article, write a title, slug, excerpt, and 3 paragraphs, then publish it.
- The site build fetches published Sanity content at build time and falls back to the checked-in local content module if Sanity is not configured yet.

## Netlify

The Netlify build command is `node scripts/build-site.mjs` and the publish directory is `dist`.
