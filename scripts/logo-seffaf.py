# Beyaz/açık zeminli logoyu şeffaf PNG'ye çevirir ve kenar boşluğunu kırpar.
# Alfa mavi kanaldan hesaplanır: beyazda mavi ~255, altın/koyu renklerde düşük. Altın ve renkli logolar
# için temiz sonuç verir; zemini beyaz olmayan veya içinde beyaz öğe olan logolarda kullanma.
# Kullanım: python -I logo-seffaf.py <giriş> <çıkış.png> [eşik_alt=150] [eşik_üst=245]
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
lo = int(sys.argv[3]) if len(sys.argv) > 3 else 150
hi = int(sys.argv[4]) if len(sys.argv) > 4 else 245
im = Image.open(src).convert("RGB")
r, g, b = im.split()
# kanal üçü de açıksa zemin; en düşük kanal ne kadar koyuysa o kadar opak
px = im.load()
alpha = Image.new("L", im.size)
ap = alpha.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        m = min(px[x, y])
        ap[x, y] = 0 if m >= hi else 255 if m <= lo else int(255 * (hi - m) / (hi - lo))
out = im.convert("RGBA")
out.putalpha(alpha)
bbox = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
if bbox:
    pad = int(max(w, h) * 0.02)
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
    out = out.crop(bbox)
out.save(dst)
print(f"{dst}: {out.size[0]}x{out.size[1]}")
