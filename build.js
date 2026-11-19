// dressed & nested – statischer Seitengenerator
// Liest content/site.json und content/posts/*.md und schreibt die fertige Website nach dist/.
//   node build.js            → dist/          (für Netlify, schöne URLs wie /slip-dress-herbst-strick/)
//   node build.js --preview  → dist-preview/  (Links mit index.html, zum lokalen Öffnen ohne Server)
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const PREVIEW = process.argv.includes("--preview");
const ROOT = __dirname;
const OUT = path.join(ROOT, PREVIEW ? "dist-preview" : "dist");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const SITE_URL = site.url.replace(/\/$/, "");

/* ---------- Hilfsfunktionen ---------- */
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const prefix = (depth) => "../".repeat(depth);
// Link auf eine Seite (dir = "" für Startseite, sonst "slug/")
const href = (depth, dir = "") => {
  const p = prefix(depth) + dir;
  if (PREVIEW) return p + "index.html";
  return p || "./";
};
const asset = (depth, p) => prefix(depth) + String(p).replace(/^\//, "");
const absUrl = (p) => SITE_URL + "/" + String(p).replace(/^\//, "");
const fmtDate = (d) => new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const AUTHOR = { name: "dressed & nested", bio: "", photo: "", ...(site.author || {}) };
const CAT = { interior: "Interior", fashion: "Fashion" };
const COLORS = [
  { key: "braun", name: "Dunkelbraun", hex: "#4B2E20", note: "Akzent" },
  { key: "hellblau", name: "Hellblau", hex: "#BFD8EE", note: "Licht" },
  { key: "schwarz", name: "Falsches Schwarz", hex: "#1C1B20", note: "Tiefe" },
  { key: "weiss", name: "Weiß", hex: "#FFFFFF", note: "Ruhe" },
];

// Bildgröße aus JPEG/PNG lesen (für width/height gegen Layout-Springen)
function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  } catch (e) {}
  return { w: 1000, h: 1500 };
}

/* ---------- Beiträge laden ---------- */
const posts = fs.readdirSync(path.join(ROOT, "content/posts"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(ROOT, "content/posts", f), "utf8"));
    const slug = data.slug || f.replace(/\.md$/, "");
    const img = data.image || "";
    const size = imageSize(path.join(ROOT, "public", img.replace(/^\//, "")));
    const words = content.split(/\s+/).filter(Boolean).length;
    return {
      ...data, slug, image: img, size,
      products: (data.products || []).filter((p) => p && p.name),
      html: marked.parse(content),
      minutes: Math.max(1, Math.round(words / 200)),
    };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date));
const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));

/* ---------- Bausteine ---------- */
const ICON = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  bookmark: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>`,
  bag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`,
  up: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`,
  pin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.4-4.5-4.4-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.4 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2.9-.9 2.1-1.3 2.9A10 10 0 1 0 12 2z"/></svg>`,
  arrow: `<span class="arr" aria-hidden="true">→</span>`,
  heart: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>`,
};

function head({ depth, title, description, canonical, image, type = "website", extra = "" }) {
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} – Interior & Fashion zum Merken`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title || site.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(absUrl(image))}">\n<meta name="twitter:card" content="summary_large_image">` : ""}
${site.pinterest_domain_verify ? `<meta name="p:domain_verify" content="${esc(site.pinterest_domain_verify)}">` : ""}
<meta name="theme-color" content="#4B2E20">
<link rel="icon" href="${asset(depth, "favicon.svg")}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="${asset(depth, "assets/style.css")}">
${extra}`;
}

function header(depth) {
  const home = href(depth);
  return `<header class="top">
  <div class="wrap">
    <a class="logo" href="${home}" aria-label="${esc(site.name)} – Startseite">dressed<span class="amp">&amp;</span>nested</a>
    <nav class="nav" aria-label="Hauptnavigation">
      <a href="${home}#interior">Interior</a>
      <a href="${home}#fashion">Fashion</a>
      <a href="${home}#shop">Shop the Look</a>
    </nav>
    <form class="search" action="${home}" role="search">
      <label for="q" class="sr">Suche</label>
      ${ICON.search}
      <input id="q" name="q" type="search" placeholder="Animal Print, Strick, Loafer …" autocomplete="off">
    </form>
    <a class="icon-btn" id="savedBtn" href="${home}#merkliste" aria-label="Merkliste anzeigen" title="Merkliste">${ICON.bookmark}<b id="savedCount" hidden>0</b></a>
    <a class="btn dark" href="${esc(site.pinterest_profile)}" target="_blank" rel="noopener">Auf Pinterest folgen</a>
  </div>
