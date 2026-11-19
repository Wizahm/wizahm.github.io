(() => {
  "use strict";
  const S = window.SITE;

  /* Google Form for "Ask me about". Paste the WEBSITE LINK printed by google-form-setup.gs
     (it contains __TOPIC__, which the site replaces with what the visitor picked).
     Empty = falls back to opening the visitor's email app. */
  const GOOGLE_FORM_PREFILL = "https://docs.google.com/forms/d/e/1FAIpQLSeASPTdMRIRpXEJcyyp_XzjNecPE2B9qqKHCBPC7UuufD0sHw/viewform?usp=pp_url&entry.743808413=__TOPIC__";

  /* ── Colour moods on the Midnight-to-Navy palette (#0a031d #070a25 #090c2a #071132 #0a183b).
       All backgrounds are near-identical in brightness, so moving between sections is a gentle hue shift.
       accent = bright colour for text/outlines on dark · fill = deeper colour behind white text. ── */
  const THEMES = {
    home:      { bg: "#070a25", ink: "#EEF1F8", accent: "#E0B84A", accent2: "#8DB4F0", fill: "#1F3B7A", tileA: "#C9A227", tileB: "#2C4B86", tileC: "#090c2a", line: "#3B4C7E", pattern: "star" },
    gold:      { bg: "#0a031d", ink: "#F3EEDF", accent: "#E8C766", accent2: "#8DB4F0", fill: "#8A6A12", tileA: "#C9A227", tileB: "#3A3A7A", tileC: "#0d0828", line: "#4F4772", pattern: "star" },
    lapis:     { bg: "#071132", ink: "#EAF0FB", accent: "#8DB4F0", accent2: "#E0B84A", fill: "#2A4F9E", tileA: "#3A63B8", tileB: "#C9A227", tileC: "#0a1538", line: "#3A5490", pattern: "hex" },
    turquoise: { bg: "#070a25", ink: "#E8F6F6", accent: "#5FD0C8", accent2: "#E0B84A", fill: "#0E6B70", tileA: "#128A8F", tileB: "#E0B84A", tileC: "#0a1230", line: "#2F6A78", pattern: "diamond" },
    sky:       { bg: "#071132", ink: "#EAF3FC", accent: "#7CC0F0", accent2: "#E0B84A", fill: "#1D6FB0", tileA: "#4A9BD6", tileB: "#E0B84A", tileC: "#0a1538", line: "#3A6A9A", pattern: "hex" },
    amber:     { bg: "#0a031d", ink: "#F7EEDF", accent: "#F0B860", accent2: "#8DB4F0", fill: "#9A5B0C", tileA: "#E3A23B", tileB: "#2C4B86", tileC: "#0d0828", line: "#6A5236", pattern: "diamond" },
    teal:      { bg: "#090c2a", ink: "#E6F6EF", accent: "#6FD3AE", accent2: "#E0B84A", fill: "#13684F", tileA: "#2E9A78", tileB: "#C9A227", tileC: "#0c1032", line: "#2F6A5C", pattern: "star" },
    navy:      { bg: "#071132", ink: "#ECEFF7", accent: "#B9C6E8", accent2: "#D4AF37", fill: "#34508F", tileA: "#34508F", tileB: "#B08D2E", tileC: "#0a1538", line: "#44578A", pattern: "diamond" },
    ivory:     { bg: "#090c2a", ink: "#F5F0E2", accent: "#F3E3B5", accent2: "#8DB4F0", fill: "#2C4B86", tileA: "#C9A227", tileB: "#2C4B86", tileC: "#0c1032", line: "#4A5684", pattern: "hex" },
    cobalt:    { bg: "#070a25", ink: "#EDF0FC", accent: "#9FB3FF", accent2: "#E0A060", fill: "#2340B5", tileA: "#3557D0", tileB: "#C77D2E", tileC: "#0a0d2c", line: "#3E4E9A", pattern: "star" }
  };

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ── Analytics (Umami). Silently does nothing if Umami isn't loaded or is blocked. ── */
  function track(name, data) {
    try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name, data); } catch (_) {}
  }

  /* ── Build graph model ── */
  const nodes = [];
  const byId = {};
  const edges = [];
  const add = (n) => { nodes.push(n); byId[n.id] = n; return n; };

  add({ id: "me", type: "center", label: S.person.name, theme: "home" });
  S.categories.forEach((c) => {
    add({ id: c.id, type: "category", label: c.label, theme: c.theme, data: c });
    edges.push({ a: "me", b: c.id, kind: "spoke" });
    c.items.forEach((it) => {
      add({ id: it.id, type: "item", label: it.label, theme: it.theme || c.theme, cat: c.id, data: it });
      edges.push({ a: c.id, b: it.id, kind: "spoke" });
    });
  });
  // Cross-links (deduplicated, both directions count as "related")
  const related = {};
  const seen = new Set();
  nodes.forEach((n) => {
    (n.data && n.data.links || []).forEach((t) => {
      if (!byId[t]) return;
      (related[n.id] = related[n.id] || new Set()).add(t);
      (related[t] = related[t] || new Set()).add(n.id);
      const key = [n.id, t].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: n.id, b: t, kind: "cross" });
    });
  });

  /* ── Radial layout: you → categories → items ── */
  const R1 = 235, R2 = 470;
  const cats = S.categories;
  const weights = cats.map((c) => Math.max(c.items.length, 2.2));
  const total = weights.reduce((a, b) => a + b, 0);
  let ang = -Math.PI / 2 - (Math.PI * 2 * weights[0]) / total / 2;
  byId.me.x = 0; byId.me.y = 0; byId.me.r = 78;
  cats.forEach((c, ci) => {
    const span = (Math.PI * 2 * weights[ci]) / total;
    const mid = ang + span / 2;
    const cn = byId[c.id];
    cn.x = Math.cos(mid) * R1; cn.y = Math.sin(mid) * R1; cn.r = 54; cn.angle = mid;
    const n = c.items.length;
    c.items.forEach((it, i) => {
      const a = ang + span * ((i + 0.5) / n);
      const r = R2 + (n > 4 ? (i % 2 ? 70 : 0) : 0);
      const node = byId[it.id];
      node.x = Math.cos(a) * r; node.y = Math.sin(a) * r; node.r = 30; node.angle = a;
    });
    ang += span;
  });

  /* ── Render ── */
  const web = $("#web"), gEdges = $("#edges"), gNodes = $("#nodes");

  function wrap(label, max = 15) {
    const words = label.split(" ");
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function octagon(r) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      pts.push((Math.cos(a) * r).toFixed(1) + "," + (Math.sin(a) * r).toFixed(1));
    }
    return pts.join(" ");
  }

  edges.forEach((e) => {
    const A = byId[e.a], B = byId[e.b];
    let el;
    if (e.kind === "cross") {
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const cx = mx * 0.55, cy = my * 0.55; // bow toward centre
      el = svgEl("path", { d: `M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`, class: "edge cross" });
    } else {
      el = svgEl("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "edge" });
    }
    e.el = el;
    gEdges.appendChild(el);
  });

  nodes.forEach((n) => {
    const g = svgEl("g", {
      class: "node " + n.type, transform: `translate(${n.x},${n.y})`,
      tabindex: "0", role: "button", "data-id": n.id,
      "aria-label": n.type === "center" ? "About Wisam: whole web" : `Open ${n.label}`
    });
    g.appendChild(svgEl("circle", { r: n.r + 12, class: "halo" }));
    if (n.type === "center") {
      g.appendChild(svgEl("circle", { r: n.r + 8, class: "ring" }));
      g.appendChild(svgEl("circle", { r: n.r, class: "core" }));
      const t1 = svgEl("text", { class: "n1", "text-anchor": "middle", y: -2 }); t1.textContent = "Wisam";
      const t2 = svgEl("text", { class: "n2", "text-anchor": "middle", y: 20 }); t2.textContent = "Abu Al Neel";
      g.append(t1, t2);
    } else if (n.type === "category") {
      const th = THEMES[n.theme];
      g.appendChild(svgEl("polygon", { points: octagon(n.r), class: "tile", fill: th.fill }));
      g.appendChild(svgEl("polygon", { points: octagon(n.r - 9), fill: "none", stroke: th.accent2, "stroke-width": 1.5, opacity: .8 }));
      const lines = wrap(n.label, 11);
      lines.forEach((ln, i) => {
        const t = svgEl("text", { "text-anchor": "middle", y: 5 + (i - (lines.length - 1) / 2) * 16 });
        t.textContent = ln; g.appendChild(t);
      });
    } else {
      const th = THEMES[n.theme];
      g.appendChild(svgEl("circle", { r: n.r, class: "dot", stroke: th.accent }));
      g.appendChild(svgEl("rect", { x: -8, y: -8, width: 16, height: 16, class: "gem", fill: th.tileA, transform: "rotate(45)" }));
      // Label goes on the outer side of the node so it doesn't sit on the lines
      const below = Math.sin(n.angle) > -0.35;
      const lines = wrap(n.label, 15);
      lines.forEach((ln, i) => {
        const y = below ? n.r + 18 + i * 16 : -n.r - 10 - (lines.length - 1 - i) * 16;
        const t = svgEl("text", { class: "lbl", "text-anchor": "middle", y });
        t.textContent = ln; g.appendChild(t);
      });
    }
    g.addEventListener("click", () => go(routeFor(n), "web"));
    g.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(routeFor(n), "web"); }
    });
    g.addEventListener("pointerenter", () => hover(n.id, true));
    g.addEventListener("pointerleave", () => hover(n.id, false));
    n.el = g;
    gNodes.appendChild(g);
  });

  function hover(id, on) {
    edges.forEach((e) => { if (e.a === id || e.b === id) e.el.classList.toggle("hot", on); });
  }

  /* ── Camera: animate the SVG viewBox ── */
  let cam = null; // {x,y,w,h}
  let camAnim = 0;

  function screenRect() {
    const W = web.clientWidth, H = web.clientHeight;
    const mobile = W <= 760;
    const panelOpen = !$("#panel").hidden;
    const top = 64;
    if (mobile) {
      const sheet = panelOpen ? Math.min(H * 0.56, $("#panel").offsetHeight || H * 0.56)
        : ($("#intro").classList.contains("away") ? 0 : $("#intro").offsetHeight + 12);
      return { W, H, x: 8, y: top, w: W - 16, h: Math.max(160, H - top - sheet - 8) };
    }
    const right = panelOpen ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-w")) + 32 : 0;
    const introShown = !panelOpen && !$("#intro").classList.contains("away") && !listMode;
    const left = introShown ? $("#intro").offsetWidth + 16 : 0;
    return { W, H, x: left + 16, y: top, w: W - right - left - 32, h: H - top - 16 };
  }

  function boxFor(ids, pad) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ids.forEach((id) => {
      const n = byId[id];
      const extra = n.type === "item" ? 40 : 0; // room for labels
      x0 = Math.min(x0, n.x - n.r - 60); x1 = Math.max(x1, n.x + n.r + 60);
      y0 = Math.min(y0, n.y - n.r - extra); y1 = Math.max(y1, n.y + n.r + extra + 10);
    });
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
  }

  function camFor(box, maxScale) {
    const R = screenRect();
    let s = Math.min(R.w / box.w, R.h / box.h);
    if (maxScale) s = Math.min(s, maxScale);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const w = R.W / s, h = R.H / s;
    return { x: cx - (R.x + R.w / 2) / s, y: cy - (R.y + R.h / 2) / s, w, h };
  }

  function setCam(c) { cam = c; web.setAttribute("viewBox", `${c.x} ${c.y} ${c.w} ${c.h}`); }

  function flyTo(target) {
    cancelAnimationFrame(camAnim);
    if (!cam || reduceMotion) return setCam(target);
    const from = { ...cam };
    const dur = 1100, t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur), k = ease(t);
      setCam({
        x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k,
        w: from.w + (target.w - from.w) * k, h: from.h + (target.h - from.h) * k
      });
      if (t < 1) camAnim = requestAnimationFrame(step);
    };
    camAnim = requestAnimationFrame(step);
    // Safety net: if frames are throttled (background tab), still land on target.
    clearTimeout(flyTo.t);
    flyTo.t = setTimeout(() => { if (cam.w !== target.w) { cancelAnimationFrame(camAnim); setCam(target); } }, dur + 150);
  }

  /* ── Theme ── */
  function applyTheme(name) {
    const th = THEMES[name] || THEMES.home;
    const root = document.documentElement.style;
    ["bg", "ink", "accent", "accent2", "fill", "tileA", "tileB", "tileC", "line"].forEach((k) => root.setProperty("--" + k, th[k]));
    document.querySelectorAll(".mosaic .layer").forEach((l) => l.classList.toggle("on", l.dataset.pattern === th.pattern));
    document.querySelector('meta[name="theme-color"]').setAttribute("content", th.bg);
  }

  /* ── Routing: #/  #/projects  #/projects/dealio  (deep links work from LinkedIn posts) ── */
  function routeFor(n) {
    if (n.type === "center") return "#/";
    if (n.type === "category") return "#/" + n.id;
    return "#/" + n.cat + "/" + n.id;
  }
  let pendingVia = null;
  function go(hash, via) {
    pendingVia = via;
    if (location.hash === hash) render(); else location.hash = hash;
  }

  let current = null, openedAt = 0;
  function render() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    let state = { type: "home", id: "me" };
    if (parts.length === 1 && byId[parts[0]] && byId[parts[0]].type === "category") state = { type: "category", id: parts[0] };
    if (parts.length >= 2 && byId[parts[1]] && byId[parts[1]].type === "item") state = { type: "item", id: parts[1] };

    const via = pendingVia || (current ? "back" : "link");
    pendingVia = null;

    // Reading-time signal for the node we are leaving
    if (current && current.type !== "home") {
      const secs = Math.round((performance.now() - openedAt) / 1000);
      if (secs >= 5) track("node_read", { id: current.id, seconds: secs >= 60 ? "60+" : secs >= 20 ? "20-59" : "5-19" });
    }
    if (state.type !== "home") {
      const n = byId[state.id];
      track("node_open", { id: n.id, label: n.label, type: n.type, category: n.cat || n.id, via });
    }
    current = state; openedAt = performance.now();

    const n = byId[state.id];
    applyTheme(state.type === "home" ? "home" : n.theme);

    // Focus / dim
    let focus = null;
    if (state.type === "category") focus = new Set(["me", n.id, ...n.data.items.map((i) => i.id)]);
    if (state.type === "item") focus = new Set([n.id, n.cat, ...(related[n.id] || [])]);
    nodes.forEach((m) => {
      m.el.classList.toggle("dim", !!focus && !focus.has(m.id));
      m.el.classList.toggle("active", m.id === state.id && state.type !== "home");
    });
    edges.forEach((e) => {
      const on = !focus || (focus.has(e.a) && focus.has(e.b) && (e.a === state.id || e.b === state.id || state.type === "category"));
      e.el.classList.toggle("dim", !on);
    });

    // Panels
    const intro = $("#intro"), panel = $("#panel");
    if (state.type === "home") {
      panel.hidden = true;
      intro.classList.remove("away");
    } else {
      intro.classList.add("away");
      fillPanel(state, n);
      const wasHidden = panel.hidden;
      panel.hidden = false;
      panel.scrollTop = 0;
      if (wasHidden && !reduceMotion) {
        panel.classList.add("entering");
        requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("entering")));
      }
    }

    if (!listMode) flyTo(cameraFor(state));
    if (listMode && state.type !== "home") panel.focus({ preventScroll: true });
  }

  function cameraFor(state) {
    const n = byId[state.id];
    if (state.type === "home") return camFor(boxFor(nodes.map((m) => m.id), 30));
    if (state.type === "category") return camFor(boxFor(["me", n.id, ...n.data.items.map((i) => i.id)], 30), 1.25);
    // Centre on the item itself; show its neighbourhood but never drift off it.
    const near = [n.cat, ...(related[n.id] || [])].map((id) => Math.hypot(byId[id].x - n.x, byId[id].y - n.y));
    const half = Math.max(230, Math.min(360, Math.min(...near) + 70));
    return camFor({ x: n.x - half, y: n.y - half * 0.75, w: half * 2, h: half * 1.5 }, 1.6);
  }

  function fillPanel(state, n) {
    const back = $("#panelBack");
    const body = $("#panelBody");
    if (state.type === "category") {
      back.textContent = "← Whole web";
      back.onclick = () => go("#/", "panel");
      const c = n.data;
      body.innerHTML = `
        <p class="kicker">Explore</p>
        <h2>${esc(c.label)}</h2>
        <p>${esc(c.summary || "")}</p>
        <ul class="item-list">${c.items.map((it) => `
          <li><button type="button" data-go="${esc(c.id)}/${esc(it.id)}">
            <strong>${esc(it.label)}</strong><span>${esc(it.meta || it.title || "")}</span>
          </button></li>`).join("")}
        </ul>`;
    } else {
      const it = n.data, cat = byId[n.cat];
      back.textContent = "← " + cat.label;
      back.onclick = () => go("#/" + cat.id, "panel");
      const rel = [...(related[n.id] || [])].map((id) => byId[id]);
      body.innerHTML = `
        <p class="kicker">${esc(cat.label)}</p>
        <h2>${esc(it.title || it.label)}</h2>
        ${it.meta ? `<p class="meta">${esc(it.meta)}</p>` : ""}
        ${(it.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${it.bullets ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
        ${it.tags ? `<div class="tags">${it.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        ${rel.length ? `<p class="section-label">Connected to</p><div class="related">${rel.map((r) =>
          `<button class="chip" type="button" data-go="${esc(r.cat)}/${esc(r.id)}">${esc(r.label)}</button>`).join("")}</div>` : ""}
        <button class="chip chip-solid ask-this" type="button" data-ask="${esc(it.label)}">Ask me more about ${esc(it.label)}</button>`;
    }
    body.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => go("#/" + b.dataset.go, state.type === "category" ? "panel" : "related")));
    body.querySelectorAll("[data-ask]").forEach((b) => b.addEventListener("click", () => openAsk(b.dataset.ask, "panel")));
  }

  $("#panelClose").addEventListener("click", () => go("#/", "panel"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#ask").open && current && current.type !== "home") {
      go(current.type === "item" ? "#/" + byId[current.id].cat : "#/", "key");
    }
  });

  /* ── List view (accessible, phone-friendly alternative to the web) ── */
  let listMode = false;
  const list = $("#list");
  list.innerHTML = `<div class="list-inner">
      <p class="kicker">Portfolio</p><h1>${esc(S.person.name)}</h1><p>${esc(S.person.intro)}</p>
      ${S.categories.map((c) => `
        <section><h2>${esc(c.label)}</h2><p class="muted">${esc(c.summary || "")}</p>
        <ul class="item-list">${c.items.map((it) => `
          <li><button type="button" data-go="${esc(c.id)}/${esc(it.id)}">
            <strong>${esc(it.title || it.label)}</strong><span>${esc(it.meta || "")}</span></button></li>`).join("")}
        </ul></section>`).join("")}
    </div>`;
  list.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go("#/" + b.dataset.go, "list")));

  $("#viewToggle").addEventListener("click", (e) => {
    listMode = !listMode;
    e.currentTarget.setAttribute("aria-pressed", String(listMode));
    e.currentTarget.textContent = listMode ? "Web view" : "List view";
    list.hidden = !listMode;
    web.style.visibility = listMode ? "hidden" : "visible";
    $("#intro").style.display = listMode ? "none" : "";
    track("view_toggle", { view: listMode ? "list" : "web" });
    if (!listMode && current) setCam(cameraFor(current));
  });

  /* ── Contact (assembled at runtime to deter scrapers) ── */
  const C = S.person.contact;
  const email = C.emailUser + "@" + C.emailDomain;
  const phone = C.phoneParts.join("");
  const lnk = $("#cLinkedin"), em = $("#cEmail"), ph = $("#cPhone");
  lnk.href = C.linkedin;
  em.href = "mailto:" + email; em.title = email;
  ph.href = "tel:" + phone; ph.title = C.phoneParts.join(" ");
  [[lnk, "linkedin"], [em, "email"], [ph, "phone"]].forEach(([el, m]) =>
    el.addEventListener("click", () => track("contact_click", { method: m, from: current ? current.id : "me" })));

  /* ── Intro card ── */
  $("#introName").textContent = S.person.name;
  $("#introTagline").textContent = S.person.tagline;
  $("#introText").textContent = S.person.intro;
  $("#introLoc").textContent = S.person.location;

  /* ── "Ask me about" ── */
  const ask = $("#ask"), askForm = $("#askForm"), topicsBox = $("#askTopics");
  let askFrom = "header";
  function buildTopics(extra) {
    const list = [...S.askTopics];
    if (extra && !list.includes(extra)) list.unshift(extra);
    topicsBox.querySelectorAll("label").forEach((l) => l.remove());
    list.forEach((t, i) => {
      const l = document.createElement("label");
      l.innerHTML = `<input type="radio" name="topic" value="${esc(t)}" ${extra ? (t === extra ? "checked" : "") : ""}><span>${esc(t)}</span>`;
      topicsBox.appendChild(l);
    });
  }
  function openAsk(topic, from) {
    askFrom = from || "header";
    buildTopics(topic);
    $("#askStatus").textContent = "";
    askForm.reset();
    if (topic) { const r = topicsBox.querySelector(`input[value="${CSS.escape(topic)}"]`); if (r) r.checked = true; }
    track("ask_open", { from: current ? current.id : "me", topic: topic || "none" });
    ask.showModal();
  }
  $("#askOpen").addEventListener("click", () => openAsk(null, "header"));

  askForm.addEventListener("submit", async (e) => {
    if (e.submitter && e.submitter.value === "cancel") return; // close button
    e.preventDefault();
    const fd = new FormData(askForm);
    const topic = fd.get("topic") || "";
    const message = (fd.get("message") || "").trim();
    if (!topic && !message) { $("#askStatus").textContent = "Pick a topic or write a question first."; return; }
    // Only the chosen preset topic goes to analytics, never free text or emails.
    track("ask_submit", { topic: topic || "custom", from: current ? current.id : "me" });
    if (GOOGLE_FORM_PREFILL) {
      const text = (topic ? "I'd like to know more about: " + topic : "") + (topic && message ? "\n\n" : "") + message;
      window.open(GOOGLE_FORM_PREFILL.replace("__TOPIC__", encodeURIComponent(text)), "_blank", "noopener");
      $("#askStatus").textContent = "The form opened in a new tab. Thank you!";
      setTimeout(() => ask.close(), 1800);
    } else {
      const subject = encodeURIComponent("Portfolio question: " + (topic || "custom"));
      const bodyTxt = encodeURIComponent((topic ? "Topic: " + topic + "\n\n" : "") + message);
      location.href = `mailto:${email}?subject=${subject}&body=${bodyTxt}`;
      $("#askStatus").textContent = "Opening your email app…";
    }
  });

  /* ── Landing intro: Wisam in the centre, a short intro, then the web grows around him ── */
  const HOLD_MS = 11000; // auto-continue after this long (the gold bar under the button shows it)
  const splash = $("#splash");
  let revealed = true, splashTimer = 0, splashStart = 0;

  function showSplash() {
    const sp = S.person.splash;
    $("#splashHello").textContent = sp.hello;
    $("#splashLead").textContent = sp.lead;
    $("#splashLines").innerHTML = sp.lines.map((l) => `<p>${esc(l)}</p>`).join("");
    splash.style.setProperty("--hold", HOLD_MS / 1000 + "s");
    splash.hidden = false;
    document.body.classList.add("pre");
    revealed = false;
    splashStart = performance.now();
    splashTimer = setTimeout(() => reveal("auto"), HOLD_MS);
    splash.addEventListener("click", () => reveal("click"));
    document.addEventListener("keydown", onSplashKey);
    window.addEventListener("wheel", onSplashScroll, { passive: true });
    $("#splashGo").focus({ preventScroll: true });
  }
  function onSplashKey(e) { if (!revealed && e.key !== "Tab") reveal("key"); }
  function onSplashScroll() { if (!revealed) reveal("scroll"); }

  function reveal(how) {
    if (revealed) return;
    revealed = true;
    clearTimeout(splashTimer);
    document.removeEventListener("keydown", onSplashKey);
    window.removeEventListener("wheel", onSplashScroll);
    track("intro_end", { how, seconds: Math.round((performance.now() - splashStart) / 1000) });
    try { sessionStorage.setItem("introSeen", "1"); } catch (_) {}

    // Start the camera exactly where the intro circle is, so "Wisam" stays put while the web appears.
    const r = $("#splashMe").getBoundingClientRect();
    const s = r.width / 2 / byId.me.r; // screen px per world unit
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    setCam({ x: -cx / s, y: -cy / s, w: web.clientWidth / s, h: web.clientHeight / s });

    document.body.classList.add("revealing");
    document.body.classList.remove("pre");
    splash.classList.add("out");
    setTimeout(() => flyTo(cameraFor(current)), reduceMotion ? 0 : 700);
    setTimeout(() => { splash.hidden = true; document.body.classList.remove("revealing"); }, 3200);
  }

  /* ── Boot ── */
  applyTheme("home");
  setCam(camFor(boxFor(nodes.map((m) => m.id), 30)));
  window.addEventListener("hashchange", render);
  let rz;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { cancelAnimationFrame(camAnim); if (current && revealed) setCam(cameraFor(current)); }, 150); });

  // Show the intro on a normal first visit; skip it for deep links (e.g. from a LinkedIn post) or a repeat visit this session.
  let introSeen = false;
  try { introSeen = sessionStorage.getItem("introSeen") === "1"; } catch (_) {}
  const deepLink = location.hash.replace(/^#\/?/, "").length > 0;
  render();
  if (!deepLink && !introSeen) showSplash();
})();
