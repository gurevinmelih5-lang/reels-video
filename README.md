# reels-video — Claude Code skill

Müşteri fotoğraf ve videolarından dinamik Instagram Reels (1080×1920 MP4) kurgulayan bir [Claude Code](https://claude.com/claude-code) skill'i. Claude görselleri inceler, sahne planını (`plan.json`) yazar, storyboard ile onay alır, render eder ve kalite kontrolünden geçirir. Gerektiğinde Google Flow (Veo) için canlandırma promptları hazırlar.

- `SKILL.md`: iş akışı ve kurallar
- `scripts/kontak.py`: klasördeki fotoğraf ve videoları tek sayfada gösterir (EXIF yönü, boyut, süre)
- `scripts/logo-seffaf.py`: beyaz zeminli logoyu şeffaf PNG'ye çevirir
- `references/ornek-plan.json`: onaylanmış örnek plan (dinamik stil)

Render motoru (Remotion projesi) bu repoda yok; skill onu yerel bir klasörde bekler (`SKILL.md` → Proje).

## Kurulum

```bash
git clone https://github.com/gurevinmelih5-lang/reels-video.git ~/.claude/skills/reels-video
```
