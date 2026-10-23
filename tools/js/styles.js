// Computed-style snapshot and cascade analysis for the current page state.
// Argument: {mode: "hash" | "detail" | "cascade", paths?: [...]}
//   hash:    {path: hash} of every element's computed style (plus ::before/::after when they render)
//   detail:  {path: {prop: value}} for the given paths
//   cascade: which (rule, selector, longhand) declarations win on at least one element right now,
//            and which selectors matched anything. Used to find declarations that never apply.
(arg) => {
  const SKIP = el => false;
  function pathOf(el) {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      let i = 1, s = el;
      while ((s = s.previousElementSibling)) i++;
      parts.unshift(el.tagName.toLowerCase() + ":" + i);
      el = el.parentElement;
    }
    return parts.join(">");
  }
  function styleString(cs) {
    // sorted: custom properties are listed in declaration order, which says nothing about what is on screen
    const names = [];
    for (let i = 0; i < cs.length; i++) names.push(cs[i]);
    return names.sort().map(p => p + ":" + cs.getPropertyValue(p)).join(";");
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  const els = [document.documentElement, ...document.querySelectorAll("*")].filter(el => !SKIP(el) && el.tagName !== "SCRIPT" && el.tagName !== "STYLE" && el.tagName !== "HEAD" && !(el.parentElement && el.parentElement.tagName === "HEAD"));
  const targets = [];
  els.forEach(el => {
    const p = el === document.documentElement ? "html" : pathOf(el);
    targets.push([p, el, null]);
    ["::before", "::after"].forEach(pe => {
      const c = getComputedStyle(el, pe).getPropertyValue("content");
      if (c && c !== "none" && c !== "normal") targets.push([p + pe, el, pe]);
    });
  });

  if (arg.mode === "hash" || arg.mode === "detail") {
    const want = arg.paths ? new Set(arg.paths) : null, out = {};
    targets.forEach(([p, el, pe]) => {
      if (want && !want.has(p)) return;
      const cs = getComputedStyle(el, pe);
      if (arg.mode === "hash") out[p] = hash(styleString(cs));
      else { const o = {}; for (let i = 0; i < cs.length; i++) o[cs[i]] = cs.getPropertyValue(cs[i]); out[p] = o; }
    });
    return out;
  }

  // cascade: list every style rule with an index stable across states (sheet order, rule order)
  const DYN = /:(hover|active|focus|focus-visible|focus-within|visited|link|target)\b/;
  const rules = [];
  function walk(list, media) {
    for (const r of list) {
      if (r.type === 1) rules.push({r, media});
      else if (r.type === 4) walk(r.cssRules, (media ? media + " and " : "") + r.conditionText);
    }
  }
  for (const sh of document.styleSheets) { let cr; try { cr = sh.cssRules; } catch (e) { continue; } if (sh.ownerNode && sh.ownerNode.tagName === "STYLE") walk(cr, null); }
  function splitSel(s) { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" ) d++; if (ch === ")") d--; if (ch === "," && !d) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; }
  function spec(sel) {
    // specificity of a selector without its pseudo-element; :not(x) and :has(x) count their argument, :where(x) counts nothing
    let a = 0, b = 0, c = 0;
    let s = sel.replace(/:where\([^)]*\)/g, "");
    s = s.replace(/:(not|has|is)\(([^)]*)\)/g, (_, f, inner) => { const sp = spec(inner); a += sp[0]; b += sp[1]; c += sp[2]; return ""; });
    s = s.replace(/\[[^\]]*\]/g, () => { b++; return ""; });
    s = s.replace(/#[\w-]+/g, () => { a++; return ""; });
    s = s.replace(/\.[\w-]+/g, () => { b++; return ""; });
    s = s.replace(/::?[\w-]+(\([^)]*\))?/g, () => { b++; return ""; });
    (s.match(/(^|[\s>+~])([a-zA-Z][\w-]*)/g) || []).forEach(() => c++);
    return [a, b, c];
  }
  const sels = [];   // {ri, si, text, pe, dyn, spec, test, media}
  rules.forEach((x, ri) => splitSel(x.r.selectorText).forEach((t, si) => {
    let pe = null, test = t;
    const m = t.match(/::?(before|after)\s*$/);
    if (m) { pe = "::" + m[1]; test = t.slice(0, m.index); }
    sels.push({ri, si, text: t, pe, dyn: DYN.test(t), spec: spec(test), test: test || "*", media: x.media});
  }));
  const mediaOn = {};
  sels.forEach(s => { if (s.media && !(s.media in mediaOn)) mediaOn[s.media] = matchMedia(s.media).matches; });
  const matched = {}, wins = {}, pairs = {};
  targets.forEach(([p, el, pe]) => {
    const best = {}, second = {}, all = {};
    sels.forEach(s => {
      if (s.pe !== pe || s.dyn) return;
      if (s.media && !mediaOn[s.media]) return;
      let ok = false; try { ok = el.matches(s.test); } catch (e) { return; }
      if (!ok) return;
      matched[s.ri + ":" + s.si] = 1;
      const st = rules[s.ri].r.style;
      for (let i = 0; i < st.length; i++) {
        const prop = st[i], imp = st.getPropertyPriority(prop) === "important" ? 1 : 0;
        const key = [imp, s.spec[0], s.spec[1], s.spec[2], s.ri];
        const c = {key, id: s.ri + ":" + s.si + ":" + prop, hid: /\[hidden\]/.test(s.text)}, cur = best[prop];
        (all[prop] = all[prop] || []).push(c);
        if (!cur || cmp(key, cur.key) > 0) { if (cur) second[prop] = cur; best[prop] = c; }
        else if (!second[prop] || cmp(key, second[prop].key) > 0) second[prop] = c;
      }
    });
    // an inline style set by JS beats the stylesheet, but the stylesheet value still applies before JS runs: keep it
    // rules that compete for a property on this element with the same importance and specificity:
    // only their order decides, so a reorganisation must keep it
    for (const prop in all) {
      const cs = all[prop];
      for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i].key, b = cs[j].key;
        if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] !== b[4]) pairs[Math.min(a[4], b[4]) + ">" + Math.max(a[4], b[4])] = 1;
      }
    }
    for (const prop in best) {
      wins[best[prop].id] = 1;
      // a [hidden] rule only wins while the element is hidden: whatever it beat applies when it shows
      if (best[prop].hid && second[prop]) wins[second[prop].id] = 1;
    }
  });
  function cmp(x, y) { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }
  return {
    rules: rules.map((x, ri) => ({sel: x.r.selectorText, media: x.media, props: Array.from({length: x.r.style.length}, (_, i) => x.r.style[i])})),
    sels: sels.map(s => ({ri: s.ri, si: s.si, dyn: s.dyn, media: s.media, mediaOn: s.media ? mediaOn[s.media] : true})),
    matched: Object.keys(matched), wins: Object.keys(wins), pairs: Object.keys(pairs)
  };
}
