# Bir klasördeki fotoğrafları EXIF yönü düzeltilmiş küçük resimlerle tek sayfada gösterir,
# her dosyanın boyutunu ve yön bilgisini yazdırır. Videolar için her birinden 6 kare şeridi çıkarır.
# Kullanım: python -I kontak.py <klasör> <çıktı.jpg>
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

src, out = Path(sys.argv[1]), Path(sys.argv[2])
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
tiles = []
tmp = Path(tempfile.mkdtemp())
for p in sorted(src.iterdir()):
    ext = p.suffix.lower()
    if ext in (".jpg", ".jpeg", ".png", ".webp"):
        im = Image.open(p)
        orient = im.getexif().get(274, 1)
        raw = im.size
        im = ImageOps.exif_transpose(im)
        print(f"FOTO  {p.name}: {raw[0]}x{raw[1]} yön={orient} -> {im.size[0]}x{im.size[1]}")
    elif ext in (".mp4", ".mov", ".webm"):
        info = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,codec_name",
                               "-select_streams", "v:0", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout.split()
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                   capture_output=True, text=True).stdout.strip() or 0)
        print(f"VIDEO {p.name}: {' '.join(info)} süre={dur:.1f}s")
        strip = tmp / (p.stem + ".jpg")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(p), "-vf", f"fps=6/{max(dur, 0.1)},scale=-2:300,tile=6x1",
                        "-frames:v", "1", str(strip)], check=False)
        if not strip.exists():
            continue
        im = Image.open(strip)
    else:
        continue
    im.thumbnail((400, 400))
    c = Image.new("RGB", (400, 430), "white")
    c.paste(im, ((400 - im.width) // 2, (400 - im.height) // 2))
    ImageDraw.Draw(c).text((8, 408), p.name[:42], fill="black", font=font)
    tiles.append(c)
cols = 5
rows = max(1, (len(tiles) + cols - 1) // cols)
sheet = Image.new("RGB", (cols * 400, rows * 430), "white")
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 400, (i // cols) * 430))
sheet.save(out, quality=85)
print(f"kontak sayfası: {out}")