</header>`;
}

function footer(depth) {
  const home = href(depth);
  // nur Boards, in denen es schon Beiträge gibt
  const boardLinks = (cat) => [...new Set(posts.filter((p) => p.category === cat).map((p) => p.board))]
    .map((k) => `<li><a href="${home}#board-${k}">${esc(site.boards[k] || k)}</a></li>`).join("");
  return `<footer class="foot">
  <div class="wrap">
    <div class="f-grid">
      <div class="brand"><p class="disclose"><strong>Affiliate-Hinweis.</strong> Links mit „Zum Shop“ sind Affiliate-Links. Kaufst du darüber, bekomme ich eine kleine Provision. Für dich ändert sich am Preis nichts.</p></div>
      <div><h4 class="label">Interior</h4><ul>${boardLinks("interior")}<li><a href="${home}#interior">Alles Interior</a></li></ul></div>
      <div><h4 class="label">Fashion</h4><ul>${boardLinks("fashion")}<li><a href="${home}#fashion">Alle Outfits</a></li></ul></div>
      <div><h4 class="label">Folgen</h4><ul><li><a href="${esc(site.pinterest_profile)}" target="_blank" rel="noopener">Pinterest</a></li><li><a href="${esc(site.instagram_profile)}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
    </div>
    <svg class="wordmark" viewBox="0 0 1000 150" aria-hidden="true"><text x="2" y="122" font-size="148" textLength="996" lengthAdjust="spacingAndGlyphs">dressed<tspan class="wm-amp">&amp;</tspan>nested</text></svg>
    <div class="legal"><span>© ${new Date().getFullYear()} ${esc(site.name)}</span><span><a href="${href(depth, "impressum/")}">Impressum</a><a href="${href(depth, "datenschutz/")}">Datenschutz</a></span></div>
  </div>
</footer>
<script src="${asset(depth, "assets/app.js")}" defer></script>`;
}

function page({ depth, headHtml, body, bodyClass = "" }) {
  return `<!doctype html>
<html lang="${site.language}">
<head>
${headHtml}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Zum Inhalt springen</a>
${header(depth)}
${body}
${footer(depth)}
</body>
</html>
`;
}

// Ein Pin im Feed
function pinCard(p, depth, i = 0) {
  const link = href(depth, p.slug + "/");
  const board = site.boards[p.board] || p.board;
  const tags = [p.title, p.excerpt, board, CAT[p.category], ...(p.products || []).map((x) => x.name)].join(" ").toLowerCase();
  const data = `data-id="${p.slug}" data-cat="${p.category}" data-board="${p.board}" data-color="${p.color}" data-shop="${p.products.length ? 1 : 0}" data-tags="${esc(tags)}" style="--d:${Math.min(i * 35, 600)}ms"`;
  if (p.pin_style === "list") {
    return `<article class="pin list" ${data}><a class="l" href="${link}"><span class="label">Einkaufsliste</span><h3>${esc(p.title)}</h3><ol>${p.products.map((x) => `<li><span>${esc(x.name)}</span><em>${esc(x.price)}</em></li>`).join("")}</ol><span class="more">Zum Look ${ICON.arrow}</span></a></article>`;
  }
  return `<article class="pin" ${data}>
  <div class="pin-media">
    <a class="pin-link" href="${link}" tabindex="-1" aria-hidden="true"><img src="${asset(depth, p.image)}" alt="${esc(p.image_alt || p.title)}" width="${p.size.w}" height="${p.size.h}" loading="lazy" decoding="async"></a>
    ${p.products.length ? `<span class="tag">Shop the Look</span>` : ""}
    <div class="pin-overlay">
      <div class="ov-top"><span class="ov-board">${esc(board)}</span><button class="save" type="button" data-save="${p.slug}" aria-pressed="false">Merken</button></div>
      <div class="ov-bottom">${p.products.length ? `<span class="ov-pill">${ICON.bag}${p.products.length} Teile shoppen</span>` : "<span></span>"}<span class="ov-round">${ICON.up}</span></div>
    </div>
  </div>
  <div class="pin-body">
    <h3 class="pin-title"><a href="${link}">${esc(p.title)}</a></h3>
    <div class="pin-meta"><span class="av">&amp;</span><span class="who parts"><span>${CAT[p.category]}</span><span>${esc(board)}</span></span></div>
  </div>
