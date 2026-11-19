"""Erzeugt alle Logo-Varianten von dressed & nested als SVG (Schrift in Pfade umgewandelt).

Aufruf:  python3 tools/make-logos.py <SpaceGrotesk-Bold.ttf>
Ausgabe: public/logo/*.svg
"""
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = TTFont(sys.argv[1])
GS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT["head"].unitsPerEm
ASC = FONT["hhea"].ascent
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "logo")
os.makedirs(OUT, exist_ok=True)

BROWN, BLUE, WHITE, INK = "#4B2E20", "#BFD8EE", "#FFFFFF", "#1C1B20"


def glyph_path(ch, x, y, size):
    name = CMAP[ord(ch)]
    pen = SVGPathPen(GS)
    s = size / UPM
    GS[name].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    return pen.getCommands(), GS[name].width * s


def text_paths(runs, x, baseline, size, tracking=-0.03):
    """runs = [(text, farbe), ...] → (svg, breite)"""
    out, cx = [], x
    for text, color in runs:
        d_all = []
        for ch in text:
            if ch == " ":
                cx += GS[CMAP[32]].width * size / UPM + tracking * size
                continue
            d, adv = glyph_path(ch, cx, baseline, size)
            d_all.append(d)
            cx += adv + tracking * size
        if d_all:
            out.append(f'<path fill="{color}" d="{" ".join(d_all)}"/>')
    return "".join(out), cx - x - tracking * size


def measure(text, size, tracking=-0.03):
    return text_paths([(text, "#000")], 0, 0, size, tracking)[1]


def save(name, w, h, body, bg=None, rx=0):
    bgr = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">{bgr}{body}</svg>\n'
    with open(os.path.join(OUT, name + ".svg"), "w") as f:
        f.write(svg)


CAP = 0.70  # ungefähre Versalhöhe relativ zur Schriftgröße (für vertikale Zentrierung)

# ---------- 1. Wortmarke (horizontal) ----------
SCHEMES = {
    "hell": (INK, BROWN, None),          # Text, &, Hintergrund
    "braun": (WHITE, BLUE, BROWN),
    "hellblau": (INK, BROWN, BLUE),
    "weiss": (WHITE, WHITE, None),       # für Fotos / dunkle Flächen
    "schwarz": (INK, INK, None),         # einfarbig
}
size, pad = 120, 60
for key, (fg, amp, bg) in SCHEMES.items():
    w_text = measure("dressed&nested", size)
    W, H = w_text + 2 * pad, size * 1.25 + 2 * pad * 0.6
    base = H / 2 + size * CAP / 2
    body, _ = text_paths([("dressed", fg), ("&", amp), ("nested", fg)], pad, base, size)
    save(f"wortmarke-{key}", W, H, body, bg, rx=0)

# ---------- 2. Gestapelt ----------
size = 150
for key, (fg, amp, bg) in SCHEMES.items():
    w1, w2 = measure("dressed", size), measure("&nested", size)
    W = max(w1, w2) + 2 * pad
    lh = size * 0.92
    H = lh * 2 + 2 * pad
    b1 = pad + size * CAP + (lh - size * CAP) / 2
    body1, _ = text_paths([("dressed", fg)], pad, b1, size)
    body2, _ = text_paths([("&", amp), ("nested", fg)], pad, b1 + lh, size)
    save(f"gestapelt-{key}", W, H, body1 + body2, bg)

# ---------- 3. Wortmarke mit Slogan ----------
for key, (fg, amp, bg) in SCHEMES.items():
    size, ts = 120, 30
    w_text = measure("dressed&nested", size)
    tag = "GET DRESSED. GET NESTED."
    w_tag = measure(tag, ts, tracking=0.22)
    W = max(w_text, w_tag) + 2 * pad
    H = size * CAP + 26 + ts * CAP + 2 * pad + 20
    base = pad + size * CAP
    body, _ = text_paths([("dressed", fg), ("&", amp), ("nested", fg)], (W - w_text) / 2, base, size)
    tagb, _ = text_paths([(tag, BLUE if key == "braun" else (WHITE if key == "weiss" else BROWN if key in ("hell", "hellblau") else INK))], (W - w_tag) / 2, base + 46 + ts * CAP, ts, tracking=0.22)
    save(f"slogan-{key}", W, H, body + tagb, bg)

# ---------- 4. Kurzform d&n ----------
size = 200
for key, (fg, amp, bg) in SCHEMES.items():
    w = measure("d&n", size, -0.04)
    W, H = w + 2 * pad, size * 1.1 + 2 * pad * 0.6
    body, _ = text_paths([("d", fg), ("&", amp), ("n", fg)], pad, H / 2 + size * CAP / 2, size, -0.04)
    save(f"kurz-dn-{key}", W, H, body, bg)

# ---------- 5. Icons (quadratisch, Profilbild / Favicon) ----------
ICONS = {
    "braun": (BROWN, BLUE, WHITE),       # Fläche, &, Buchstaben
    "hellblau": (BLUE, BROWN, BROWN),
    "weiss": (WHITE, BROWN, INK),
}
S = 1000
for key, (bg, amp, fg) in ICONS.items():
    # nur das &
    size = 640
    w = measure("&", size, 0)
    body, _ = text_paths([("&", amp)], (S - w) / 2, S / 2 + size * CAP / 2, size, 0)
    save(f"icon-amp-{key}", S, S, f'<circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="{bg}"/>' + body)
    # d&n im Kreis
    size = 360
    w = measure("d&n", size, -0.04)
    body, _ = text_paths([("d", fg), ("&", amp), ("n", fg)], (S - w) / 2, S / 2 + size * CAP / 2, size, -0.04)
    save(f"icon-dn-{key}", S, S, f'<circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="{bg}"/>' + body)

print("Logos gespeichert in", os.path.abspath(OUT))
