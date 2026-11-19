/* dressed & nested – Interaktionen für alle Seiten */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---------- Merkliste (lokal im Browser) ---------- */
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem("dn-saved") || "[]")); } catch (e) {}
  const persist = () => { try { localStorage.setItem("dn-saved", JSON.stringify([...saved])); } catch (e) {} };
  function paintSaves() {
    $$("[data-save]").forEach((b) => { const on = saved.has(b.dataset.save); b.setAttribute("aria-pressed", on); b.textContent = on ? "Gemerkt" : "Merken"; });
    const c = $("#savedCount"); if (c) { c.textContent = saved.size; c.hidden = !saved.size; }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-save]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const id = b.dataset.save; saved.has(id) ? saved.delete(id) : saved.add(id);
    persist(); paintSaves(); if (state && state.saved) apply();
  });
  paintSaves();

  /* ---------- Feed-Filter (nur Startseite) ---------- */
  const grid = $("#grid"), tabs = $("#tabs");
  let state = null;
  const BOARD_NAMES = {}; $$(".board").forEach((b) => (BOARD_NAMES[b.dataset.board] = b.querySelector("strong").textContent));
  const COLOR_NAMES = {}; $$(".sw").forEach((b) => (COLOR_NAMES[b.dataset.color] = b.querySelector("strong").textContent));

  function matches(el, s) {
    if (el.dataset.cat === "quote") return s.f === "all" && !s.board && !s.color && !s.q && !s.saved;
    if (s.f === "shop" ? el.dataset.shop !== "1" : s.f !== "all" && el.dataset.cat !== s.f) return false;
    if (s.board && el.dataset.board !== s.board) return false;
    if (s.color && el.dataset.color !== s.color) return false;
    if (s.q && !el.dataset.tags.includes(s.q)) return false;
    if (s.saved && !saved.has(el.dataset.id)) return false;
    return true;
  }
  function apply() {
    if (!grid || !tabs) return;
    const pins = $$(".pin", grid); let n = 0;
    pins.forEach((el) => { const ok = matches(el, state); el.hidden = !ok; if (ok) n++; });
    $$(".tab", tabs).forEach((t) => {
      t.setAttribute("aria-pressed", t.dataset.f === state.f);
      t.querySelector("sup").textContent = pins.filter((el) => el.dataset.cat !== "quote" && matches(el, { ...state, f: t.dataset.f })).length;
    });
    $$(".sw").forEach((b) => b.setAttribute("aria-pressed", b.dataset.color === state.color));
    $$(".board").forEach((b) => b.setAttribute("aria-pressed", b.dataset.board === state.board));
    $("#savedBtn") && $("#savedBtn").classList.toggle("on", state.saved);
    const lbl = state.saved ? "Merkliste" : state.board ? BOARD_NAMES[state.board] : state.color ? COLOR_NAMES[state.color] : state.q ? `„${state.q}“` : "";
    $("#activeFilter").hidden = !lbl;
    $("#clearFilter").innerHTML = lbl + ' <span aria-hidden="true">✕</span>';
    $("#empty").hidden = n > 0;
  }
  const toFeed = () => {
    const t = $("#feed"); if (!t) return;
    const y = t.getBoundingClientRect().top + scrollY - 60;
    scrollTo({ top: y, behavior: calm ? "auto" : "smooth" });
  };
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const s = { f: "all", board: "", color: "", q: state ? state.q : "", saved: false };
    if (["interior", "fashion", "shop"].includes(h)) s.f = h;
    else if (h.startsWith("board-")) s.board = h.slice(6);
    else if (h.startsWith("farbe-")) s.color = h.slice(6);
    else if (h === "merkliste") s.saved = true;
    else if (h !== "feed") return false;
    state = s; apply(); return true;
  }
  if (grid && tabs) {
    state = { f: "all", board: "", color: "", q: "", saved: false };
    try { const q = new URLSearchParams(location.search).get("q"); if (q) { state.q = q.trim().toLowerCase(); $("#q").value = q; } } catch (e) {}
    const setHash = (h) => { if (location.hash === "#" + h) { fromHash(); toFeed(); } else location.hash = h; };
    tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) { state.f = b.dataset.f; apply(); } });
    $("#swatches").addEventListener("click", (e) => { const b = e.target.closest(".sw"); if (!b) return; state.color === b.dataset.color ? clear() : setHash("farbe-" + b.dataset.color); });
    $("#boards").addEventListener("click", (e) => { const b = e.target.closest(".board"); if (!b) return; state.board === b.dataset.board ? clear() : setHash("board-" + b.dataset.board); });
    function clear() { state = { f: state.f, board: "", color: "", q: "", saved: false }; $("#q").value = ""; history.replaceState(null, "", location.pathname); apply(); }
    $("#clearFilter").addEventListener("click", clear);
    $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); apply(); });
    $(".search").addEventListener("submit", (e) => { e.preventDefault(); toFeed(); });
    $$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); toFeed(); }));
    addEventListener("hashchange", () => { if (fromHash()) toFeed(); });
    if (location.hash && fromHash()) setTimeout(toFeed, 60); else apply();
  }

  /* ---------- Scroll: Header schrumpft, Fortschritt, Headline driftet, Header versteckt sich ---------- */
  const hero = $(".hero");
  let tick = false, last = scrollY;
  function onScroll() {
    tick = false;
    const y = scrollY, max = root.scrollHeight - innerHeight;
    root.classList.toggle("scrolled", y > 24);
    root.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);
    if (hero && !calm) root.style.setProperty("--hp", Math.min(1, Math.max(0, y / (hero.offsetHeight || 1))).toFixed(4));
    if (Math.abs(y - last) > 6) { root.classList.toggle("hide-h", y > last && y > 420); last = y; }
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Navigation: Pill gleitet unter den Links ---------- */
  const nav = $(".nav");
  if (nav) {
    const pill = document.createElement("span"); pill.className = "pill"; nav.prepend(pill);
    $$("a", nav).forEach((a) => a.addEventListener("mouseenter", () => {
      $$("a", nav).forEach((x) => x.classList.toggle("on", x === a));
      pill.style.width = a.offsetWidth + "px"; pill.style.transform = `translateX(${a.offsetLeft}px)`;
    }));
    nav.addEventListener("mouseleave", () => $$("a", nav).forEach((x) => x.classList.remove("on")));
  }

  if (calm || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;

  /* ---------- Eigener Cursor ---------- */
  const c = document.createElement("div"); c.className = "cursor"; c.innerHTML = "<span>Ansehen</span>"; document.body.append(c);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY; root.classList.add("has-cursor");
    const big = e.target.closest(".pin-media,.botw-grid a,.board-cover");
    c.classList.toggle("big", !!big && !e.target.closest(".save"));
    c.classList.toggle("link", !big && !!e.target.closest("a,button,input"));
    if (big) c.firstChild.textContent = e.target.closest(".board-cover") ? "Board" : "Ansehen";
  });
  document.addEventListener("mouseleave", () => root.classList.remove("has-cursor"));
  (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();

  /* ---------- 3D-Kippen mit Lichtreflex ---------- */
  $$(".feed").forEach((feed) => {
    feed.addEventListener("mousemove", (e) => {
      const m = e.target.closest(".pin-media"); if (!m) return;
      const r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      m.classList.add("tilting");
      m.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
      m.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
      m.style.setProperty("--mx", px * 100 + "%"); m.style.setProperty("--my", py * 100 + "%");
    });
    feed.addEventListener("mouseout", (e) => {
      const m = e.target.closest(".pin-media");
      if (m && !m.contains(e.relatedTarget)) { m.classList.remove("tilting"); m.style.setProperty("--rx", "0deg"); m.style.setProperty("--ry", "0deg"); }
    });
  });
})();
