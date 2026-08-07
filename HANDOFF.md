# HANDOFF — Wilma Collective Website

Orientation doc for anyone (human or AI agent) picking up this repo cold.
Read this before making changes. It documents the things that are **non-obvious
and expensive to rediscover** — not the things you can see by listing files.

Last verified: 2026-08-07

---

## 1. What this is

A **static marketing site** for Wilma Collective, built by a Node script,
deployed by Netlify, with editorial content managed in Sanity CMS.

| Thing | Where |
|---|---|
| Live site | https://wilmacollective.co.za |
| Repo | https://github.com/jtshis/wilmawebsite |
| Netlify project | `wilmacollective` (site ID `1c99b824-6b85-41fe-bb21-6d972974719c`) |
| Sanity Studio | https://wilmacollective.sanity.studio/ |
| Sanity project | `x5vhv4vi`, dataset `production` |

There is **no framework**. No React, no Next, no bundler for the site itself.
It is one big HTML file plus one JS file, assembled by a build script.

---

## 2. The mental model: two independent tracks

This is the single most important thing to understand. The live site changes
for **two unrelated reasons**, and confusing them wastes hours.

### Track A — Code changes (you / an agent)
Edit files → commit → push to `main` → Netlify auto-builds → live.

### Track B — Content changes (Lise, in Sanity)
Edit an article in Sanity Studio → publish → **the change is NOT live yet**.
It only appears on the next Netlify build, because content is fetched at
*build time*, not in the browser.

> ⚠️ **Open question — verify before relying on it:** it is not confirmed
> whether a Sanity webhook is wired to a Netlify build hook. If it is not,
> a content-only edit sits invisible until someone triggers a rebuild
> (push a commit, or hit "Trigger deploy" in Netlify). Confirm this before
> telling Lise her publishes go live automatically.

---

## 3. How a change actually reaches production

```
Sanity (published docs only)
        │  fetched at build time, perspective=published
        ▼
scripts/build-site.mjs  ◄── run by Netlify: `node scripts/build-site.mjs`
        │
        ├─ injects Journal markup directly into index.html   (build-time path)
        ├─ writes content/site-data.local.mjs                (runtime path)
        └─ copies static assets
        ▼
      dist/           ◄── Netlify publishes this folder
        ▼
  wilmacollective.co.za
```

**Netlify deploys from `main` only.** No other branch builds to production.
Branch/preview deploys exist but do not touch the live domain.

If Sanity is unreachable or `SANITY_PROJECT_ID` is unset, the build **falls
back** to the checked-in `content/site-data.local.mjs` instead of failing.
This is deliberate — the build should never hard-fail on a CMS outage — but it
means *a broken Sanity fetch looks like "content silently went stale"*, not
like an error. Check the build log for the Sanity fetch status line.

---

## 4. ⚠️ The duplication trap (read this before touching journal code)

Content is applied to the page by **two separate code paths that duplicate
each other's logic**:

| Path | File | When |
|---|---|---|
| Build-time injection | `scripts/build-site.mjs` → `injectBlogPage()` | during Netlify build |
| Runtime hydration | `cms.js` → `applyBlog()` / `renderJournalArticle()` | in the browser |

Both files contain **their own near-identical copies** of:
`slugify()`, `resolveJournalSlug()`, `normalizeJournalPost()`,
`prepareJournalContent()`, `parseJournalDate()`, `stripHtml()`.

**If you change slug logic, date parsing, or post normalisation in one file and
not the other, the journal breaks in subtle ways** — cards linking to the wrong
article, titles falling back to placeholders, articles rendering blank. Past
bugs in this repo came from exactly this.

Rule: **grep both files for the function name before editing either.**

Consolidating these into one shared module is the single highest-value
refactor available in this codebase (see §10).

---

## 5. Repo map

