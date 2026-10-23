"""Draw the app icons (pixel art on a 32x32 grid) into icons/.

    python tools/icons.py

A golden coupe with a lime wheel on the dark wood of the nav bar, in the game's palette. Every size is the
32x32 drawing scaled by whole pixels (no smoothing). maskable-512 keeps the drawing inside the 80% safe zone
for Android's round and squircle masks; apple-touch-icon is full bleed because iOS rounds the corners itself.
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"

DRAW = r"""
(art) => {
  const P = {bg:"#3b2414", wood:"#4a2e1a", edge:"#6a4020", glass:"#f6e7c1", glass2:"#c9a96e", drink:"#f2c14a",
             drink2:"#e0a020", shine:"#ffffff", lime:"#7fc062", lime2:"#3f7a2e", pith:"#e8f5c8", spark:"#f2c14a"};
  const g = document.createElement("canvas"); g.width = g.height = 32; const c = g.getContext("2d");
  const px = (x, y, col) => { c.fillStyle = P[col]; c.fillRect(x, y, 1, 1); };
  const row = (y, x0, x1, col) => { for (let x = x0; x <= x1; x++) px(x, y, col); };
  // dark wood: planks every 6 rows
  c.fillStyle = P.bg; c.fillRect(0, 0, 32, 32);
  for (let y = 5; y < 32; y += 6) row(y, 0, 31, "wood");
  if (art.border) { for (let i = 0; i < 32; i++) { px(i, 0, "edge"); px(i, 31, "edge"); px(0, i, "edge"); px(31, i, "edge"); } }
  // coupe bowl: a half ellipse, rim at y=9, drink inside
  row(9, 5, 26, "glass");
  for (let r = 0; r < 7; r++) {
    const hw = Math.round(10.5 * Math.sqrt(1 - Math.pow((r + 0.6) / 7.2, 2))), y = 10 + r;
    row(y, 16 - hw, 15 + hw, r < 4 ? "drink" : "drink2");
    px(16 - hw, y, "glass"); px(15 + hw, y, "glass");
  }
  px(9, 11, "shine"); px(8, 12, "shine"); px(9, 12, "shine"); px(10, 10, "shine");
  // stem and foot
  for (let y = 17; y <= 23; y++) { px(15, y, "glass"); px(16, y, "glass2"); }
  row(24, 11, 20, "glass"); row(25, 10, 21, "glass2");
  // lime wheel hooked on the rim
  const cx = 24, cy = 7;
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.sqrt(x * x + y * y);
    if (d <= 3.2) px(cx + x, cy + y, d > 2.3 ? "lime2" : (x === 0 || y === 0 || Math.abs(x) === Math.abs(y)) ? "pith" : "lime");
  }
  // sparkles
  [[6,4],[5,5],[7,5],[6,6],[27,15],[9,27],[24,28],[25,27],[25,29],[26,28]].forEach(([x, y]) => px(x, y, "spark"));
  // place the drawing on the final canvas, scaled by whole pixels
  const out = document.createElement("canvas"); out.width = out.height = art.size; const o = out.getContext("2d");
  o.imageSmoothingEnabled = false;
  if (art.bleed) { o.fillStyle = P.bg; o.fillRect(0, 0, art.size, art.size); }
  const s = art.scale, off = Math.round((art.size - 32 * s) / 2);
  o.drawImage(g, off, off, 32 * s, 32 * s);
  return out.toDataURL("image/png").split(",")[1];
}
"""

ICONS = [  # name, size, scale, background beyond the drawing, inner border
    ("icon-192.png", 192, 6, False, True),
    ("icon-512.png", 512, 16, False, True),
    ("icon-maskable-512.png", 512, 12, True, False),
    ("apple-touch-icon.png", 180, 5, True, False),
    ("favicon-32.png", 32, 1, False, False),
    ("favicon-64.png", 64, 2, False, False),
]

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page()
        for name, size, scale, bleed, border in ICONS:
            data = p.evaluate(DRAW, {"size": size, "scale": scale, "bleed": bleed, "border": border})
            (OUT / name).write_bytes(base64.b64decode(data))
            print("icons/" + name, size)
        b.close()
