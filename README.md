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

- Sanity is the live CMS for website content.
- Notion is intended as the editorial workspace for drafts and approvals.
- The site build fetches published Sanity content at build time and falls back to the checked-in local content module if Sanity is not configured yet.

## Netlify

The Netlify build command is `node scripts/build-site.mjs` and the publish directory is `dist`.
