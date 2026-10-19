"""Draws the app's icons: a leaf, carved in outline into an oak board, the grain of the app's desk.
Run:  python3 tools/build_icons.py   (writes icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png)
      python3 tools/build_icons.py --shrink   (only reduces the existing files to 256 colours)
The same leaf is the home screen's mark (LEAF_SVG in js/library.js); keep the two paths alike if you change it.
Needs: pip install playwright numpy scipy pillow && playwright install chromium
"""
import asyncio, base64, io, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
# The leaf on a 100 x 100 grid: outline, midrib, veins and stem. Drawn as one stroked path.
def _leaf():
    # blade from the stem's end (27, 75) to the tip (76, 23); the midrib bows slightly; veins leave it towards the tip on both sides
    base, tip = (27.0, 75.0), (76.0, 23.0)
    d = (tip[0] - base[0], tip[1] - base[1]); L = (d[0] ** 2 + d[1] ** 2) ** 0.5; u = (d[0] / L, d[1] / L); n = (-u[1], u[0])
    out = [f"M{base[0]} {base[1]} C23 51 42 29 {tip[0]} {tip[1]} C74 53 56 73 {base[0]} {base[1]} Z",  # blade
           f"M{base[0]} {base[1]} Q50.5 51.5 {tip[0] - 4.2:.1f} {tip[1] + 4.6:.1f}"]                      # midrib
    for t, ln in [(0.24, 10.5), (0.42, 11.0), (0.6, 9.5), (0.76, 6.5)]:
        px, py = base[0] + d[0] * t, base[1] + d[1] * t
        for side, f in ((1, 1.0), (-1, 0.92)):
            vx, vy = u[0] * 0.66 + n[0] * side * 0.75, u[1] * 0.66 + n[1] * side * 0.75
            m = ln * f; ex, ey = px + vx * m, py + vy * m
            cx, cy = px + vx * m * 0.5 - u[0] * 0.9, py + vy * m * 0.5 - u[1] * 0.9  # a slight bow, away from the tip
            out.append(f"M{px:.1f} {py:.1f} Q{cx:.1f} {cy:.1f} {ex:.1f} {ey:.1f}")
    out.append(f"M{base[0]} {base[1]} C24.5 78.5 21.5 81.5 16.5 83.5")  # stem
    return " ".join(out)
LEAF = _leaf()

def wood(px=1024, seed=11):
    """Quarter-sawn oak, drawn: growth bands that wander, darker latewood at each band's end, fine fibres along the board."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:px, 0:px].astype(float)
    smooth = lambda sig: (lambda a: (a - a.mean()) / a.std())(gaussian_filter(rng.normal(size=(px, px)), sig))
    warp = smooth((px / 7, px / 3)) * px * 0.05 + smooth((px / 20, px / 8)) * px * 0.012
    r = (y + warp + 0.04 * x) / px * 7.5
    frac = r - np.floor(r)
    late = np.clip((frac - 0.62) / 0.3, 0, 1) ** 2 * (frac < 0.92) + np.clip((1 - frac) / 0.08, 0, 1) * (frac >= 0.92)
    fib = smooth((0.7, 26)); fib2 = smooth((2.5, 60))
    a = 0.5 * late + 0.11 * fib + 0.08 * fib2 + 0.06 * smooth((px / 10, px / 10))
    a = np.clip(a, -0.25, 1)[..., None]
    light, dark = np.array([218, 186, 140.]), np.array([158, 112, 66.])
    img = light * (1 - a) + dark * a
    # a soft light from the top left
    shade = 1.04 - 0.14 * np.hypot(x / px - 0.35, y / px - 0.3)
    img = np.clip(img * shade[..., None], 0, 255).astype(np.uint8)
    buf = io.BytesIO(); Image.fromarray(img).save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

WOOD = None
def svg(size, scale):
    global WOOD
    WOOD = WOOD or wood()
    # scale: how much of the icon the leaf takes (the maskable icon keeps it inside the middle circle)
    s = size / 100
    k = scale
    off = 50 - 50 * k
    sw = 3.1  # stroke width on the 100 grid
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 100 100">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.7" numOctaves="4" seed="7" result="n"/>
      <feColorMatrix in="n" values="0 0 0 0 0.36  0 0 0 0 0.22  0 0 0 0 0.10  1.1 0 0 0 -0.42"/>
    </filter>
    <filter id="rings" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.16" numOctaves="3" seed="3" result="t"/>
      <feComponentTransfer in="t" result="r"><feFuncA type="discrete" tableValues="0 0.5 0 0.6 0 0.45 0 0.55 0"/></feComponentTransfer>
      <feColorMatrix in="r" values="0 0 0 0 0.52  0 0 0 0 0.34  0 0 0 0 0.17  0 0 0 0.35 0" result="c"/>
      <feGaussianBlur in="c" stdDeviation="0.25 0.12"/>
    </filter>
    <radialGradient id="light" cx="38%" cy="30%" r="85%">
      <stop offset="0" stop-color="#fff6e4" stop-opacity="0.35"/><stop offset="1" stop-color="#5a3a1c" stop-opacity="0.22"/>
    </radialGradient>
    <filter id="carve" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.35" result="b"/>
      <feOffset in="b" dx="0" dy="0.7" result="lo"/>
      <feComposite in="SourceAlpha" in2="lo" operator="out" result="topedge"/>
      <feFlood flood-color="#2a160a" flood-opacity="0.85"/><feComposite in2="topedge" operator="in" result="shade"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/></feMerge>
    </filter>
  </defs>
  <image href="{WOOD}" width="100" height="100" preserveAspectRatio="none"/>
  <g transform="translate({off} {off}) scale({k}) translate(4 -3)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="{LEAF}" stroke="#fff3dc" stroke-opacity="0.55" stroke-width="{sw}" transform="translate(0 0.9)"/>
    <path d="{LEAF}" stroke="#6b4422" stroke-width="{sw}" filter="url(#carve)"/>
    <path d="{LEAF}" stroke="#3d2412" stroke-opacity="0.55" stroke-width="{sw * 0.42}" transform="translate(0 0.25)"/>
  </g>
</svg>"""

async def main(out):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page()
        for name, size, scale in [("icon-512.png", 512, 0.86), ("icon-192.png", 192, 0.86), ("icon-maskable-512.png", 512, 0.66), ("apple-touch-icon.png", 180, 0.8)]:
            await page.set_viewport_size({"width": size, "height": size})
            await page.set_content(f"<html><body style='margin:0'>{svg(size, scale)}</body></html>")
            await page.screenshot(path=str(out / name), clip={"x": 0, "y": 0, "width": size, "height": size})
            shrink(out / name)
        await b.close()

def shrink(path):
    """256 colours with dithering: the grain looks the same and the file is about a third smaller (the icons are opaque)."""
    im = Image.open(path).convert("RGB")
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(path, optimize=True)

if __name__ == "__main__":
    if sys.argv[1:2] == ["--shrink"]:  # only make the existing icons smaller
        for f in ["icon-512.png", "icon-192.png", "icon-maskable-512.png", "apple-touch-icon.png"]: shrink(ROOT / f)
    else:
        asyncio.run(main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT))