</article>`;
}

function quoteCard(q) {
  return `<article class="pin quote" data-cat="quote" data-tags="${esc(q.text.toLowerCase())}"><div class="q q-${q.style}"><p>${esc(q.text)}</p><span><span>${esc(q.by)}</span><span>dressed <span class="amp">&amp;</span> nested</span></span></div></article>`;
}

/* ---------- Startseite ---------- */
function buildHome() {
  const depth = 0;
  const botw = site.board_of_the_week;
  const botwPosts = botw.posts.map((s) => bySlug[s]).filter(Boolean);
  const boardsHtml = Object.entries(site.boards).map(([k, name]) => {
    const own = posts.filter((p) => p.board === k);
    if (!own.length) return "";
    const cover = own.slice(0, 3);
    return `<button class="board" type="button" data-board="${k}" aria-pressed="false"><span class="board-cover" data-n="${cover.length}">${cover.map((p) => `<span><img src="${asset(depth, p.image)}" alt="" loading="lazy"></span>`).join("")}</span><span><strong>${esc(name)}</strong><small>${own.length} ${own.length === 1 ? "Beitrag" : "Beiträge"}</small></span></button>`;
  }).join("");

  const feed = [];
  posts.forEach((p, i) => {
    feed.push(pinCard(p, depth, i));
    (site.quotes || []).filter((q) => q.after === i + 1).forEach((q) => feed.push(quoteCard(q)));
  });

  const body = `<main id="main">
<section class="hero">
  <div class="wrap">
    <div class="hero-text">
      <h1><span class="ln l1">Get <span class="c">dressed.</span></span><span class="ln l2">Get <span class="u">nested.</span></span></h1>
      <div class="hero-cta">
        <a class="btn sun" href="#feed" data-scroll>Feed ansehen ${ICON.arrow}</a>
        <a class="btn ghost" href="#shop">Shop the Look</a>
      </div>
    </div>
    <div class="botw">
      <div class="botw-grid">${botwPosts.map((p) => `<a href="${href(depth, p.slug + "/")}" aria-label="${esc(p.title)}"><img src="${asset(depth, p.image)}" alt="" ></a>`).join("")}</div>
      <div class="botw-foot">
        <div><span class="label">Board der Woche</span><h2>${esc(botw.title)}</h2></div>
        <a class="btn line" href="#farbe-${botw.color}">Ansehen</a>
      </div>
    </div>
  </div>
</section>

<section class="boards-sec" aria-labelledby="bh">
  <div class="wrap">
    <div class="sec-head"><h2 class="sec-h" id="bh">Boards</h2><a href="${esc(site.pinterest_profile)}" target="_blank" rel="noopener">Alle auf Pinterest ${ICON.arrow}</a></div>
    <div class="boards" id="boards">${boardsHtml}</div>
  </div>
</section>

<div class="tabs-bar" id="feed">
  <div class="wrap">
    <div class="tabs" role="toolbar" aria-label="Kategorien" id="tabs">
      <button class="tab" type="button" data-f="all" aria-pressed="true">Für dich<sup></sup></button>
      <button class="tab" type="button" data-f="interior" aria-pressed="false">Interior<sup></sup></button>
      <button class="tab" type="button" data-f="fashion" aria-pressed="false">Fashion<sup></sup></button>
      <button class="tab" type="button" data-f="shop" aria-pressed="false">Shop the Look<sup></sup></button>
    </div>
    <div class="active-filter" id="activeFilter" hidden><span>Gefiltert nach</span><button type="button" id="clearFilter"></button></div>
  </div>
</div>

<div class="wrap">
  <div class="feed" id="grid">
${feed.join("\n")}
  </div>
  <div class="empty" id="empty" hidden><strong>Hier ist noch nichts.</strong>Probier einen anderen Suchbegriff oder merk dir ein paar Pins.</div>
</div>

