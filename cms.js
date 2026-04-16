import siteData from './content/site-data.local.mjs';

const data = siteData || {};

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setText(selector, value, root = document) {
  if (value == null) return;
  const el = q(selector, root);
  if (el) el.textContent = value;
}

function setHTML(selector, value, root = document) {
  if (value == null) return;
  const el = q(selector, root);
  if (el) el.innerHTML = value;
}

function setHref(selector, value, root = document) {
  if (!value) return;
  const el = q(selector, root);
  if (el) el.setAttribute('href', value);
}

function setMeta(selector, attr, value) {
  if (value == null) return;
  const el = q(selector);
  if (el) el.setAttribute(attr, value);
}

function replaceFooter(siteSettings) {
  qa('footer').forEach(footer => {
    setText('.ft-name', siteSettings.brandName, footer);
    setText('.ft-tag', siteSettings.tagline, footer);
    setText('.ft-reg', siteSettings.registrationNumber, footer);
    qa('a[href*="linkedin.com/company/wilma-collective"]', footer).forEach(link => {
      link.setAttribute('href', siteSettings.companyLinkedIn);
    });
  });
}

function applyHome(home, siteSettings) {
  if (!home) return;

  setText('.hero-eyebrow', home.hero?.eyebrow);
  setHTML('.hero-headline', home.hero?.headlineHtml);
  setText('.hero-sub', home.hero?.subheadline);
  setText('.hero .btn-primary', home.hero?.ctaLabel);
  setHref('.hero .btn-primary', '#cta');

  const howSection = q('.section-how');
  if (howSection) {
    setText('.section-how .section-label', home.howWeWork?.label, howSection);
    setHTML('.section-how .section-title', home.howWeWork?.titleHtml, howSection);
    qa('.section-how .how-card').forEach((card, index) => {
      const item = home.howWeWork?.cards?.[index];
      if (!item) return;
      setText('.how-num', item.num, card);
      setText('.how-title', item.title, card);
      setText('.how-body', item.body, card);
    });
  }

  setText('.comma-aside-text', home.commaMoment?.text);

  const manifesto = q('.manifesto');
  if (manifesto) {
    setText('.manifesto-label', home.manifesto?.label, manifesto);
    setHTML('.manifesto-headline', home.manifesto?.headlineHtml, manifesto);
    setText('.manifesto-body', home.manifesto?.body, manifesto);
    setText('.manifesto-bottom .btn-sage', home.manifesto?.ctaLabel, manifesto);
  }

  const whoSection = q('.section-who');
  if (whoSection) {
    setText('.section-who .section-label', home.whoWeWorkWith?.label, whoSection);
    setHTML('.section-who .section-title', home.whoWeWorkWith?.titleHtml, whoSection);
    qa('.section-who .who-card').forEach((card, index) => {
      const item = home.whoWeWorkWith?.cards?.[index];
      if (!item) return;
      setText('.who-title', item.title, card);
      setText('.who-body', item.body, card);
    });
  }

  const projectsSection = q('.section-projects');
  if (projectsSection) {
    setText('.section-projects .projects-label', home.selectedWork?.label, projectsSection);
    qa('.section-projects .logo-client').forEach((card, index) => {
      const item = home.selectedWork?.items?.[index];
      if (!item) return;
      setText('.logo-client-name', item.name, card);
      setText('.logo-client-type', item.type, card);
    });
  }

  const casesSection = q('.section-cases');
  if (casesSection) {
    setText('.section-cases .projects-label', home.cases?.label, casesSection);
    setHTML('.section-cases .section-title', home.cases?.titleHtml, casesSection);
    qa('.section-cases .case-card').forEach((card, index) => {
      const item = home.cases?.items?.[index];
      if (!item) return;
      setText('.case-tag', item.tag, card);
      setText('.case-client', item.client, card);
      setText('.case-client-sub', item.sub, card);
      const photo = q('.case-photo', card);
      if (photo && item.image) {
        photo.setAttribute('src', item.image);
        photo.setAttribute('alt', item.imageAlt || item.client || '');
      }
      const nums = qa('.case-stat-num', card);
      const labels = qa('.case-stat-label', card);
      item.stats?.forEach((stat, statIndex) => {
        if (nums[statIndex]) nums[statIndex].textContent = stat.value;
        if (labels[statIndex]) labels[statIndex].innerHTML = stat.labelHtml || stat.label || '';
      });
      setText('.case-body', item.body, card);
      setText('.case-duration', item.duration, card);
    });
  }

  // Global CTA/footer links that should reflect the CMS data.
  qa('a[href*="linkedin.com/company/wilma-collective"]').forEach(link => {
    link.setAttribute('href', siteSettings.companyLinkedIn);
  });
}