### Ships to the live site
| File | Purpose |
|---|---|
| `index.html` | **The entire site.** ~4,000 lines. All pages (home / about / journal / contact) are `<div class="page">` blocks toggled client-side. CSS is inline (`<style>`, lines ~43–2755). Main JS is inline (`<script>`, lines ~3597–3933). |
| `cms.js` | ES module. Imports `/content/site-data.local.mjs`, applies content to the DOM, and handles hash-based routing (`#article-slug`) for journal articles. |
| `content/site-data.local.mjs` | Generated content module — Sanity data, or the committed fallback. Rewritten on every build. |
| `404.html` | Custom not-found page. |
| `netlify.toml` | Build command, publish dir, cache headers, and the SPA catch-all redirect (`/* → /index.html 200`). |
| `robots.txt`, `sitemap.xml` | SEO/crawler files. |
| Images / video | `hero-cherries.jpg`, `hero-cherries-mobile.jpg`, `lise-founder.jpg`, `beyond-thebet.jpg`, `irdh-casestudy.png`, `logo-mark.png`, `logo-primary.png`, `comma-forest.png`, `comma-sage.png`, `wilma-signature.mp4` |

### Build tooling
| File | Purpose |
|---|---|
| `scripts/build-site.mjs` | The build. Fetches Sanity → injects → copies assets → writes `dist/`. **The file that matters most.** |
| `scripts/import-notion.mjs` | One-off Notion import utility. Not part of the live build. |
| `package.json` | Scripts: `build`, `sync:content`, `import:notion`. |
| `dist/` | Build output. Gitignored, regenerated every build. Never edit by hand. |

### Sanity Studio — separate app, not on Netlify
| File | Purpose |
|---|---|
| `studio/` | The CMS editor app, deployed independently to `wilmacollective.sanity.studio`. Has its own `package.json` / `node_modules`. |
| `studio/schemas/index.ts` | All content schemas (see §6). |
| `studio/structure.ts` | Custom sidebar: 🟢 Live / ✏️ Drafts / All Articles. |
| `studio/StudioLayout.tsx` | Inter font, dark theme. |
| `studio/sanity.cli.js` | Contains `appId` so CLI deploys don't prompt. |

Changing `studio/` does **not** change the website. It changes the editing
experience. It requires a separate deploy (`cd studio && npx sanity deploy`).

### Dead weight — no bearing on the live site
| File | Status |
|---|---|
| `globedesign.html` | Tracked in git, but never linked from `index.html` and never copied to `dist/`. Leftover prototype from the globe redesign (commit `5d391b4`). Safe to delete. |
| `manifesto-globe-continents.svg` | Still copied into `dist/` by the build script, but nothing references it — the SVG globe was replaced by a canvas globe. Deployed but unreachable. Safe to delete (remove from the `staticFiles` array too). |
| `final logo arborius blad wit.png` | Untracked, unreferenced. Stray file. |

---

## 6. Sanity content model

Five document types in `studio/schemas/index.ts`:

| Type | Studio name | Notes |
|---|---|---|
| `siteSettings` | Site Settings | Brand name, SEO description, OG image, LinkedIn URLs, theme colour. |
| `homePage` | Home Page | Hero, "How we work", manifesto, "Who we work with", case studies, selected work. |
| `aboutPage` | About Page | Hero, agency section, core values, founder bio, fun fact. |
| `blogPage` | Journal Page | The journal **landing page**: hero, featured article (a reference), pinned articles, filter categories, newsletter block. |
| `journalPost` | Journal Article | The actual articles. Title, slug, category, publishedAt, author, excerpt, image, **body (Portable Text)**, SEO fields. |

**Naming trap:** the schema is called `blogPage` but everything user-facing says
"Journal". They are the same thing.

**`...Html` fields are intentional.** Many fields (`headlineHtml`, `titleHtml`,
`labelHtml`) accept raw HTML so Lise can control emphasis and line breaks —
these get injected with `innerHTML`, not `textContent`. Don't "fix" them into
plain strings.

**Publishing model:** native Sanity Publish/Unpublish. There is no custom status
field. The build queries with `?perspective=published`, so drafts are excluded
automatically. Published docs appear under 🟢 Live in the Studio sidebar.