<section class="color-sec" aria-labelledby="ch">
  <div class="wrap sec-head"><h2 class="sec-h" id="ch">Shop by Color</h2><span>Die vier Farben dieser Saison</span></div>
  <div class="swatches" id="swatches">${COLORS.map((c) => `<button class="sw" type="button" data-color="${c.key}" aria-pressed="false"><i style="background:${c.hex}"></i><span><strong>${c.name}</strong><small class="parts"><span>${c.hex}</span><span>${c.note}</span></small></span></button>`).join("")}</div>
</section>
</main>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: SITE_URL + "/", inLanguage: site.language })}</script>`;

  return page({
    depth,
    headHtml: head({ depth, title: "", description: site.description, canonical: SITE_URL + "/", image: botwPosts[0] && botwPosts[0].image }),
    body,
    bodyClass: "home",
  });
}

/* ---------- Artikelseite ---------- */
function buildPost(p) {
  const depth = 1;
  const canonical = `${SITE_URL}/${p.slug}/`;
  const board = site.boards[p.board] || p.board;
  const pinUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(canonical)}&media=${encodeURIComponent(absUrl(p.image))}&description=${encodeURIComponent(p.title)}`;
  const related = posts.filter((x) => x.slug !== p.slug && x.board === p.board)
    .concat(posts.filter((x) => x.slug !== p.slug && x.board !== p.board && x.category === p.category))
    .slice(0, 5);
  const products = p.products.map((x, i) => {
    const has = x.url && x.url.trim();
    const fav = Number(p.favorite) === i + 1;
    return `<li class="prod${fav ? " fav" : ""}">
      <span class="ph ph-${(i % 4) + 1}">${String(i + 1).padStart(2, "0")}</span>
      <span class="pn">${fav ? `<em class="fav-tag">${ICON.heart} mein Liebling</em>` : ""}<b>${esc(x.name)}</b>${x.shop ? `<small>${esc(x.shop)}</small>` : ""}</span>
      ${has ? `<a class="go" href="${esc(x.url)}" target="_blank" rel="sponsored nofollow noopener"><span class="parts">${[x.price, "Zum Shop"].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join("")}</span></a>`
            : `<span class="go off" title="Affiliate-Link fehlt noch">Link folgt</span>`}
    </li>`;
  }).join("");

  const ld = {
    "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt,
    image: [absUrl(p.image)], datePublished: isoDate(p.date), dateModified: isoDate(p.updated || p.date),
    author: { "@type": "Person", name: AUTHOR.name, url: SITE_URL + "/" },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: canonical, inLanguage: site.language,
  };
  const crumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: board, item: `${SITE_URL}/#board-${p.board}` },
      { "@type": "ListItem", position: 3, name: p.title, item: canonical },
    ],
  };

  const body = `<main id="main">
<article class="post">
  <div class="post-top tint-${p.color}">
    <div class="wrap">
      <nav class="crumbs" aria-label="Brotkrumen"><a href="${href(depth)}">Start</a><span>/</span><a href="${href(depth)}#${p.category}">${CAT[p.category]}</a><span>/</span><a href="${href(depth)}#board-${p.board}">${esc(board)}</a></nav>
      <div class="post-grid">
        <figure class="post-figure">
          <img src="${asset(depth, p.image)}" alt="${esc(p.image_alt || p.title)}" width="${p.size.w}" height="${p.size.h}" fetchpriority="high">
          <a class="pin-it" href="${pinUrl}" target="_blank" rel="noopener">${ICON.pin} Merken auf Pinterest</a>
        </figure>
        <div class="post-intro">
          <span class="label parts"><span>${CAT[p.category]}</span><span>${esc(board)}</span></span>
          <h1>${esc(p.title)}</h1>
          <p class="post-meta"><span class="av av-n">${esc(AUTHOR.name.charAt(0))}</span><span class="parts"><span>von <b>${esc(AUTHOR.name)}</b></span><span><time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time></span><span>${p.minutes} Min. Lesezeit</span></span></p>
          ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
          <p class="lead">${esc(p.excerpt)}</p>
          <div class="post-actions">
            <button class="save big" type="button" data-save="${p.slug}" aria-pressed="false">Merken</button>
            <a class="btn line" href="${pinUrl}" target="_blank" rel="noopener">${ICON.pin} Auf Pinterest pinnen</a>
          </div>
          ${p.products.length ? `<section class="shop-box" aria-labelledby="stl">
            <div class="shop-head"><h2 id="stl">Shop the Look</h2><small>Affiliate-Links</small></div>
            <ul>${products}</ul>
            <p class="shop-note">Preise zum Zeitpunkt der Veröffentlichung, Änderungen möglich.</p>
          </section>` : ""}
        </div>
      </div>
    </div>
  </div>
  <div class="wrap">
    <div class="prose">
      ${p.products.length ? `<p class="disclose-top">Dieser Beitrag enthält Affiliate-Links.</p>` : ""}
      ${p.html}
      ${p.tip ? `<aside class="tip"><span class="tip-h">${esc(AUTHOR.name)}s Tipp</span><p>${esc(p.tip)}</p></aside>` : ""}
      <aside class="author-card">
        ${AUTHOR.photo ? `<img class="author-photo" src="${asset(depth, AUTHOR.photo)}" alt="${esc(AUTHOR.name)}" width="96" height="96">` : `<span class="author-photo ph-initial">${esc(AUTHOR.name.charAt(0))}</span>`}
        <div>
          <p class="hi">Hi, ich bin ${esc(AUTHOR.name)}!</p>
          <p>${esc(AUTHOR.bio)}</p>
          <p class="sig">xx ${esc(AUTHOR.name)}</p>
          <a class="btn line" href="${esc(site.pinterest_profile)}" target="_blank" rel="noopener">${ICON.pin} Folg mir auf Pinterest</a>
        </div>
      </aside>
    </div>
  </div>
</article>
${related.length ? `<section class="related" aria-labelledby="rh">
  <div class="wrap">
    <div class="sec-head"><h2 class="sec-h" id="rh">Das könnte dir auch gefallen</h2><a href="${href(depth)}#board-${p.board}">Ganzes Board ${ICON.arrow}</a></div>
    <div class="feed small">${related.map((r, i) => pinCard(r, depth, i)).join("\n")}</div>
  </div>
