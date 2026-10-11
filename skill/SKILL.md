---
name: reels-video
description: Müşterinin fotoğraf ve videolarından markaya uygun, dinamik Instagram Reels videosu (1080x1920 MP4) üretir. Görselleri inceler, sahne planını (plan.json) yazar, storyboard'u gösterir, Remotion ile yerelde render eder ve kalite kontrolünden geçirir. Gerekirse Google Flow (Veo) için canlandırma promptları hazırlar. "Reels videosu yap", "bu fotoğraflardan video", "klasördeki görsellerle reels", "videoyu kurgula", "tanıtım videosu", "etkinlik videosu", "videoyu daha dinamik yap" dendiğinde veya kullanıcı bir müşteri klasörü verip video istediğinde kullan.
---

# Reels Video

Kullanıcı (ajans sahibi) bir müşteri klasörü ve kısa bir talimat verir. Sen o klasörden paylaşıma hazır bir Reels MP4'ü teslim edersin. **Planı sen yazarsın, render'ı kod yapar.** Kalite şablondan gelir; senin işin doğru kareyi, doğru sırayı ve doğru metni seçmek.

- Proje: bu reponun klonlandığı klasör (bu bilgisayarda `C:\Users\LENOVO\Desktop\reels-video-ajani\`; aşağıda `<proje>`). Remotion 4, Node 24, git deposu.
- Skill klasörü: `~/.claude/skills/reels-video/` (repodaki `skill/` klasörünün kopyası; aşağıda `<skill>`)
- Planın kuralları: `<proje>/src/schema.ts`. Plan yazmadan önce oku; alanlar ve sınırlar orada.
- Örnek plan (dinamik stil, onaylanmış): `<skill>/references/ornek-plan.json`

## 1. Girdileri incele

1. Kullanıcının klasörüne **dokunma**, sadece oku. Önce dosyaları listele.
2. Kontak sayfası çıkar ve **gözle bak** (Read):
   ```
   python -I <skill>/scripts/kontak.py "<müşteri klasörü>" <scratchpad>/kontak.jpg
   ```
   Script her dosyanın boyutunu, EXIF yönünü ve video süresini de yazdırır.
3. Videolar için saniye saniye kare şeridi al: `ffmpeg -i <video> -vf "fps=1,scale=-2:300,tile=8x2" -frames:v 1 <scratchpad>/x.jpg`. Kullanılabilir aralıkları not et.
4. Her kare için şunları not et:
   - Ne gösteriyor?
   - İçinde yazı veya pankart var mı?
   - Yüz ya da özne nerede? (kırpma `focus` değeri için)
   - Dikey mi, yatay mı?
   - **Başka bir firmanın logosu veya sponsor ekranı** var mı?
5. Klasörde bizim daha önce ürettiğimiz bir çıktı varsa (1080×1920, 15 sn civarı, rastgele adlı MP4), onu kaynak olarak kullanma ve kullanıcıya söyle.

## 2. İşi ve markayı kur

- İş klasörü: `<proje>/jobs/<slug>/`. Dosyaları buraya **kopyala**. Adında boşluk dışında özel karakter, örneğin `(1)`, olan dosyaları anlamlı adlarla yeniden adlandır (`masa-cicek.jpeg`, `fuaye-yuruyus.mp4`). Şema parantezi reddeder.
- Marka: `<proje>/brands/<slug>/brand.json` (ad, renkler, fontlar, logo, iletişim). `marka.md` varsa oradan al (bkz. `marka-kimligi` skill'i).
- **Marka bilgisi uydurma.** Kullanıcının vermediği telefon, Instagram, adres ya da logo yoksa o alan boş kalır. Instagram profilleri giriş istiyor; giriş yapma, kullanıcıdan iste.
- Müşteri dosyaları git'e girmez; `.gitignore` sadece `plan.json`'u alır.

## 3. Planı yaz

Varsayılanlar: `"style": "dynamic"`, 13–15 sn, ses yok (müziği kullanıcı Instagram'da ekler).

**Kullanıcının kalıcı tercihleri:**
- **Bölüm başlığı (`chapter`, "01 Sahne" gibi) kullanma.** Sadece alt yazı tarzı metin (`text`).
- "Sıradan slayt gösterisi" istemiyor. Fade'li, 2–3 saniyelik, yavaş sahneler yok.

**Dinamik kurgu kuralları:**
- **Hook (ilk 2 sn):** `montage` sahnesi, 6–8 kare × 0.25 sn, `punch` hareketi ve ortada kısa, vurgulu bir metin. İkinci sahne hook'un cümlesini tamamlar (`zoom_punch` geçişiyle).
- Sahneler 1.5–2.25 sn sürer. Süreleri **0.25 sn ızgarasına** oturt (120 BPM müziğe denk gelsin). Geçişler `whip`, açılış ve kapanış `zoom_punch`.
- Metin en fazla 4–5 kelime. Bir veya iki kelimeyi `*yıldız*` ile vurgula; altın kutuda çıkar. Her sahnede vurgu yapma.
- Metinler sadece **görünen gerçeklere** dayanır: pankarttaki tarih, şehir, etkinlik adı; karede görünen yemek veya müzik. "Bütün organizasyonu biz yaptık" gibi doğrulanmamış iddia yok.
- Hook bir sayı vaat ediyorsa ("15 saniyede") toplam süre ona uysun.
- Kapanış: `cta`, `background` olarak markanın en iyi karesi (bulanıklaşır), `headline` işletme adı, kısa bir CTA ve var olan iletişim bilgileri.
- Türkçe metinleri teslimden önce `stop-slop-tr` gözüyle kontrol et: klişe, "-mektedir", ünlem yok.

**Kare seçimi:**
- Hook ve metinli sahnelerde **içinde yazı/pankart olan kareleri kullanma**; yazılar birbirine biner.
- Sponsor ve başka marka logolarını kadraja alma. Videoda o saniyeleri atla (`videoStart`).
- Yatay fotoğraf 9:16'ya kırpılınca genişliğin yaklaşık üçte biri kalır. Özne kenarda kalıyorsa `focus.x` ile kaydır (örnek: üçlüden kemancı için `x: 0.82`).
- Düşük çözünürlüklü videoları (720 px altı) kısa tut; render uyarı verir.

## 4. Storyboard → onay → render

```
cd <proje>
npm run storyboard -- jobs/<slug>     # out/<id>/storyboard.jpg
npm run render -- jobs/<slug>         # out/<id>/<id>.mp4 + report.json
```

1. Storyboard'a **gözle bak**: yazı taşması, yüz kırpılması, okunabilirlik, metin-kare çakışması. Sorun varsa planı düzelt ve tekrarla.
2. Render sonrası MP4'ten kareler çek ve bak. Kalite kontrol raporunu geçmek yetmez:
   ```
   ffmpeg -i out/<id>/<id>.mp4 -vf "select='eq(n\,30)+eq(n\,120)+...',scale=270:480,tile=8x1" -frames:v 1 -update 1 out/<id>/kareler.jpg
   ```
3. Kalite kontrol hatası (`✖`) varsa teslim etme; nedenini bul.
4. MP4'ü `SendUserFile` ile gönder. Kısa bir özet ver: ne değişti, nelere bakmalı, hangi bilgiler eksik. Planı ve değişiklikleri git'e commit et.

Revizyonlarda sadece `plan.json`'u değiştir ve yeniden render et. Kod değişikliği gerekiyorsa (yeni efekt, yeni sahne tipi) önce `src/`'yi oku, `npx tsc --noEmit` ile kontrol et, demo işiyle (`jobs/demo-kuafor`) bozulmadığını doğrula.

## 5. Canlandırma (Google Flow / Veo)

Kullanıcının Google AI Pro üyeliği var. Flow kredisi ve Gemini uygulamasında günde yaklaşık 3 video hakkı içeriyor; API dahil değil. Klipleri **kullanıcı elle üretir**, sen seçer ve prompt yazarsın:

- Sadece **insansız detay kareleri** seç: yemek tabağı, çiçekli masa, kurulmuş masa, boş salon. İnsanlı karelerde yüz, el ve çalgı bozulur; gerçek kişileri reklamda canlandırmak izin sorunu da yaratır.
- Video başına 2–4 klip. Promptları İngilizce yaz: yavaş kamera hareketi + hafif doğal hareket + "keep ... exactly as they are" + "No people, no hands, no text" + "4 seconds, vertical 9:16". Kredi için Veo 3.1 Fast yeterli.
- Kullanıcıdan klipleri `canli-1.mp4`, `canli-2.mp4`… adıyla müşteri klasörüne atmasını iste. Gelince bozulma (eriyen çiçek, değişen yemek, kadraja giren el) ve köşe filigranı için kontrol et. Planda ilgili karenin yerine koy, hareketi `static` yap (klip zaten hareketli).

## Makine kısıtları

- 5.9 GB RAM. Render 40–80 sn sürer. **İki render'ı aynı anda çalıştırma.** Script paralel sekmeyi RAM'e göre 2'de tutar; çökerse tek sekmeyle kendisi yeniden dener.
- Büyük fotoğraf makinesi JPG'leri ve telefon videoları render öncesi otomatik olarak küçültülür, EXIF yönü düzeltilir, H.264/30fps'e çevrilir (`.cache/`). Bunları elle yapma.
- Geçici çalışma klasörlerinde (AppData altındaki sanal alan) `.exe` çalışmaz. Projeyi daima `<proje>` içinde çalıştır.