function applyAbout(about, siteSettings) {
  if (!about) return;

  const hero = q('.about-hero-new');
  if (hero) {
    setText('.about-hero-new .about-eyebrow', about.hero?.eyebrow, hero);
    setHTML('.about-hero-new .about-h1-new', about.hero?.titleHtml, hero);
  }

  const agency = q('.about-agency');
  if (agency) {
    setText('.about-agency .about-eyebrow', about.agency?.eyebrow, agency);
    setHTML('.about-agency .about-agency-title', about.agency?.titleHtml, agency);
    qa('.about-agency .about-agency-body').forEach((el, index) => {
      const body = about.agency?.bodies?.[index];
      if (body) el.textContent = body;
    });
    qa('.about-agency .about-stat').forEach((stat, index) => {
      const item = about.agency?.stats?.[index];
      if (!item) return;
      setText('.about-stat-num', item.num, stat);
      setText('.about-stat-label', item.label, stat);
    });
  }

  const values = q('.about-values-new');
  if (values) {
    setText('.about-values-new .section-label', about.values?.eyebrow, values);
    setHTML('.about-values-new .section-title', about.values?.titleHtml, values);
    qa('.about-values-new .val-card').forEach((card, index) => {
      const item = about.values?.cards?.[index];
      if (!item) return;
      setText('.val-title', item.title, card);
      setText('.val-body', item.body, card);
    });
  }

  const founder = q('.about-founder');
  if (founder) {
    setText('.about-founder .about-eyebrow', about.founder?.eyebrow, founder);
    setHTML('.about-founder .about-founder-title', about.founder?.titleHtml, founder);
    setText('.about-founder .about-founder-intro', about.founder?.intro, founder);
    setText('.about-founder .about-founder-body', about.founder?.body, founder);
    setText('.about-founder .about-founder-funfact-label', about.founder?.funFactLabel, founder);
    setText('.about-founder .about-founder-funfact-lead', about.founder?.funFactLead, founder);
    setText('.about-founder .about-founder-funfact-body', about.founder?.funFactBody, founder);
    const btn = q('.about-linkedin-btn', founder);
    if (btn) {
      btn.setAttribute('href', siteSettings.founderLinkedIn);
      const textNode = Array.from(btn.childNodes)
        .reverse()
        .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
      if (textNode && about.founder?.linkedinLabel) {
        textNode.textContent = ` ${about.founder.linkedinLabel}`;
      }
    }
  }

  qa('a[href*="linkedin.com/in/lise-kriekemans"]').forEach(link => {
    link.setAttribute('href', siteSettings.founderLinkedIn);
  });
}

function applyBlog(blog) {
  if (!blog) return;

  const page = q('.blog-page');
  if (!page) return;

  setText('.blog-hero .about-eyebrow', blog.hero?.eyebrow, page);
  setHTML('.blog-hero .blog-hero-title', blog.hero?.titleHtml, page);
  setText('.blog-hero .blog-hero-desc', blog.hero?.description, page);
  setText('.blog-hero .blog-issue', blog.hero?.issue, page);

  qa('.blog-filter').forEach((btn, index) => {
    if (blog.filters?.[index]) btn.textContent = blog.filters[index];
  });

  const featured = q('.blog-featured', page);
  if (featured) {
    setText('.blog-tag', blog.featured?.tag, featured);
    setHTML('.blog-featured-title', blog.featured?.titleHtml, featured);
    setText('.blog-featured-excerpt', blog.featured?.excerpt, featured);
    const placeholder = q('.blog-featured-placeholder', featured);
    if (placeholder && blog.featured?.author) {
      placeholder.textContent = blog.featured.author.trim().charAt(0).toUpperCase();
    }
    const meta = qa('.blog-meta span', featured).filter(el => !el.classList.contains('blog-meta-dot'));
    if (meta[0]) meta[0].textContent = blog.featured?.author || '';
    if (meta[1]) meta[1].textContent = blog.featured?.readingTime || '';
    if (meta[2]) meta[2].textContent = blog.featured?.date || '';
  }

  qa('.blog-grid .blog-card').forEach((card, index) => {
    const item = blog.cards?.[index];
    if (!item) return;
    setText('.blog-tag', item.tag, card);
    setHTML('.blog-card-title', item.titleHtml, card);
    setText('.blog-card-excerpt', item.excerpt, card);
    const meta = qa('.blog-card-meta span', card).filter(el => !el.classList.contains('blog-meta-dot'));
    if (meta[0]) meta[0].textContent = item.readingTime || '';
    if (meta[1]) meta[1].textContent = item.date || '';
  });

  setText('.blog-newsletter .blog-newsletter-label', blog.newsletter?.eyebrow);
  setHTML('.blog-newsletter .blog-newsletter-title', blog.newsletter?.titleHtml);
  setText('.blog-newsletter .blog-newsletter-body', blog.newsletter?.body);
  setText('.blog-newsletter .blog-newsletter-btn', blog.newsletter?.ctaLabel);
}

function applyMeta(siteSettings) {
  if (!siteSettings) return;
  if (siteSettings.brandName) document.title = `${siteSettings.brandName} | Scale Your Purpose`;
  setMeta('meta[name="description"]', 'content', siteSettings.description);
  setMeta('meta[name="author"]', 'content', 'Lise Kriekemans');
  setMeta('meta[name="theme-color"]', 'content', siteSettings.themeColor);
  setMeta('meta[property="og:title"]', 'content', 'Wilma Collective | Scale Your Purpose');
  setMeta('meta[property="og:description"]', 'content', siteSettings.description);
  setMeta('meta[property="og:image"]', 'content', `https://wilmacollective.co.za${siteSettings.ogImage}`);
  setMeta('meta[name="twitter:title"]', 'content', 'Wilma Collective | Scale Your Purpose');
  setMeta('meta[name="twitter:description"]', 'content', siteSettings.description);
  setMeta('meta[name="twitter:image"]', 'content', `https://wilmacollective.co.za${siteSettings.ogImage}`);
}

function init() {
  applyMeta(data.siteSettings);
  applyHome(data.home, data.siteSettings || {});
  applyAbout(data.about, data.siteSettings || {});
  applyBlog(data.blog, data.siteSettings || {});
  replaceFooter(data.siteSettings || {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
