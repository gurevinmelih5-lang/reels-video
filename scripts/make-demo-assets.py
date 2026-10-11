# Demo iş için yer tutucu görseller üretir (gerçek müşteri fotoğrafı yerine).
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

job = Path(sys.argv[1]); brand = Path(sys.argv[2])
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 90)

def photo(name, size, c1, c2, label, blobs):
    w, h = size
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(c1, c2)))
    for (x, y, r, col) in blobs:
        d.ellipse([x * w - r, y * h - r, x * w + r, y * h + r], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(3))
    d = ImageDraw.Draw(img)
    d.text((w / 2, h / 2), label, font=font, fill=(255, 255, 255), anchor="mm")
    img.save(job / name, quality=92)

photo("onceki.jpg", (1200, 1600), (90, 85, 80), (50, 45, 40), "ÖNCE (test)", [(0.5, 0.55, 380, (120, 105, 90)), (0.3, 0.3, 120, (70, 60, 50))])
photo("sonraki.jpg", (1200, 1600), (245, 236, 220), (210, 190, 160), "SONRA (test)", [(0.5, 0.55, 360, (250, 245, 235)), (0.62, 0.35, 90, (230, 200, 150))])
photo("salon-yatay.jpg", (1920, 1080), (40, 60, 70), (20, 25, 30), "SALON yatay (test)", [(0.25, 0.6, 200, (200, 170, 120)), (0.75, 0.5, 260, (90, 120, 130))])

logo = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
d = ImageDraw.Draw(logo)
d.ellipse([20, 20, 580, 580], outline=(232, 192, 125, 255), width=24)
d.text((300, 300), "PK", font=ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 220), fill=(232, 192, 125, 255), anchor="mm")
logo.save(brand / "logo.png")