**Article body is Portable Text**, converted to HTML by `portableTextToHtml()`
in `scripts/build-site.mjs`. Supported: paragraphs, h2, h3, bold, italic,
underline, links, bullet/numbered lists. Anything else won't render.

---

## 7. Local development

```bash
node scripts/build-site.mjs
```

Writes the deployable site into `dist/`. **Preview `dist/`, not the repo root** —
the root `index.html` has no content injected into it, so the journal will look
broken if you serve the root directly.

The Claude Code preview config (`.claude/launch.json`) is already set up to
serve `dist/` on port 3000 with caching disabled.

Local Sanity access needs `.env` (gitignored) with `SANITY_PROJECT_ID`,
`SANITY_DATASET`, `SANITY_API_VERSION`. See `.env.example`. Without it the build
still works — it just uses the fallback content.

Studio:
```bash
cd studio && npm install && npm run dev
```

---

## 8. Environment / configuration

Production env vars live in the **Netlify dashboard**, not in the repo.
Currently set (values intentionally omitted from this doc):

- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` — used by the build.
- `NETLIFY_EMAILS_DIRECTORY`, `NETLIFY_EMAILS_SECRET` — Netlify Emails extension (contact form).
- `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN` — ⚠️ **leftovers from an abandoned Contentful setup.** Nothing in this codebase reads them. Candidates for deletion, but confirm before removing.

Netlify Forms is **enabled** on this site; the contact modal in `index.html`
posts to it.

> 🔐 Never copy secret values into this file, into commits, or into chat.
> Read them from the Netlify dashboard when needed.

---

## 9. Gotchas learned the hard way

1. **Import paths must stay relative-safe for Netlify.** An earlier absolute-path
   change broke the build. `cms.js` imports `/content/site-data.local.mjs` at
   runtime, which is why the build copies the whole `content/` folder into `dist/`.
2. **`index.html` is one 4,000-line file.** Edits need care — there is no
   component isolation. Use line-anchored edits, and search for the `data-section`
   / `id=` markers to locate a section.
3. **The globe is canvas + d3.** `index.html` loads `d3` and `topojson-client`
   from a CDN at the bottom of the file. The old SVG globe is gone (see §5).
4. **Routing is hash-based** (`#article-slug`), handled in `cms.js`. The
   `netlify.toml` catch-all redirect exists to support this. Don't add real
   sub-paths without updating both.
5. **A stale-looking site is usually a stale build, not a code bug.** Content
   changes need a rebuild (§2).

---

## 10. Known open items

- **Consolidate the duplicated journal logic** between `build-site.mjs` and
  `cms.js` into a shared module (§4). Highest-value refactor here.
- **Confirm/wire the Sanity → Netlify build hook** so Lise's publishes go live
  without a manual trigger (§2).
- **Delete the dead files** listed in §5.
- **Remove the unused Contentful env vars** (§8).
- **Image optimisation** — `hero-cherries.jpg` (1.6 MB), `hero-cherries-mobile.jpg`
  (1.7 MB), `lise-founder.jpg` (1.3 MB) are large and hurt mobile load,
  which matters given the site's own stated audience (low-bandwidth markets).
- Reading-time auto-calculation, scheduled publishing (future-dated
  `publishedAt` is stored but not specially handled), multi-author support,
  newsletter backend.

---

## 11. Working conventions

- **Branch off `main`, PR into `main`.** Netlify deploys `main` automatically,
  so anything merged is live.
- **Delete branches and worktrees after merging.** This repo accumulated 10 stale
  branches and 5 orphaned worktrees before a cleanup; enabling GitHub's
  "automatically delete head branches" is recommended.
- **Multiple AI agents work on this repo** (Claude Code, Codex). Commit and push
  before switching tools — an uncommitted change in one session is invisible to
  every other session.
- **Verify against the live site**, not assumptions. The site is public; load it
  and check.
