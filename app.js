(() => {
  "use strict";
  const S = window.SITE;

  /* Google Form for "Ask me about". The site swaps __TOPIC__ for what the visitor picked. */
  const GOOGLE_FORM_PREFILL = "https://docs.google.com/forms/d/e/1FAIpQLSeASPTdMRIRpXEJcyyp_XzjNecPE2B9qqKHCBPC7UuufD0sHw/viewform?usp=pp_url&entry.743808413=__TOPIC__";

  /* ── Colour moods on the Midnight-to-Navy palette (#0a031d #070a25 #090c2a #071132 #0a183b).
       Each section has ONE colour that its subtopics share.
       accent = bright colour for text/outlines on dark · fill = deeper colour behind white text. ── */
  const THEMES = {
    home:    { bg: "#070a25", ink: "#EEF1F8", accent: "#E0B84A", accent2: "#8DB4F0", fill: "#1F3B7A", tileA: "#C9A227", tileB: "#2C4B86", tileC: "#090c2a", line: "#3B4C7E", pattern: "star" },
    gold:    { bg: "#0a031d", ink: "#F3EEDF", accent: "#E8C766", accent2: "#8DB4F0", fill: "#8A6A12", tileA: "#C9A227", tileB: "#3A3A7A", tileC: "#0d0828", line: "#4F4772", pattern: "star" },
    emerald: { bg: "#090c2a", ink: "#E6F6EE", accent: "#6FD3A0", accent2: "#E0B84A", fill: "#1D7A4C", tileA: "#2E9A66", tileB: "#C9A227", tileC: "#0c1032", line: "#2F6A55", pattern: "hex" },
    lapis:   { bg: "#071132", ink: "#EAF0FB", accent: "#8DB4F0", accent2: "#E0B84A", fill: "#2A4F9E", tileA: "#3A63B8", tileB: "#C9A227", tileC: "#0a1538", line: "#3A5490", pattern: "hex" },
    coral:   { bg: "#0a031d", ink: "#F8ECE8", accent: "#F5A08A", accent2: "#8DB4F0", fill: "#A3472F", tileA: "#D86A4A", tileB: "#2C4B86", tileC: "#0d0828", line: "#6A4036", pattern: "diamond" },
    violet:  { bg: "#070a25", ink: "#EFEAFB", accent: "#C3A6FF", accent2: "#E0B84A", fill: "#5B3FB0", tileA: "#7A5AD8", tileB: "#E0B84A", tileC: "#0a0d2c", line: "#4E4290", pattern: "star" }
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

  /* ── Per-visitor progress, kept in this browser only (fine if it's missing) ── */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("wa_" + k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem("wa_" + k, JSON.stringify(v)); } catch (_) {} }
  };
  const visited = new Set(store.get("visited", []));

  /* ── Build graph model ── */
  const nodes = [];
  const byId = {};
  const edges = [];
  const add = (n) => { nodes.push(n); byId[n.id] = n; return n; };

  add({ id: "me", type: "center", label: S.person.name, theme: "home" });
  S.categories.forEach((c) => {
    add({ id: c.id, type: "category", label: c.label, theme: c.theme, shape: c.shape, data: c });
    edges.push({ a: "me", b: c.id, kind: "spoke" });
    c.items.forEach((it) => {
      add({ id: it.id, type: "item", label: it.label, theme: c.theme, shape: c.shape, cat: c.id, data: it });
      edges.push({ a: c.id, b: it.id, kind: "spoke" });
    });
  });
  const items = nodes.filter((n) => n.type === "item");
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

  /* ── Layout: every subtopic sits evenly on ONE circle; each section sits at the middle of its group ── */
  const R1 = 265, R2 = 545;
  const N = items.length;
  const first = S.categories[0].items.length;
  byId.me.x = 0; byId.me.y = 0; byId.me.r = 78;
  items.forEach((n, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * (i - (first - 1) / 2)) / N;
    n.angle = a; n.x = Math.cos(a) * R2; n.y = Math.sin(a) * R2; n.r = 31;
  });
  S.categories.forEach((c) => {
    const kids = c.items.map((it) => byId[it.id]);
    const sx = kids.reduce((s, k) => s + Math.cos(k.angle), 0), sy = kids.reduce((s, k) => s + Math.sin(k.angle), 0);
    const a = Math.atan2(sy, sx);
    const cn = byId[c.id];
    cn.angle = a; cn.x = Math.cos(a) * R1; cn.y = Math.sin(a) * R1; cn.r = 56;
  });

  /* ── Shapes: each section has its own; its subtopics share it ── */
  function poly(n, r, rot) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i * 2 * Math.PI) / n;
      pts.push((Math.cos(a) * r).toFixed(1) + "," + (Math.sin(a) * r).toFixed(1));
    }
    return pts.join(" ");
  }
  function makeShape(shape, r, attrs) {
    switch (shape) {
      case "hexagon": return svgEl("polygon", { points: poly(6, r * 1.06, 0), ...attrs });
      case "diamond": return svgEl("polygon", { points: poly(4, r * 1.2, -Math.PI / 2), ...attrs });
      case "square": return svgEl("rect", { x: -r * 0.9, y: -r * 0.9, width: r * 1.8, height: r * 1.8, rx: r * 0.28, ...attrs });
      case "pentagon": return svgEl("polygon", { points: poly(5, r * 1.1, -Math.PI / 2), ...attrs });
      case "octagon": return svgEl("polygon", { points: poly(8, r * 1.02, Math.PI / 8), ...attrs });
      default: return svgEl("circle", { r, ...attrs });
    }
  }

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

  edges.forEach((e) => {
    const A = byId[e.a], B = byId[e.b];
    let el;
    if (e.kind === "cross") {
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      el = svgEl("path", { d: `M${A.x},${A.y} Q${mx * 0.55},${my * 0.55} ${B.x},${B.y}`, class: "edge cross" });
    } else {
      el = svgEl("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "edge" });
      if (B.type === "item") el.style.stroke = THEMES[B.theme].line;
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
    const th = THEMES[n.theme];
    g.appendChild(makeShape(n.shape || "circle", n.r + 12, { class: "halo" }));
    if (n.type === "center") {
      g.appendChild(svgEl("circle", { r: n.r + 8, class: "ring" }));
      g.appendChild(svgEl("circle", { r: n.r, class: "core" }));
      const t1 = svgEl("text", { class: "n1", "text-anchor": "middle", y: -2 }); t1.textContent = "Wisam";
      const t2 = svgEl("text", { class: "n2", "text-anchor": "middle", y: 20 }); t2.textContent = "Abu Al Neel";
      g.append(t1, t2);
    } else if (n.type === "category") {
      g.appendChild(makeShape(n.shape, n.r, { class: "tile", fill: th.fill }));
      g.appendChild(makeShape(n.shape, n.r - 9, { fill: "none", stroke: th.accent, "stroke-width": 1.5, opacity: .7 }));
      const lines = wrap(n.label, 11);
      lines.forEach((ln, i) => {
        const t = svgEl("text", { "text-anchor": "middle", y: 5 + (i - (lines.length - 1) / 2) * 16 });
        t.textContent = ln; g.appendChild(t);
      });
    } else {
      // Arrows come in at an angle so they never cover the tile's label
      n.stuck = svgEl("g", { class: "stuck", transform: `rotate(${(n.angle * 180) / Math.PI + 42})` });
      g.appendChild(n.stuck);
      g.appendChild(makeShape(n.shape, n.r, { class: "dot", stroke: th.accent }));
      g.appendChild(makeShape(n.shape, 9, { class: "gem", fill: th.tileA }));
      const below = Math.sin(n.angle) > -0.35;
      const lines = wrap(n.label, 15);
      lines.forEach((ln, i) => {
        const y = below ? n.r + 20 + i * 16 : -n.r - 12 - (lines.length - 1 - i) * 16;
        const t = svgEl("text", { class: "lbl", "text-anchor": "middle", y });
        t.textContent = ln; g.appendChild(t);
      });
    }
    g.addEventListener("click", (ev) => {
      if (panMoved) return; // that was a drag, not a click
      if (n.type === "item") shootAndOpen(n, ev);
      else go(routeFor(n), "web");
    });
    g.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (n.type === "item") shootAndOpen(n, null); else go(routeFor(n), "web");
      }
    });
    g.addEventListener("pointerenter", () => hover(n.id, true));
    g.addEventListener("pointerleave", () => hover(n.id, false));
    n.el = g;
    gNodes.appendChild(g);
  });

  function hover(id, on) {
    edges.forEach((e) => { if (e.a === id || e.b === id) e.el.classList.toggle("hot", on); });
  }

  /* ── Arrows that stay stuck in the tiles you've opened ── */
  function drawStuckArrow(n, animate) {
    n.stuck.textContent = "";
    const tip = n.r * 0.3, tail = n.r + 50;
    const inner = svgEl("g", { class: "arrow-in" + (animate && !reduceMotion ? " hit" : "") });
    inner.style.transformOrigin = `${tip}px 0px`;
    inner.innerHTML = `
      <path d="M${tail - 12},-1.2 L${tail + 2},-7 L${tail + 6},-7 L${tail - 2},-1.2 Z M${tail - 12},1.2 L${tail + 2},7 L${tail + 6},7 L${tail - 2},1.2 Z" fill="#FFFFFF" stroke="#4A4F57" stroke-width=".8"/>
      <line x1="${tip}" y1="0" x2="${tail + 4}" y2="0" stroke="#5E0B0B" stroke-width="4.2" stroke-linecap="round"/>
      <line x1="${tip}" y1="0" x2="${tail + 4}" y2="0" stroke="#D32F2F" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${tail + 4},-2.6 H${tail + 9} V-.9 Q${tail + 6.6},-.9 ${tail + 6.6},0 Q${tail + 6.6},.9 ${tail + 9},.9 V2.6 H${tail + 4} Z" fill="#23272D"/>`;
    n.stuck.appendChild(inner);
  }
  function refreshMarks() {
    items.forEach((n) => {
      if (visited.has(n.id)) { if (!n.stuck.firstChild) drawStuckArrow(n, false); }
      else n.stuck.textContent = "";
    });
    updateProgress();
  }
  function markExplored(n, animate) {
    visited.add(n.id);
    store.set("visited", [...visited]);
    track("tile_explored", { id: n.id, count: visited.size });
    drawStuckArrow(n, animate);
    updateProgress();
    if (visited.size === N) setTimeout(() => toast("You've explored every tile. Thank you for reading! 🎯"), 900);
  }

  /* The cursor becomes an arrow that flies into the tile, then the tile opens */
  function shootAndOpen(n, ev) {
    const open = () => go(routeFor(n), "web");
    if (visited.has(n.id)) { open(); return; }
    if (!ev || reduceMotion || typeof ev.clientX !== "number") { markExplored(n, true); open(); return; }
    const pt = web.createSVGPoint(); pt.x = n.x; pt.y = n.y;
    const sp = pt.matrixTransform(web.getScreenCTM());
    const dx = sp.x - ev.clientX, dy = sp.y - ev.clientY;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 135; // the cursor art points up-left
    const fly = document.createElement("img");
    fly.src = "cursor-arrow.svg"; fly.alt = ""; fly.className = "flying-arrow";
    document.body.appendChild(fly);
    document.body.classList.add("shooting");
    const anim = fly.animate([
      { transform: `translate(${ev.clientX - 2}px,${ev.clientY - 2}px) rotate(${ang}deg) scale(1.1)` },
      { transform: `translate(${ev.clientX - 2 + dx * 0.15}px,${ev.clientY - 2 + dy * 0.15 - 10}px) rotate(${ang}deg) scale(1.5)`, offset: 0.3 },
      { transform: `translate(${sp.x - 2}px,${sp.y - 2}px) rotate(${ang}deg) scale(1)` }
    ], { duration: 420, easing: "cubic-bezier(.5,0,.75,1)" });
    const finish = () => { fly.remove(); document.body.classList.remove("shooting"); markExplored(n, true); open(); };
    anim.onfinish = finish;
    setTimeout(() => { if (fly.isConnected) finish(); }, 700);
  }

  /* ── Progress pill ── */
  const pill = document.createElement("button");
  pill.type = "button"; pill.id = "progress"; pill.className = "chip progress";
  document.querySelector(".topbar").insertBefore(pill, document.querySelector(".actions"));
  pill.addEventListener("click", () => go("#/", "pill"));
  function updateProgress() {
    const v = visited.size;
    pill.innerHTML = v >= N ? `🎯 <b>All ${N}</b> <span class="long">explored</span>` : `🎯 <b>${v}/${N}</b> <span class="long">explored</span>`;
    pill.title = "Tiles you've opened (an arrow marks each one)";
  }

  /* ── Toast ── */
  const toastEl = document.createElement("div");
  toastEl.id = "toast"; toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 4200);
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
      const extra = n.type === "item" ? 44 : 0;
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
    return { x: cx - (R.x + R.w / 2) / s, y: cy - (R.y + R.h / 2) / s, w: R.W / s, h: R.H / s };
  }

  function setCam(c) { cam = c; web.setAttribute("viewBox", `${c.x} ${c.y} ${c.w} ${c.h}`); }

  function stopFlight() { cancelAnimationFrame(camAnim); clearTimeout(flyTo.t); }
  function flyTo(target) {
    stopFlight();
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
    flyTo.t = setTimeout(() => { if (cam.w !== target.w) { cancelAnimationFrame(camAnim); setCam(target); } }, dur + 150);
  }

  /* ── Zoom and pan: mouse wheel, drag, pinch, and the +/− buttons ── */
  let panMoved = false;
  const ptrs = new Map();
  let gesture = null;
  const MIN_W = 220, MAX_W = 7000;
  function zoomAt(factor, sx, sy) {
    if (!cam) return;
    stopFlight();
    const W = web.clientWidth, H = web.clientHeight;
    const wx = cam.x + (sx / W) * cam.w, wy = cam.y + (sy / H) * cam.h;
    const nw = Math.max(MIN_W, Math.min(MAX_W, cam.w / factor));
    const nh = cam.h * (nw / cam.w);
    setCam({ x: wx - (sx / W) * nw, y: wy - (sy / H) * nh, w: nw, h: nh });
  }
  const local = (e) => { const r = web.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  web.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = local(e);
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), p.x, p.y);
  }, { passive: false });
  web.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    ptrs.set(e.pointerId, local(e));
    panMoved = false;
    if (ptrs.size === 1) gesture = { kind: "pan", start: local(e), cam: { ...cam } };
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      gesture = { kind: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, cam: { ...cam } };
    }
  });
  window.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId) || !gesture) return;
    ptrs.set(e.pointerId, local(e));
    const W = web.clientWidth, H = web.clientHeight;
    if (gesture.kind === "pan" && ptrs.size === 1) {
      const p = local(e);
      const dx = p.x - gesture.start.x, dy = p.y - gesture.start.y;
      if (!panMoved && Math.hypot(dx, dy) < 7) return;
      panMoved = true; stopFlight(); web.classList.add("grabbing");
      setCam({ ...gesture.cam, x: gesture.cam.x - (dx / W) * gesture.cam.w, y: gesture.cam.y - (dy / H) * gesture.cam.h });
    } else if (gesture.kind === "pinch" && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      panMoved = true; stopFlight();
      const c0 = gesture.cam;
      const nw = Math.max(MIN_W, Math.min(MAX_W, (c0.w * gesture.d) / Math.max(d, 1)));
      const nh = c0.h * (nw / c0.w);
      const wx = c0.x + (gesture.mid.x / W) * c0.w, wy = c0.y + (gesture.mid.y / H) * c0.h;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      setCam({ x: wx - (mid.x / W) * nw, y: wy - (mid.y / H) * nh, w: nw, h: nh });
    }
  });
  const endPtr = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    web.classList.remove("grabbing");
    if (ptrs.size === 1) { const p = [...ptrs.values()][0]; gesture = { kind: "pan", start: p, cam: { ...cam } }; }
    else if (ptrs.size === 0) { gesture = null; setTimeout(() => { panMoved = false; }, 0); }
  };
  window.addEventListener("pointerup", endPtr);
  window.addEventListener("pointercancel", endPtr);

  const zoomBox = document.createElement("div");
  zoomBox.className = "zoom-ctl";
  zoomBox.innerHTML = `<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="fit" aria-label="Show the whole web">⤢</button>`;
  document.body.appendChild(zoomBox);
  zoomBox.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const R = screenRect();
    if (b.dataset.z === "fit") go("#/", "zoom");
    else zoomAt(b.dataset.z === "in" ? 1.35 : 1 / 1.35, R.x + R.w / 2, R.y + R.h / 2);
    track("zoom", { how: b.dataset.z });
  });

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

    if (current && current.type !== "home") {
      const secs = Math.round((performance.now() - openedAt) / 1000);
      if (secs >= 5) track("node_read", { id: current.id, seconds: secs >= 60 ? "60+" : secs >= 20 ? "20-59" : "5-19" });
    }
    if (state.type !== "home") {
      const n = byId[state.id];
      track("node_open", { id: n.id, label: n.label, type: n.type, category: n.cat || n.id, via });
      // Opening a subtopic any other way (list, related chip, deep link) still counts as explored
      if (n.type === "item" && !visited.has(n.id)) markExplored(n, true);
    }
    current = state; openedAt = performance.now();

    const n = byId[state.id];
    applyTheme(state.type === "home" ? "home" : n.theme);

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
    document.body.classList.toggle("panel-open", state.type !== "home");

    if (!listMode) flyTo(cameraFor(state));
    if (listMode && state.type !== "home") panel.focus({ preventScroll: true });
  }

  function cameraFor(state) {
    const n = byId[state.id];
    if (state.type === "home") {
      return camFor(boxFor(nodes.map((m) => m.id), 30));
    }
    if (state.type === "category") return camFor(boxFor(["me", n.id, ...n.data.items.map((i) => i.id)], 30), 1.25);
    const near = [n.cat, ...(related[n.id] || [])].map((id) => Math.hypot(byId[id].x - n.x, byId[id].y - n.y));
    const half = Math.max(230, Math.min(360, Math.min(...near) + 70));
    return camFor({ x: n.x - half, y: n.y - half * 0.75, w: half * 2, h: half * 1.5 }, 1.6);
  }

  function photoFor(id) {
    const p = S.photos && S.photos[id];
    if (!p) return "";
    const ref = "?utm_source=wizahm_portfolio&utm_medium=referral";
    return `<figure class="photo">
        <img src="https://images.unsplash.com/${esc(p.src)}?auto=format&fit=crop&w=840&h=420&q=70" alt="${esc(p.alt || "")}" loading="lazy" width="840" height="420">
        <figcaption>Photo: <a href="https://unsplash.com/@${esc(p.user)}${ref}" target="_blank" rel="noopener">@${esc(p.user)}</a> on <a href="https://unsplash.com/photos/${esc(p.page)}${ref}" target="_blank" rel="noopener">Unsplash</a></figcaption>
      </figure>`;
  }

  function fillPanel(state, n) {
    const back = $("#panelBack");
    const body = $("#panelBody");
    const th = THEMES[n.theme];
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
            <strong>${visited.has(it.id) ? "🏹 " : ""}${esc(it.label)}</strong><span>${esc(it.meta || it.title || "")}</span>
          </button></li>`).join("")}
        </ul>`;
    } else {
      const it = n.data, cat = byId[n.cat];
      back.textContent = "← " + cat.label;
      back.onclick = () => go("#/" + cat.id, "panel");
      const rel = [...(related[n.id] || [])].map((id) => byId[id]);
      body.innerHTML = `
        ${photoFor(n.id)}
        <p class="kicker">${esc(cat.label)}</p>
        <h2>${esc(it.title || it.label)}</h2>
        ${it.meta ? `<p class="meta">${esc(it.meta)}</p>` : ""}
        ${(it.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${it.bullets ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
        ${it.tags ? `<div class="tags">${it.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        ${rel.length ? `<p class="section-label">Connected to</p><div class="related">${rel.map((r) =>
          `<button class="chip" type="button" data-go="${esc(r.cat)}/${esc(r.id)}" style="--chip:${THEMES[r.theme].accent}">${esc(r.label)}</button>`).join("")}</div>` : ""}
        <button class="chip chip-solid ask-this" type="button" data-ask="${esc(it.label)}">Ask me more about ${esc(it.label)}</button>`;
    }
    body.style.setProperty("--sec", th.accent);
    body.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => go("#/" + b.dataset.go, state.type === "category" ? "panel" : "related")));
    body.querySelectorAll("[data-ask]").forEach((b) => b.addEventListener("click", () => openAsk(b.dataset.ask, "panel")));
  }

  $("#panelClose").addEventListener("click", () => go("#/", "panel"));
  document.addEventListener("keydown", (e) => {
    if (factCard && !factCard.hidden) return;
    if (e.key === "Escape" && !$("#ask").open && current && current.type !== "home") {
      go(current.type === "item" ? "#/" + byId[current.id].cat : "#/", "key");
    }
  });

  /* ── List view ── */
  let listMode = false;
  const list = $("#list");
  list.innerHTML = `<div class="list-inner">
      <p class="kicker">Portfolio</p><h1>${esc(S.person.name)}</h1><p>${esc(S.person.intro)}</p>
      ${S.categories.map((c) => `
        <section style="--sec:${THEMES[c.theme].accent}"><h2>${esc(c.label)}</h2><p class="muted">${esc(c.summary || "")}</p>
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
    document.body.classList.toggle("list-mode", listMode);
    track("view_toggle", { view: listMode ? "list" : "web" });
    if (!listMode && current) setCam(cameraFor(current));
  });

  /* ── Contact (assembled at runtime to deter scrapers) ── */
  const C = S.person.contact;
  const email = C.emailUser + "@" + C.emailDomain;
  const phone = C.phoneParts.join("");
  const lnk = $("#cLinkedin"), em = $("#cEmail"), ph = $("#cPhone");
  lnk.href = C.linkedin;
  ph.href = "tel:" + phone; ph.title = C.phoneParts.join(" ");
  [[lnk, "linkedin"], [ph, "phone"]].forEach(([el, m]) =>
    el.addEventListener("click", () => track("contact_click", { method: m, from: current ? current.id : "me" })));

  /* Email menu: a plain mailto link does nothing for people without a desktop email app,
     so offer Gmail and Outlook on the web as well, plus copy-to-clipboard. */
  const subj = encodeURIComponent("Hello from your portfolio");
  const emailMenu = document.createElement("div");
  emailMenu.className = "menu card";
  emailMenu.id = "emailMenu";
  emailMenu.hidden = true;
  emailMenu.setAttribute("role", "menu");
  emailMenu.innerHTML = `
    <p class="menu-addr">${esc(email)}</p>
    <a role="menuitem" data-m="gmail" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subj}">Write in Gmail</a>
    <a role="menuitem" data-m="outlook" target="_blank" rel="noopener" href="https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${subj}">Write in Outlook</a>
    <a role="menuitem" data-m="mailapp" href="mailto:${email}?subject=${subj}">Open my email app</a>
    <button role="menuitem" type="button" data-m="copy">Copy address</button>`;
  document.querySelector(".topbar").appendChild(emailMenu);
  em.href = "mailto:" + email; em.title = email;
  em.setAttribute("aria-haspopup", "menu");
  em.setAttribute("aria-expanded", "false");
  const toggleEmailMenu = (open) => {
    emailMenu.hidden = !open;
    em.setAttribute("aria-expanded", String(open));
    if (open) emailMenu.querySelector("a").focus({ preventScroll: true });
  };
  em.addEventListener("click", (e) => {
    e.preventDefault();
    toggleEmailMenu(emailMenu.hidden);
    if (!emailMenu.hidden) track("contact_click", { method: "email", from: current ? current.id : "me" });
  });
  emailMenu.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-m]");
    if (!item) return;
    track("email_choice", { via: item.dataset.m });
    if (item.dataset.m === "copy") {
      try { await navigator.clipboard.writeText(email); item.textContent = "Copied ✓"; }
      catch (_) { item.textContent = email; }
      setTimeout(() => { item.textContent = "Copy address"; toggleEmailMenu(false); }, 1400);
      return;
    }
    setTimeout(() => toggleEmailMenu(false), 150);
  });
  document.addEventListener("click", (e) => {
    if (!emailMenu.hidden && !emailMenu.contains(e.target) && !em.contains(e.target)) toggleEmailMenu(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !emailMenu.hidden) { toggleEmailMenu(false); em.focus(); } });

  /* ── Intro card ── */
  $("#introName").textContent = S.person.name;
  $("#introTagline").textContent = S.person.tagline;
  $("#introText").textContent = S.person.intro;
  $("#introLoc").textContent = S.person.location;

  /* ── "Ask me about" ── */
  const ask = $("#ask"), askForm = $("#askForm"), topicsBox = $("#askTopics");
  function buildTopics(extra) {
    const list = [...S.askTopics];
    if (extra && !list.includes(extra)) list.unshift(extra);
    topicsBox.querySelectorAll("label").forEach((l) => l.remove());
    list.forEach((t) => {
      const l = document.createElement("label");
      l.innerHTML = `<input type="radio" name="topic" value="${esc(t)}" ${extra && t === extra ? "checked" : ""}><span>${esc(t)}</span>`;
      topicsBox.appendChild(l);
    });
  }
  function openAsk(topic) {
    buildTopics(topic);
    $("#askStatus").textContent = "";
    askForm.reset();
    if (topic) { const r = topicsBox.querySelector(`input[value="${CSS.escape(topic)}"]`); if (r) r.checked = true; }
    track("ask_open", { from: current ? current.id : "me", topic: topic || "none" });
    ask.showModal();
  }
  $("#askOpen").addEventListener("click", () => openAsk(null));

  askForm.addEventListener("submit", async (e) => {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault();
    const fd = new FormData(askForm);
    const topic = fd.get("topic") || "";
    const message = (fd.get("message") || "").trim();
    if (!topic && !message) { $("#askStatus").textContent = "Pick a topic or write a question first."; return; }
    track("ask_submit", { topic: topic || "custom", from: current ? current.id : "me" });
    const text = (topic ? "I'd like to know more about: " + topic : "") + (topic && message ? "\n\n" : "") + message;
    window.open(GOOGLE_FORM_PREFILL.replace("__TOPIC__", encodeURIComponent(text)), "_blank", "noopener");
    $("#askStatus").textContent = "The form opened in a new tab. Thank you!";
    setTimeout(() => ask.close(), 1800);
  });

  /* ── Landing intro: stays until the visitor clicks or taps ── */
  const splash = $("#splash");
  let revealed = true, splashStart = 0;

  function showSplash() {
    const sp = S.person.splash;
    $("#splashHello").textContent = sp.hello;
    $("#splashLead").textContent = sp.lead;
    $("#splashLines").innerHTML = sp.lines.map((l) => `<p>${esc(l)}</p>`).join("");
    const touch = matchMedia("(hover: none)").matches;
    $("#splashSkip").textContent = touch ? "Tap anywhere to explore" : "Click anywhere to explore";
    splash.hidden = false;
    document.body.classList.add("pre");
    revealed = false;
    splashStart = performance.now();
    splash.addEventListener("click", () => reveal("click"));
    $("#splashGo").focus({ preventScroll: true });
  }

  function reveal(how) {
    if (revealed) return;
    revealed = true;
    track("intro_end", { how, seconds: Math.round((performance.now() - splashStart) / 1000) });
    try { sessionStorage.setItem("introSeen", "1"); } catch (_) {}
    const r = $("#splashMe").getBoundingClientRect();
    const s = r.width / 2 / byId.me.r;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    setCam({ x: -cx / s, y: -cy / s, w: web.clientWidth / s, h: web.clientHeight / s });
    document.body.classList.add("revealing");
    document.body.classList.remove("pre");
    splash.classList.add("out");
    setTimeout(() => flyTo(cameraFor(current)), reduceMotion ? 0 : 700);
    setTimeout(() => { splash.hidden = true; document.body.classList.remove("revealing"); }, 3200);
  }

  /* ── Fun facts: sparkling stars fixed in the web ──
       A new star appears after every 2 minutes of active reading (5 in total) with a jingle.
       While a star waits to be clicked, a soft reminder jingle plays at most every 15 seconds
       (and stops after a few). Arrows at the screen edge point to stars that are out of view. */
  const FACTS = S.funFacts || [];
  const FIRST_AFTER = 20;       // seconds of reading before the first star
  const REVEAL_EVERY = 120;     // seconds of active reading between the later stars
  const REMIND_EVERY = 15000;   // ms between reminder jingles
  const MAX_REMINDERS = 4;      // per star, so it never nags forever
  const IDLE_AFTER = 90000;     // ms without any activity = not reading
  let factsShown = Math.min(store.get("factsShown", 0), FACTS.length);
  const factsSeen = new Set(store.get("factsSeen", []));
  let activeSecs = 0, lastActivity = Date.now(), lastJingle = 0, reminders = 0;
  let muted = store.get("muted", false);
  const factEls = [];
  let factCard = null, arrowsBox = null;

  // Stars sit in the gaps between the five sections, between the inner and outer rings
  function factPositions() {
    const angs = S.categories.map((c) => byId[c.id].angle).sort((a, b) => a - b);
    return FACTS.map((_, i) => {
      const a = angs[i % angs.length], b = angs[(i + 1) % angs.length] + (i + 1 >= angs.length ? Math.PI * 2 : 0);
      const m = (a + b) / 2, r = 408;
      return { x: Math.cos(m) * r, y: Math.sin(m) * r };
    });
  }

  /* Sound: a short sparkly arpeggio made in the browser (no audio files to load) */
  let audio = null;
  function audioCtx() {
    if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { audio = null; } }
    if (audio && audio.state === "suspended") audio.resume().catch(() => {});
    return audio;
  }
  ["pointerdown", "keydown"].forEach((t) => window.addEventListener(t, () => { audioCtx(); }, { once: true, capture: true }));
  function jingle(soft) {
    if (muted) return;
    const ac = audioCtx(); if (!ac || ac.state !== "running") return;
    lastJingle = Date.now();
    const notes = soft ? [1318.5, 1975.5] : [1318.5, 1661.2, 1975.5, 2637];
    const vol = soft ? 0.035 : 0.06;
    notes.forEach((f, i) => {
      const t = ac.currentTime + i * 0.085;
      [["sine", 1], ["triangle", 0.35]].forEach(([type, k]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f * (type === "triangle" ? 2 : 1);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol * k, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(g).connect(ac.destination);
        o.start(t); o.stop(t + 0.6);
      });
    });
  }

  /* Mute toggle in the top bar */
  const muteBtn = document.createElement("button");
  muteBtn.type = "button"; muteBtn.className = "icon-btn"; muteBtn.id = "muteBtn";
  function paintMute() {
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.setAttribute("aria-label", muted ? "Turn fun-fact sounds on" : "Mute fun-fact sounds");
    muteBtn.title = muted ? "Sounds off" : "Sounds on";
    muteBtn.innerHTML = muted
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zm12.3.3 1.4-1.4L20 10.2l2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zm12.5-.9a5 5 0 0 1 0 7.8l-1.4-1.4a3 3 0 0 0 0-5zm2.8-2.8a9 9 0 0 1 0 13.4l-1.4-1.4a7 7 0 0 0 0-10.6z"/></svg>';
  }
  muteBtn.addEventListener("click", () => {
    muted = !muted; store.set("muted", muted); paintMute();
    track("sound_toggle", { muted });
    if (!muted) jingle(true);
  });
  paintMute();
  document.querySelector(".actions").insertBefore(muteBtn, document.querySelector("#askOpen"));

  function initFacts() {
    if (!FACTS.length) return;
    const layer = svgEl("g", { id: "facts" });
    $("#nodes").appendChild(layer);
    factPositions().forEach((p, i) => {
      const g = svgEl("g", { class: "fact-star", transform: `translate(${p.x},${p.y})`, tabindex: "0", role: "button", "aria-label": `Fun fact ${i + 1}: ${FACTS[i].title}` });
      g.innerHTML = `
        <circle class="fs-glow" r="26"/>
        <g class="fs-body"><path class="fs-main" d="M0,-20 C2,-5 5,-2 20,0 C5,2 2,5 0,20 C-2,5 -5,2 -20,0 C-5,-2 -2,-5 0,-20 Z"/></g>
        <path class="fs-mini m1" d="M0,-6 C.6,-1.5 1.5,-.6 6,0 C1.5,.6 .6,1.5 0,6 C-.6,1.5 -1.5,.6 -6,0 C-1.5,-.6 -.6,-1.5 0,-6 Z" transform="translate(19,-17)"/>
        <path class="fs-mini m2" d="M0,-6 C.6,-1.5 1.5,-.6 6,0 C1.5,.6 .6,1.5 0,6 C-.6,1.5 -1.5,.6 -6,0 C-1.5,-.6 -.6,-1.5 0,-6 Z" transform="translate(-18,15) scale(.8)"/>`;
      g.style.display = i < factsShown ? "" : "none";
      g.classList.toggle("seen", factsSeen.has(i));
      g.addEventListener("click", () => { if (!panMoved) openFact(i); });
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFact(i); } });
      layer.appendChild(g);
      factEls.push({ el: g, x: p.x, y: p.y });
    });

    factCard = document.createElement("div");
    factCard.id = "factCard"; factCard.className = "card fact-card"; factCard.hidden = true;
    factCard.setAttribute("role", "dialog"); factCard.setAttribute("aria-modal", "false");
    document.body.appendChild(factCard);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !factCard.hidden) closeFact(); });
    document.addEventListener("pointerdown", (e) => {
      if (!factCard.hidden && !factCard.contains(e.target) && !e.target.closest(".fact-star, .fact-arrow")) closeFact();
    });

    arrowsBox = document.createElement("div");
    arrowsBox.id = "factArrows";
    document.body.appendChild(arrowsBox);

    ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart"].forEach((t) =>
      window.addEventListener(t, () => { lastActivity = Date.now(); }, { passive: true, capture: true }));
    setInterval(factTick, 1000);
    requestAnimationFrame(placeArrows);
  }

  function factTick() {
    const reading = !document.hidden && revealed && Date.now() - lastActivity < IDLE_AFTER;
    if (!reading) return;
    if (factsShown < FACTS.length && ++activeSecs >= (factsShown === 0 ? FIRST_AFTER : REVEAL_EVERY)) {
      activeSecs = 0;
      showStar(factsShown);
    }
    const waiting = factEls.some((f, i) => i < factsShown && !factsSeen.has(i));
    if (waiting && reminders < MAX_REMINDERS && Date.now() - lastJingle >= REMIND_EVERY) { reminders++; jingle(true); }
  }

  function showStar(i) {
    factsShown = i + 1; store.set("factsShown", factsShown);
    reminders = 0;
    const f = factEls[i];
    f.el.style.display = "";
    f.el.classList.remove("pop"); void f.el.getBBox(); f.el.classList.add("pop");
    jingle(false);
    track("funfact_appear", { n: i + 1 });
  }

  function openFact(i) {
    const fact = FACTS[i];
    factsSeen.add(i); store.set("factsSeen", [...factsSeen]);
    factEls[i].el.classList.add("seen");
    const next = factsShown < FACTS.length ? "Another star will appear as you keep reading." : factsSeen.size === FACTS.length ? "You've found all five. Thanks for getting to know me!" : "";
    factCard.innerHTML = `
      <button type="button" class="close" aria-label="Close">×</button>
      <p class="kicker">✨ Fun fact ${i + 1} of ${FACTS.length}</p>
      <h2>${esc(fact.title)}</h2>
      <p>${esc(fact.text)}</p>
      ${next ? `<p class="muted small">${next}</p>` : ""}`;
    factCard.querySelector(".close").addEventListener("click", closeFact);
    factCard.hidden = false;
    factCard.classList.remove("in"); void factCard.offsetWidth; factCard.classList.add("in");
    factCard.querySelector(".close").focus({ preventScroll: true });
    track("funfact_open", { n: i + 1, title: fact.title });
  }
  function closeFact() { if (factCard) factCard.hidden = true; }

  /* Edge arrows: point towards stars that are waiting but out of view */
  function placeArrows() {
    requestAnimationFrame(placeArrows);
    if (!arrowsBox) return;
    const wanted = [];
    if (revealed && !listMode && cam) {
      const R = screenRect(), ctm = web.getScreenCTM(), box = web.getBoundingClientRect();
      factEls.forEach((f, i) => {
        if (i >= factsShown || factsSeen.has(i) || !ctm) return;
        const pt = web.createSVGPoint(); pt.x = f.x; pt.y = f.y;
        const s = pt.matrixTransform(ctm);
        const x0 = box.left + R.x, y0 = box.top + R.y, x1 = x0 + R.w, y1 = y0 + R.h;
        if (s.x >= x0 + 10 && s.x <= x1 - 10 && s.y >= y0 + 10 && s.y <= y1 - 10) return; // already visible
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, dx = s.x - cx, dy = s.y - cy;
        const m = 26;
        const k = Math.min(Math.abs((x1 - x0) / 2 - m) / Math.max(Math.abs(dx), 1e-6), Math.abs((y1 - y0) / 2 - m) / Math.max(Math.abs(dy), 1e-6));
        wanted.push({ i, x: cx + dx * k, y: cy + dy * k, a: (Math.atan2(dy, dx) * 180) / Math.PI });
      });
      // keep markers from piling on top of each other
      for (let a = 0; a < wanted.length; a++) for (let b = a + 1; b < wanted.length; b++) {
        const A = wanted[a], B = wanted[b];
        if (Math.hypot(A.x - B.x, A.y - B.y) < 46) {
          const vertEdge = Math.abs(A.x - B.x) < Math.abs(A.y - B.y) || Math.abs(A.x - B.x) < 4;
          if (vertEdge) B.y = A.y + (B.y >= A.y ? 46 : -46); else B.x = A.x + (B.x >= A.x ? 46 : -46);
        }
      }
    }
    // reuse elements
    while (arrowsBox.children.length < wanted.length) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "fact-arrow";
      b.innerHTML = '<span class="fa-star">✦</span><span class="fa-tip"></span>';
      b.addEventListener("click", () => {
        const i = +b.dataset.i;
        track("funfact_arrow", { n: i + 1 });
        if (current && current.type !== "home") go("#/", "fact-arrow");
        else flyTo(cameraFor({ type: "home", id: "me" }));
        factEls[i].el.classList.remove("pop"); void factEls[i].el.getBBox(); factEls[i].el.classList.add("pop");
      });
      arrowsBox.appendChild(b);
    }
    [...arrowsBox.children].forEach((b, j) => {
      const w = wanted[j];
      b.hidden = !w;
      if (!w) return;
      b.dataset.i = w.i;
      b.setAttribute("aria-label", "A fun fact is waiting this way");
      b.style.transform = `translate(${w.x - 20}px, ${w.y - 20}px)`;
      b.querySelector(".fa-tip").style.transform = `rotate(${w.a}deg)`;
    });
  }

  /* ── Boot ── */
  applyTheme("home");
  refreshMarks();
  initFacts();
  setCam(camFor(boxFor(nodes.map((m) => m.id), 30)));
  window.addEventListener("hashchange", render);
  let rz;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { stopFlight(); if (current && revealed) setCam(cameraFor(current)); }, 150); });

  let introSeen = false;
  try { introSeen = sessionStorage.getItem("introSeen") === "1"; } catch (_) {}
  const deepLink = location.hash.replace(/^#\/?/, "").length > 0;
  render();
  if (!deepLink && !introSeen) showSplash();

  // Small hook so the browser console (and tests) can reset a visitor's progress
  window.Portfolio = {
    reset() { store.set("visited", []); store.set("factsShown", 0); store.set("factsSeen", []); location.reload(); },
    showNextFact() { if (factsShown < FACTS.length) showStar(factsShown); } // for testing without waiting 2 minutes
  };
})();
