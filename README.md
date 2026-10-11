# Reels Video Ajanı

Müşteri fotoğraf ve videolarından 1080×1920 Instagram Reels üreten sistem. Kurgu planını (JSON) Claude yazar; plan şemayla doğrulanır, [Remotion](https://www.remotion.dev/) ile yerelde render edilir ve otomatik kalite kontrolünden geçer. Render ücretsizdir, dış servis gerekmez.

## Kurulum

Gereken: Node 24+, FFmpeg (PATH'te), Python 3 + Pillow (sadece yardımcı scriptler için).

```bash
git clone https://github.com/gurevinmelih5-lang/reels-video.git
cd reels-video
npm install
npm run render -- jobs/demo-kuafor
```

Remotion ilk render'da Chrome Headless Shell'i bir kez indirir (~120 MB).

### Claude Code skill'i

`skill/` klasörü Claude Code için `reels-video` skill'idir. Kopyaladıktan sonra Claude Code'a "şu klasördeki fotoğraflardan Reels yap" demek yeterli:

```bash
cp -r skill ~/.claude/skills/reels-video
```

## Kullanım

```bash
npm run storyboard -- jobs/<iş>   # her sahneden bir kare → out/<iş>/storyboard.jpg (hızlı onay)
npm run render -- jobs/<iş>       # MP4 + kalite kontrol → out/<iş>/<iş>.mp4, report.json
npm run studio                    # Remotion Studio (şablon geliştirme)
```

Bir iş: `jobs/<iş>/plan.json` + müşteri dosyaları. Marka: `brands/<marka>/brand.json` (+ logo). Örnek için `jobs/demo-kuafor` ve `skill/references/ornek-plan.json`.

## Plan

`src/schema.ts` planın kurallarıdır. Sadece izin verilen hareket, geçiş ve fontlar kabul edilir; metin uzunlukları sınırlıdır; dosya yolları iş klasörünün dışına çıkamaz.

- **Stiller:** `calm` (yumuşak geçişler) ve `dynamic` (hızlı montaj, whip/zoom geçişleri, vurgulu kinetik yazı, film grenı)
- **Sahne tipleri:** `media` (fotoğraf/video), `montage` (art arda hızlı kareler), `split` (öncesi/sonrası), `cta` (kapanış)
- **Vurgu:** metinde `*kelime*` → altın kutulu vurgu
- **Kırpma:** `focus: {x, y}` ile 9:16 kırpmada öznenin yeri

## Ne otomatik yapılıyor

- Fotoğraflar EXIF yönüne göre düzeltilir ve 9:16 için küçültülür. Telefon videoları H.264 / 30 fps / B-frame'siz hale getirilir. Sonuçlar `.cache/` altında içerik hash'iyle saklanır.
- Yazılar ölçülerek güvenli alana sığdırılır. Instagram arayüzünün kapattığı üst ve alt bölgeler hesaba katılır.
- Kalite kontrol şunlara bakar: çözünürlük, codec, piksel formatı, süre, siyah ekran, donmuş görüntü, ses seviyesi.
- Render çökerse (düşük RAM) tek sekmeyle otomatik yeniden denenir. Paralel sekme sayısı RAM'e göre seçilir.

## Gizlilik

Müşteri işleri (`jobs/*`) ve markaları (`brands/*`) `.gitignore` ile repo dışında tutulur. Sadece sentetik demo örneği repodadır.
