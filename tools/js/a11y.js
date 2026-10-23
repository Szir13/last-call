// Accessibility audit of the current page state. Returns a list of issues:
// {rule, sel, detail}. Rules: name (control without an accessible name), target (tap target too small),
// contrast (text below WCAG AA), keyboard (clickable thing the keyboard cannot reach), motion
// (animation still running under prefers-reduced-motion is checked by the caller).
() => {
  const out = [];
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden],.fold"); };
  function sig(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) return s + "#" + el.id;
    const c = (typeof el.className === "string" ? el.className : "").split(/\s+/).filter(x => x && !/^(on|sel|can|locked|owned|known|w|t|rdy|hi|lo|up|down|open|folded|dim)$/.test(x)).slice(0, 3);
    if (c.length) s += "." + c.join(".");
    const p = el.parentElement && el.parentElement.closest("[id],.card,.row,.pb,.cand,.vpage");
    return (p && p !== el ? sig(p) + " " : "") + s;
  }
  function name(el) {
    const l = el.getAttribute("aria-label") || el.getAttribute("title") || "";
    if (l.trim()) return l.trim();
    const by = el.getAttribute("aria-labelledby");
    if (by) return by.split(/\s+/).map(i => (document.getElementById(i) || {}).textContent || "").join(" ").trim();
    if (el.labels && el.labels.length) return el.labels[0].textContent.trim();
    return (el.innerText || el.value || el.alt || "").trim();
  }
  const controls = [...document.querySelectorAll("button,input,select,textarea,a[href],[role=button],[tabindex]")].filter(vis);
  controls.forEach(el => {
    if (el.matches("[role=button]:not(button):not(a)") && el.tabIndex < 0) out.push({rule: "keyboard", sel: sig(el), detail: "role=button but not focusable"});
    if (!name(el)) out.push({rule: "name", sel: sig(el), detail: el.outerHTML.slice(0, 80)});
    const r = el.getBoundingClientRect();
    // hit area may be widened by a ::before/::after with negative inset: measure what a finger can hit
    let w = r.width, h = r.height;
    ["::before", "::after"].forEach(pe => {
      const cs = getComputedStyle(el, pe);
      if (cs.content !== "none" && cs.position === "absolute" && cs.pointerEvents !== "none") {
        const t = parseFloat(cs.top) || 0, l = parseFloat(cs.left) || 0, rr = parseFloat(cs.right) || 0, b = parseFloat(cs.bottom) || 0;
        w = Math.max(w, r.width - l - rr); h = Math.max(h, r.height - t - b);
      }
    });
    const primary = el.matches(".buy,.big,nav button,#dock button,.pxstrip .ghost,.pxbar .ghost,.card .ghost,.vtabs .ghost,#pxok,.pxnext button");
    const min = primary ? 44 : 24;
    if (Math.round(w) < min || Math.round(h) < min) out.push({rule: "target", sel: sig(el), detail: Math.round(w) + "x" + Math.round(h) + " < " + min});
  });
  // clickable elements that are not controls: anything with a pointer cursor and no keyboard access
  document.querySelectorAll("div,span,section,canvas,li,b,i,p,h2").forEach(el => {
    if (!vis(el) || getComputedStyle(el).cursor !== "pointer") return;
    if (el.closest("button,a,input,select,[role=button],[tabindex]") !== null && el.closest("[tabindex],[role=button]") !== null) return;
    if (el.closest("button,a,input,select")) return;
    if (el.querySelector("[role=button][tabindex],#pxnext")) return;   // reachable through a focusable part that does the same thing
    if (el.parentElement && getComputedStyle(el.parentElement).cursor === "pointer" && !el.matches("[tabindex]")) return;   // report the outermost
    out.push({rule: "keyboard", sel: sig(el), detail: "pointer cursor, not focusable"});
  });
  // contrast of text against the first opaque background behind it
  function rgba(s) { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; }
  function lum(c) { return [0, 1, 2].map(i => { const x = c[i] / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0); }
  function bgOf(el) {
    let layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e), c = rgba(cs.backgroundColor);
      if (cs.backgroundImage !== "none" && !/gradient/.test(cs.backgroundImage)) return null;   // text over a picture: skip
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; base = [0, 1, 2].map(k => c[k] * c[3] + base[k] * (1 - c[3])); }
    return base;
  }
  const seen = new Set();
  document.querySelectorAll("body *").forEach(el => {
    if (!vis(el) || el.closest("#pxov,canvas,svg")) return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    if (el.closest(":disabled")) return;   // WCAG 1.4.3 exempts inactive controls
    const cs = getComputedStyle(el), fg = rgba(cs.color);
    if (!fg || parseFloat(cs.opacity) === 0) return;
    const bg = bgOf(el); if (!bg) return;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    const f = [0, 1, 2].map(k => fg[k] * fg[3] * op + bg[k] * (1 - fg[3] * op));
    const L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < need) {
      const k = sig(el) + "|" + ratio.toFixed(1);
      const halo = cs.textShadow !== "none";   // outlined pixel text: readable through its dark halo, reported apart
      if (!seen.has(k)) { seen.add(k); out.push({rule: halo ? "contrast-halo" : "contrast", sel: sig(el), detail: ratio.toFixed(2) + " < " + need + " (" + cs.color + " on rgb(" + bg.map(Math.round) + "))"}); }
    }
  });
  return out;
}