</section>` : ""}
</main>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>`;

  return page({
    depth,
    headHtml: head({ depth, title: p.title, description: p.excerpt, canonical, image: p.image, type: "article",
      extra: `<meta property="article:published_time" content="${isoDate(p.date)}">\n<meta property="article:section" content="${CAT[p.category]}">` }),
    body,
    bodyClass: "post-page",
  });
}

/* ---------- Rechtliche Seiten (Platzhalter) ---------- */
function buildLegal(slug, title, html) {
  const depth = 1;
  return page({
    depth,
    headHtml: head({ depth, title, description: `${title} von ${site.name}`, canonical: `${SITE_URL}/${slug}/`, extra: `<meta name="robots" content="noindex">` }),
    body: `<main id="main" class="wrap legal-page"><div class="prose"><h1>${title}</h1>${html}</div></main>`,
  });
}
const IMPRESSUM = `<p class="todo">Platzhalter: Bitte mit deinen echten Angaben ersetzen. Ein Generator hilft, zum Beispiel bei e-recht24.de.</p>
<h2>Angaben gemäß § 5 DDG</h2><p>[Vorname Nachname]<br>[Straße Hausnummer]<br>[PLZ Ort]</p>
<h2>Kontakt</h2><p>E-Mail: [deine E-Mail-Adresse]</p>
<h2>Verantwortlich für den Inhalt</h2><p>[Vorname Nachname, Anschrift wie oben]</p>`;
const DATENSCHUTZ = `<p class="todo">Platzhalter: Hier kommt deine Datenschutzerklärung hin. Erwähne darin mindestens das Hosting (z. B. Netlify), Google Fonts, Affiliate-Links und den Pinterest-Button.</p>`;

/* ---------- Schreiben ---------- */
function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, "public"), OUT);
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));
write("index.html", buildHome());
posts.forEach((p) => write(`${p.slug}/index.html`, buildPost(p)));
write("impressum/index.html", buildLegal("impressum", "Impressum", IMPRESSUM));
write("datenschutz/index.html", buildLegal("datenschutz", "Datenschutz", DATENSCHUTZ));
write("404.html", buildLegal("404", "Seite nicht gefunden", `<p>Diese Seite gibt es nicht (mehr). <a href="/">Zur Startseite</a></p>`).replace(/\.\.\//g, "/"));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc></url>
${posts.map((p) => `  <url><loc>${SITE_URL}/${p.slug}/</loc><lastmod>${isoDate(p.updated || p.date)}</lastmod></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`✓ ${posts.length} Beiträge → ${path.relative(ROOT, OUT)}/`);
