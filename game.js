/*
  Archery challenge: one question per subtopic, three targets (A, B, C), one stickman archer.
  Aim with the mouse (or drag on a phone). The further the scope is from the archer, the
  more power the shot has. Hit the target with the right answer.
  Exposes window.ArcheryGame.start({ questions, onEnd(result), onExit(result), track }).
*/
(() => {
  "use strict";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TIERS = [
    { name: "Recruit", gear: "Plain clothes and a simple wooden bow" },
    { name: "Archer", gear: "Forest-green tunic and a recurve bow" },
    { name: "Marksman", gear: "Leather armour, hood and a composite bow" },
    { name: "Legend", gear: "Golden armour, cape, helmet and the golden bow" }
  ];
  const tierFor = (correct, total, finished) =>
    finished && correct === total ? 3 : correct >= Math.ceil(total * 0.66) ? 2 : correct >= Math.ceil(total * 0.32) ? 1 : 0;

  let root, cv, ctx, opts, G = null, raf = 0, dpr = 1;
  const $ = (s) => root.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function buildDom() {
    root = document.createElement("div");
    root.id = "game";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Archery challenge");
    root.innerHTML = `
      <canvas id="gameCanvas" aria-hidden="true"></canvas>
      <div class="g-top">
        <button type="button" class="chip g-quit">← Back to the web</button>
        <div class="g-stats">
          <div><span>Score</span><b id="gScore">0</b></div>
          <div><span>Streak</span><b id="gMult">×1</b></div>
          <div><span>Question</span><b id="gQn">1/25</b></div>
        </div>
      </div>
      <div class="g-card card" id="gCard">
        <p class="g-kicker" id="gKicker"></p>
        <h2 id="gQ"></h2>
        <ol class="g-answers" id="gAnswers"></ol>
      </div>
      <p class="g-hint" id="gHint"></p>
      <div class="g-msg" id="gMsg" aria-live="polite"></div>
      <div class="g-bubble" id="gBubble" hidden></div>
      <div class="g-end card" id="gEnd" hidden></div>`;
    document.body.appendChild(root);
    cv = $("#gameCanvas");
    ctx = cv.getContext("2d");
    $(".g-quit").addEventListener("click", () => exit());
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointerleave", () => { if (G) G.hover = false; });
    window.addEventListener("resize", () => { if (G) layout(); });
    document.addEventListener("keydown", onKey);
  }

  /* ── Lifecycle ── */
  function start(o) {
    if (!root) buildDom();
    opts = o;
    const qs = o.questions.map((q) => ({ ...q, order: shuffle([0, 1, 2]) }));
    G = {
      qs, i: 0, score: 0, streak: 0, best: 0, correct: 0, correctIds: [], phase: "aim",
      aim: { x: 0, y: 0 }, hover: false, arrow: null, stuck: [], particles: [], floaters: [],
      tier: 0, heights: shuffle([0, 1, 2]), flash: null, bowT: 0, bowing: false, t: 0, misses: 0,
      touchAiming: false
    };
    root.hidden = false;
    $("#gEnd").hidden = true; $("#gBubble").hidden = true;
    document.body.classList.add("game-open");
    layout();
    G.aim = { x: G.W * 0.6, y: G.groundY - G.H * 0.3 };
    showQuestion();
    opts.track("game_start", { questions: qs.length });
    cancelAnimationFrame(raf);
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.25, (now - last) / 1000); last = now; // real time, so slow devices still play at full speed
      if (G) { update(dt); draw(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function hide() {
    cancelAnimationFrame(raf);
    if (root) root.hidden = true;
    document.body.classList.remove("game-open");
    G = null;
  }
  function exit() {
    const finished = G && G.phase === "end";
    const result = finished ? G.result : null;
    if (!finished && G) opts.track("game_quit", { at: G.i + 1, score: G.score });
    opts.onExit(result);
  }
  const isOpen = () => !!(root && !root.hidden);

  /* ── Layout (recomputed on resize) ── */
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = root.clientWidth, H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.W = W; G.H = H;
    G.portrait = H > W;
    G.groundY = H * (G.portrait ? 0.9 : 0.88);
    G.h = Math.max(72, Math.min(170, Math.min(H * 0.24, W * 0.2)));
    G.fx = Math.max(G.h * 0.8 + 14, W * (G.portrait ? 0.12 : 0.1));
    const cardBottom = (($("#gCard").getBoundingClientRect().bottom) || H * 0.3) - root.getBoundingClientRect().top;
    G.top = Math.min(G.groundY - G.h * 1.4, cardBottom + 50);
    G.R = Math.max(26, Math.min(56, Math.min(W, H) * 0.055));
    placeTargets();
  }
  function placeTargets() {
    if (!G) return;
    const xs = G.portrait ? [0.47, 0.67, 0.87] : [0.5, 0.69, 0.87];
    const span = Math.max(G.R * 2.2, G.groundY - G.top - G.R * 2);
    const levels = [0.12, 0.45, 0.8].map((f) => G.groundY - G.R * 1.6 - f * (span - G.R));
    G.targets = xs.map((fx, k) => ({ x: fx * G.W, y: Math.max(G.top + G.R, levels[G.heights[k]]), r: G.R, letter: "ABC"[k], k }));
  }

  /* ── Questions ── */
  function showQuestion() {
    const q = G.qs[G.i];
    G.heights = shuffle([0, 1, 2]);
    $("#gKicker").innerHTML = `<span style="color:${esc(q.color)}">●</span> ${esc(q.section)} · ${esc(q.label)}`;
    $("#gQ").textContent = q.q;
    $("#gAnswers").innerHTML = q.order.map((a, k) => `<li data-k="${k}"><b>${"ABC"[k]}</b><span>${esc(q.answers[a])}</span></li>`).join("");
    $("#gAnswers").querySelectorAll("li").forEach((li) => li.addEventListener("click", () => autoShoot(+li.dataset.k)));
    $("#gQn").textContent = `${G.i + 1}/${G.qs.length}`;
    $("#gHint").textContent = matchMedia("(hover: none)").matches
      ? "Drag to aim · further from the archer = more power · let go to shoot"
      : "Move to aim · further from the archer = more power · click to shoot · or press A, B or C";
    G.stuck = []; G.flash = null; G.phase = "aim";
    requestAnimationFrame(() => { if (G) layout(); });
  }
  function nextQuestion() {
    G.i++;
    if (G.i >= G.qs.length) return finish();
    showQuestion();
  }
  function answer(k, bull) {
    const q = G.qs[G.i];
    const isRight = q.order[k] === 0;
    const rightK = q.order.indexOf(0);
    G.phase = "feedback";
    if (isRight) {
      const mult = Math.min(5, 1 + G.streak);
      const pts = 100 * mult + (bull ? 50 : 0);
      G.score += pts; G.streak++; G.best = Math.max(G.best, G.streak); G.correct++; G.correctIds.push(q.id);
      G.flash = { k, ok: true, t: 0 };
      say(`${bull ? "Bullseye! " : "Correct! "}+${pts}${mult > 1 ? ` (×${mult} streak)` : ""}`, "ok");
      burst(G.targets[k].x, G.targets[k].y, "#F5D06A", 26);
      const newTier = tierFor(G.correct, G.qs.length, false);
      if (newTier > G.tier) { G.tier = newTier; setTimeout(() => say(`Gear upgraded: ${TIERS[newTier].gear}!`, "gear"), 900); }
    } else {
      G.streak = 0;
      G.flash = { k, ok: false, right: rightK, t: 0 };
      say(`Not quite. It was ${"ABC"[rightK]}: ${q.answers[0]}`, "bad");
    }
    $("#gAnswers").querySelectorAll("li").forEach((li) => {
      const kk = +li.dataset.k;
      li.classList.toggle("right", kk === rightK);
      li.classList.toggle("wrong", kk === k && !isRight);
    });
    opts.track("game_answer", { id: q.id, correct: isRight });
    updateHud();
    setTimeout(nextQuestion, isRight ? 1500 : 2300);
  }
  function updateHud() {
    $("#gScore").textContent = G.score.toLocaleString();
    $("#gMult").textContent = "×" + Math.min(5, 1 + G.streak);
  }
  let msgT = 0;
  function say(text, kind) {
    const m = $("#gMsg");
    m.textContent = text; m.className = "g-msg on " + (kind || "");
    clearTimeout(msgT); msgT = setTimeout(() => { m.className = "g-msg"; }, kind === "gear" ? 2600 : 1900);
  }

  function finish() {
    G.phase = "end";
    const total = G.qs.length;
    G.tier = tierFor(G.correct, total, true);
    const perfect = G.correct === total;
    G.result = { score: G.score, correct: G.correct, total, bestStreak: G.best, tier: G.tier, correctIds: G.correctIds.slice() };
    opts.onEnd(G.result);
    opts.track("game_end", { score: G.score, correct: G.correct, tier: TIERS[G.tier].name });
    $("#gCard").classList.add("away");
    $("#gHint").textContent = "";
    const url = location.origin + location.pathname;
    const text = `I scored ${G.score.toLocaleString()} points (${G.correct}/${total}) in Wisam Abu Al Neel's portfolio archery challenge 🏹 Can you beat it?`;
    const end = $("#gEnd");
    end.innerHTML = `
      <p class="kicker">${perfect ? "Perfect score" : "Challenge complete"}</p>
      <h2>${G.score.toLocaleString()} points</h2>
      <div class="g-end-stats">
        <div><b>${G.correct}/${total}</b><span>correct</span></div>
        <div><b>×${Math.min(5, 1 + G.best)}</b><span>top streak</span></div>
        <div><b>${TIERS[G.tier].name}</b><span>rank</span></div>
      </div>
      <p class="muted">Your gear: ${TIERS[G.tier].gear}.${G.correct ? " Your correct answers will shine gold on the web." : ""}</p>
      <div class="g-share">
        ${navigator.share ? '<button type="button" class="chip chip-solid" data-s="native">Share my score</button>' : ""}
        <a class="chip ${navigator.share ? "" : "chip-solid"}" data-s="linkedin" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}">Share on LinkedIn</a>
        <button type="button" class="chip" data-s="copy">Copy my result</button>
      </div>
      <div class="g-end-actions">
        <button type="button" class="chip" data-a="again">Play again</button>
        <button type="button" class="chip chip-solid" data-a="back">Back to the web ✨</button>
      </div>`;
    end.querySelector('[data-a="again"]').addEventListener("click", () => { opts.track("game_again", {}); start(opts); });
    end.querySelector('[data-a="back"]').addEventListener("click", () => exit());
    end.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", async (e) => {
      const via = b.dataset.s;
      opts.track("game_share", { via, score: G.score });
      if (via === "native") { e.preventDefault(); try { await navigator.share({ title: "Portfolio archery challenge", text, url }); } catch (_) {} }
      if (via === "copy") {
        try { await navigator.clipboard.writeText(text + " " + url); b.textContent = "Copied ✓"; } catch (_) { b.textContent = "Copy failed"; }
        setTimeout(() => { b.textContent = "Copy my result"; }, 1800);
      }
      if (via === "linkedin") { try { await navigator.clipboard.writeText(text + " " + url); say("Your result is copied, paste it into the post", "ok"); } catch (_) {} }
    }));
    end.classList.toggle("side", perfect);
    if (perfect) {
      G.bowing = true; G.bowT = 0;
      burst(G.fx, G.groundY - G.h, "#F5D06A", 60);
      setTimeout(() => {
        const b = $("#gBubble");
        b.innerHTML = `<p>Thank you so much for your time and effort. I hope you enjoyed this experience, and do not hesitate to reach out to me.</p><span>Wisam</span>`;
        b.hidden = false;
        positionBubble();
      }, reduceMotion ? 0 : 1300);
      setTimeout(() => { end.hidden = false; }, reduceMotion ? 0 : 2400);
    } else {
      end.hidden = false;
    }
  }
  function positionBubble() {
    const b = $("#gBubble");
    if (G.W <= 760) { b.style.left = "16px"; b.style.top = "74px"; return; }
    b.style.left = Math.min(G.W * 0.42 - b.offsetWidth, G.fx + G.h * 0.25) + "px";
    b.style.top = Math.max(70, G.groundY - G.h * 1.25 - b.offsetHeight) + "px";
  }

  /* ── Input ── */
  const shoulder = () => ({ x: G.fx, y: G.groundY - G.h * 0.78 });
  function setAim(e) {
    const r = cv.getBoundingClientRect();
    G.aim = { x: e.clientX - r.left, y: e.clientY - r.top };
    G.hover = true;
  }
  function onMove(e) { if (!G || G.phase === "end") return; if (e.pointerType !== "touch" || G.touchAiming) setAim(e); }
  function onDown(e) {
    if (!G || G.phase !== "aim") return;
    setAim(e);
    if (e.pointerType === "touch") { G.touchAiming = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} return; }
    shoot();
  }
  function onUp(e) {
    if (!G) return;
    if (e.pointerType === "touch" && G.touchAiming) { G.touchAiming = false; if (G.phase === "aim") shoot(); }
  }
  function onKey(e) {
    if (!isOpen() || !G) return;
    if (e.key === "Escape") { exit(); return; }
    const k = { a: 0, b: 1, c: 2, "1": 0, "2": 1, "3": 2 }[e.key.toLowerCase()];
    if (k !== undefined && G.phase === "aim") autoShoot(k);
  }

  /* ── Physics: power grows with distance from the archer; gravity is gentle so aiming
       slightly above the bullseye lands in the middle ── */
  function launch() {
    const S = shoulder();
    const dx = G.aim.x - S.x, dy = G.aim.y - S.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / d, uy = dy / d;
    const maxD = G.W * 0.85;
    const p = Math.max(0.1, Math.min(1, d / maxD));
    const v = p * (maxD / 0.42);
    const B = { x: S.x + ux * G.h * 0.36, y: S.y + uy * G.h * 0.36 };
    return { x: B.x, y: B.y, vx: ux * v, vy: uy * v, p, ux, uy };
  }
  const gravity = () => G.R * 6.2;
  function shoot() {
    if (G.phase !== "aim") return;
    const L = launch();
    if (L.ux <= 0.05) { say("Aim towards the targets", ""); return; }
    G.arrow = { x: L.x, y: L.y, vx: L.vx, vy: L.vy, live: true };
    G.phase = "flight";
  }
  function autoShoot(k) {
    if (!G || G.phase !== "aim") return;
    const T = G.targets[k], S = shoulder();
    const t = 0.42 + (T.x - S.x) / G.W * 0.25;
    const B0 = { x: S.x + G.h * 0.3, y: S.y };
    // Picking an answer by key or from the list always reaches that target
    G.arrow = { x: B0.x, y: B0.y, vx: (T.x - B0.x) / t, vy: (T.y - B0.y) / t - 0.5 * gravity() * t, live: true, only: k };
    G.aim = { x: T.x, y: T.y - 0.5 * gravity() * t * t };
    G.phase = "flight";
  }

  function update(dt) {
    G.t += dt;
    if (G.phase === "flight" && G.arrow) {
      const A = G.arrow, steps = Math.max(2, Math.ceil(dt / 0.006));
      for (let s = 0; s < steps && A.live; s++) {
        const h = dt / steps;
        A.vy += gravity() * h; A.x += A.vx * h; A.y += A.vy * h;
        for (const T of G.targets) {
          if (A.only !== undefined && T.k !== A.only) continue;
          const d = Math.hypot(A.x - T.x, A.y - T.y);
          if (d <= T.r) {
            A.live = false;
            G.stuck.push({ x: A.x, y: A.y, a: Math.atan2(A.vy, A.vx) });
            G.arrow = null;
            answer(T.k, d < T.r * 0.3);
            break;
          }
        }
        if (A.live && (A.y >= G.groundY || A.x > G.W + 40 || A.x < -40 || A.y > G.H + 40)) {
          A.live = false;
          if (A.y >= G.groundY) G.stuck.push({ x: A.x, y: G.groundY, a: Math.atan2(A.vy, A.vx), ground: true });
          G.arrow = null; G.phase = "aim"; G.misses++;
          say(A.y >= G.groundY ? "Too short! Aim higher or further away" : "Missed! Try again", "");
        }
      }
    }
    G.particles = G.particles.filter((p) => (p.life -= dt) > 0);
    G.particles.forEach((p) => { p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    if (G.flash) G.flash.t += dt;
    if (G.bowing) G.bowT += dt;
  }
  function burst(x, y, color, n) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 220;
      G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.6 + Math.random() * 0.7, color });
    }
  }

  /* ── Drawing ── */
  function draw() {
    const { W, H } = G;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#070a25"); sky.addColorStop(0.6, "#0a183b"); sky.addColorStop(1, "#071132");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars();
    // moon
    ctx.fillStyle = "rgba(243,227,181,.9)"; ctx.beginPath(); ctx.arc(W * 0.9, H * 0.14, Math.min(W, H) * 0.035, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a183b"; ctx.beginPath(); ctx.arc(W * 0.9 + Math.min(W, H) * 0.014, H * 0.14 - 4, Math.min(W, H) * 0.032, 0, Math.PI * 2); ctx.fill();
    // hills + ground
    ctx.fillStyle = "#0c1840";
    ctx.beginPath(); ctx.moveTo(0, G.groundY - H * 0.08);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, G.groundY - H * 0.06 - Math.sin(x / 140) * H * 0.025);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = "#0e1f4d"; ctx.fillRect(0, G.groundY, W, H - G.groundY);
    ctx.strokeStyle = "#2C4B86"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, G.groundY); ctx.lineTo(W, G.groundY); ctx.stroke();

    G.targets.forEach(drawTarget);
    G.stuck.forEach((s) => drawArrow(s.x, s.y, s.a, G.h * 0.55, true));
    if (G.arrow) drawArrow(G.arrow.x, G.arrow.y, Math.atan2(G.arrow.vy, G.arrow.vx), G.h * 0.55, false);

    const L = launch();
    let dir = { x: L.ux, y: L.uy }, draw = G.phase === "aim" ? 0.25 + 0.75 * L.p : 0;
    if (G.phase === "end") { dir = { x: 0.85, y: 0.5 }; draw = 0; }
    if (G.phase === "aim" && G.hover && L.ux > 0.05) drawPreview(L);
    drawArcher(G.fx, G.groundY, G.h, dir, draw, G.tier, G.phase === "aim");
    if (G.phase === "aim") drawPower(L.p);

    G.particles.forEach((p) => { ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); });
    ctx.globalAlpha = 1;
    if (G.hover && G.phase !== "end") drawScope(G.aim.x, G.aim.y);
  }
  let starField = null;
  function drawStars() {
    if (!starField || starField.W !== G.W) {
      starField = { W: G.W, s: Array.from({ length: 90 }, () => ({ x: Math.random() * G.W, y: Math.random() * G.groundY * 0.8, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })) };
    }
    starField.s.forEach((s) => {
      ctx.globalAlpha = reduceMotion ? 0.6 : 0.35 + 0.35 * Math.sin(G.t * 1.5 + s.p);
      ctx.fillStyle = "#F3E3B5"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function drawTarget(T) {
    // stand
    ctx.strokeStyle = "#7A4A22"; ctx.lineWidth = Math.max(3, T.r * 0.12); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(T.x - T.r * 0.5, G.groundY); ctx.lineTo(T.x, T.y); ctx.lineTo(T.x + T.r * 0.5, G.groundY); ctx.stroke();
    const f = G.flash && G.flash.k === T.k ? G.flash : null;
    const isRightGlow = G.flash && !G.flash.ok && G.flash.right === T.k;
    if (f || isRightGlow) {
      ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = (f && !f.ok) ? "#E24B4A" : "#F5D06A";
      ctx.fillStyle = (f && !f.ok) ? "rgba(226,75,74,.35)" : "rgba(245,208,106,.35)";
      ctx.beginPath(); ctx.arc(T.x, T.y, T.r * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    [["#F4F4F4", 1], ["#1B2440", 0.8], ["#3A63B8", 0.6], ["#D32F2F", 0.4], ["#F5D06A", 0.2]].forEach(([c, k]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(T.x, T.y, T.r * k, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = "#0a183b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(T.x, T.y, T.r, 0, Math.PI * 2); ctx.stroke();
    // letter badge
    const by = T.y - T.r - 22, bw = 30;
    ctx.fillStyle = isRightGlow || (f && f.ok) ? "#F5D06A" : f ? "#E24B4A" : "#E0B84A";
    roundRect(T.x - bw / 2, by - 14, bw, 26, 13); ctx.fill();
    ctx.fillStyle = "#070a25"; ctx.font = "700 15px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(T.letter, T.x, by - 1);
    // answer text above the badge when there's room
    if (G.W >= 900 && G.qs[G.i]) {
      const q = G.qs[G.i]; const txt = q.answers[q.order[T.k]];
      ctx.font = "600 14px Inter, sans-serif"; ctx.fillStyle = "#EEF1F8";
      const lines = wrapText(txt, Math.min(220, G.W * 0.16));
      lines.forEach((ln, i) => ctx.fillText(ln, T.x, by - 26 - (lines.length - 1 - i) * 17));
    }
  }
  function wrapText(t, max) {
    const words = t.split(" "), out = []; let cur = "";
    words.forEach((w) => { const test = cur ? cur + " " + w : w; if (ctx.measureText(test).width > max && cur) { out.push(cur); cur = w; } else cur = test; });
    if (cur) out.push(cur); return out;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawArrow(x, y, a, len, stuck) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const tail = -len;
    ctx.strokeStyle = "#5E0B0B"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(stuck ? -6 : 0, 0); ctx.lineTo(tail, 0); ctx.stroke();
    ctx.strokeStyle = "#D32F2F"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(stuck ? -6 : 0, 0); ctx.lineTo(tail, 0); ctx.stroke();
    if (!stuck) { ctx.fillStyle = "#C7CDD4"; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-6, -5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#4A4F57"; ctx.lineWidth = 0.8;
    [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(tail + 14, 0); ctx.lineTo(tail + 2, s * 7); ctx.lineTo(tail - 2, s * 7); ctx.lineTo(tail + 6, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }
  function drawPreview(L) {
    const g = gravity();
    ctx.fillStyle = "#F3E3B5";
    for (let t = 0.03; t <= 0.19; t += 0.025) {
      const x = L.x + L.vx * t, y = L.y + L.vy * t + 0.5 * g * t * t;
      ctx.globalAlpha = 0.75 - t * 3; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawPower(p) {
    const x = G.fx - G.h * 0.55, y0 = G.groundY - G.h * 0.95, hh = G.h * 0.8, w = 8;
    ctx.fillStyle = "rgba(255,255,255,.12)"; roundRect(x, y0, w, hh, 4); ctx.fill();
    const c = p < 0.5 ? "#6FD3A0" : p < 0.8 ? "#E0B84A" : "#F5A08A";
    ctx.fillStyle = c; roundRect(x, y0 + hh * (1 - p), w, hh * p, 4); ctx.fill();
    ctx.fillStyle = "#AEB8D6"; ctx.font = "600 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("POWER", x + w / 2, y0 - 10);
  }
  function drawScope(x, y) {
    const r = 20;
    ctx.save();
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.beginPath(); ctx.moveTo(x + dx * r, y + dy * r); ctx.lineTo(x + dx * 6, y + dy * 6); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "#000";
      ctx.beginPath(); ctx.moveTo(x + dx * r, y + dy * r); ctx.lineTo(x + dx * 6, y + dy * 6); ctx.stroke();
    });
    ctx.fillStyle = "#E53935"; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* The stickman, with clothing and bow that improve with the score */
  function drawArcher(fx, fy, h, dir, draw, tier, nocked) {
    const lw = Math.max(3, h * 0.035);
    let bend = 0;
    if (G.bowing) { const t = Math.min(1, G.bowT / 1.1); bend = Math.sin(Math.min(1, t) * Math.PI) * 0.65; }
    const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
    const hip = { x: fx, y: fy - h * 0.45 };
    const off = (dx, dy) => { const r = rot(dx, dy, bend); return { x: hip.x + r.x, y: hip.y + r.y }; };
    const S = off(0, -h * 0.33), head = off(0, -h * 0.46), hr = h * 0.1;
    const perp = { x: -dir.y, y: dir.x };
    const B = { x: S.x + dir.x * h * 0.36, y: S.y + dir.y * h * 0.36 };
    const Nk = { x: B.x - dir.x * (h * 0.05 + draw * h * 0.27), y: B.y - dir.y * (h * 0.05 + draw * h * 0.27) };

    // cape (Legend) behind everything
    if (tier >= 3) {
      ctx.fillStyle = "#1F3B7A"; ctx.beginPath(); ctx.moveTo(S.x - h * 0.04, S.y);
      const sway = reduceMotion ? 0 : Math.sin(G.t * 2) * h * 0.03;
      ctx.quadraticCurveTo(S.x - h * 0.28, S.y + h * 0.25, hip.x - h * 0.3 + sway, fy - h * 0.12);
      ctx.lineTo(hip.x - h * 0.05, fy - h * 0.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#E0B84A"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // legs
    ctx.strokeStyle = "#EEF1F8"; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(fx - h * 0.15, fy); ctx.lineTo(hip.x, hip.y); ctx.lineTo(fx + h * 0.13, fy); ctx.stroke();
    if (tier >= 2) { // boots
      ctx.fillStyle = tier >= 3 ? "#B8902A" : "#4A2C14";
      [[fx - h * 0.15, fy], [fx + h * 0.13, fy]].forEach(([x, y]) => { roundRect(x - h * 0.05, y - h * 0.08, h * 0.1, h * 0.08, 3); ctx.fill(); });
    }
    // torso
    ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(S.x, S.y); ctx.stroke();
    if (tier >= 1) {
      const t1 = off(-h * 0.08, -h * 0.31), t2 = off(h * 0.08, -h * 0.31), t3 = off(h * 0.11, h * 0.07), t4 = off(-h * 0.11, h * 0.07);
      ctx.fillStyle = tier >= 3 ? goldGrad(S, hip) : tier >= 2 ? "#7A4A22" : "#2F7A4F";
      ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t4.x, t4.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tier >= 3 ? "#7A5A10" : "#2B1A0B"; ctx.lineWidth = Math.max(1.5, lw * 0.5);
      const b1 = off(-h * 0.1, -h * 0.02), b2 = off(h * 0.1, -h * 0.02);
      ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); // belt
      if (tier >= 2) { const s1 = off(-h * 0.07, -h * 0.3), s2 = off(h * 0.09, -h * 0.05); ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); }
      if (tier >= 3) { ctx.fillStyle = "#F5D06A"; [off(-h * 0.08, -h * 0.31), off(h * 0.08, -h * 0.31)].forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, h * 0.05, 0, Math.PI * 2); ctx.fill(); }); }
    }
    // head
    ctx.strokeStyle = "#EEF1F8"; ctx.lineWidth = lw; ctx.fillStyle = "#070a25";
    ctx.beginPath(); ctx.arc(head.x, head.y, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (tier === 2) { // hood
      ctx.fillStyle = "#5C3818"; ctx.beginPath(); ctx.arc(head.x, head.y, hr * 1.25, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(head.x - hr * 1.4, head.y + hr * 0.4); ctx.closePath(); ctx.fill();
    }
    if (tier >= 3) { // helmet + plume
      ctx.fillStyle = goldGrad({ x: head.x, y: head.y - hr }, { x: head.x, y: head.y + hr });
      ctx.beginPath(); ctx.arc(head.x, head.y, hr * 1.18, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#D32F2F"; ctx.beginPath(); ctx.ellipse(head.x - hr * 0.2, head.y - hr * 1.45, hr * 0.7, hr * 0.3, -0.4, 0, Math.PI * 2); ctx.fill();
    }
    // front arm to the bow hand
    ctx.strokeStyle = "#EEF1F8"; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    // bow
    const T1 = { x: B.x + perp.x * h * 0.32 - dir.x * h * 0.07, y: B.y + perp.y * h * 0.32 - dir.y * h * 0.07 };
    const T2 = { x: B.x - perp.x * h * 0.32 - dir.x * h * 0.07, y: B.y - perp.y * h * 0.32 - dir.y * h * 0.07 };
    const ctl = (T) => ({ x: B.x + dir.x * h * 0.16 + (T.x - B.x) * 0.9, y: B.y + dir.y * h * 0.16 + (T.y - B.y) * 0.9 });
    const bow = [
      { c: "#9A6B3A", w: 0.026 }, { c: "#7A4A22", w: 0.036 }, { c: "#2B2F36", w: 0.042 }, { c: "#E8C766", w: 0.048 }
    ][tier];
    ctx.save();
    if (tier >= 3) { ctx.shadowBlur = 14; ctx.shadowColor = "#F5D06A"; }
    ctx.strokeStyle = bow.c; ctx.lineWidth = Math.max(2.5, h * bow.w);
    [T1, T2].forEach((T) => { const c = ctl(T); ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.quadraticCurveTo(c.x, c.y, T.x, T.y); ctx.stroke(); });
    if (tier >= 1) { // recurve tips
      ctx.lineWidth = Math.max(2, h * bow.w * 0.8);
      [T1, T2].forEach((T, i) => { const s = i ? -1 : 1; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.quadraticCurveTo(T.x + perp.x * s * h * 0.04, T.y + perp.y * s * h * 0.04, T.x + dir.x * h * 0.06, T.y + dir.y * h * 0.06); ctx.stroke(); });
    }
    if (tier >= 2) { ctx.fillStyle = tier >= 3 ? "#FFFFFF" : "#C7CDD4"; [T1, T2].forEach((T) => { ctx.beginPath(); ctx.arc(T.x, T.y, h * 0.022, 0, Math.PI * 2); ctx.fill(); }); }
    ctx.restore();
    // string
    ctx.strokeStyle = "rgba(238,241,248,.85)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(T1.x, T1.y); ctx.lineTo(Nk.x, Nk.y); ctx.lineTo(T2.x, T2.y); ctx.stroke();
    // back arm to the string
    const E = { x: S.x - dir.x * h * 0.12 + perp.x * h * 0.1, y: S.y - dir.y * h * 0.12 + perp.y * h * 0.1 };
    ctx.strokeStyle = "#EEF1F8"; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(E.x, E.y); ctx.lineTo(Nk.x, Nk.y); ctx.stroke();
    // nocked arrow
    if (nocked) drawArrow(Nk.x + dir.x * h * 0.62, Nk.y + dir.y * h * 0.62, Math.atan2(dir.y, dir.x), h * 0.62, false);
  }
  function goldGrad(a, b) {
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, "#FFF0B8"); g.addColorStop(0.5, "#E8C766"); g.addColorStop(1, "#A9801E");
    return g;
  }

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  window.ArcheryGame = { start, hide, isOpen, _state: () => G };
})();
