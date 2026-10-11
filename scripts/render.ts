// Kullanım:
//   npm run storyboard -- jobs/<iş>    → her sahneden bir kare, tek görselde (ucuz onay adımı)
//   npm run render -- jobs/<iş>        → MP4 + otomatik kalite kontrol
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import os from 'node:os';
import sharp from 'sharp';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {AUDIO_EXT, IMAGE_EXT, VIDEO_EXT, brandSchema, planSchema} from '../src/schema.ts';
import type {Brand, Plan, ReelProps} from '../src/schema.ts';
import {computeTimeline} from '../src/timeline.ts';
import {runQa} from './qa.ts';

const ROOT = path.resolve(import.meta.dirname, '..');

const fail = (msg: string): never => {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
};

const readJson = (file: string) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fail(`${path.relative(ROOT, file)} okunamadı: ${(e as Error).message}`);
  }
};

const formatZod = (issues: {path: (string | number)[]; message: string}[]) =>
  issues.map((i) => `  - ${i.path.join('.') || '(kök)'}: ${i.message}`).join('\n');

const probeDuration = (file: string) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const probeSize = (file: string) => {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim();
  const [w, h] = out.split(',').map(Number);
  return {w, h};
};

// Telefon videoları (HEVC, değişken kare hızı, B-frame) tarayıcıda/compositor'da kare kaçırabiliyor.
// Her videoyu tek tip H.264 / 30 fps / B-frame'siz / sessiz hale getiriyoruz; sonuç içerik hash'iyle önbellekte.
const NORMALIZE_VERSION = 'v1';
const normalizeVideo = (abs: string) => {
  const hash = crypto.createHash('sha1').update(NORMALIZE_VERSION).update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
  const cached = path.join(ROOT, '.cache', 'video', `${hash}.mp4`);
  if (fs.existsSync(cached)) return {file: cached, cached: true};
  fs.mkdirSync(path.dirname(cached), {recursive: true});
  const tmp = `${cached}.tmp.mp4`;
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', abs,
    '-an',
    // uzun kenar en fazla 1920, çift piksel; sabit 30 fps
    '-vf', "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',fps=30,format=yuv420p",
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-bf', '0', '-g', '30',
    '-movflags', '+faststart', tmp,
  ]);
  fs.renameSync(tmp, cached);
  return {file: cached, cached: false};
};

// Fotoğraf makinesi JPG'leri 18-24 MP: Chrome her birini ~70 MB açar, 6 GB RAM'de render çöker.
// EXIF yönünü uygula (dikey çekilmiş ama yan saklanmış kareler) ve 9:16'yı %10 zoom payıyla
// dolduracak boyuta küçült. Sonuç içerik hash'iyle önbellekte.
const IMAGE_TARGET = {width: Math.round(1080 * 1.1), height: Math.round(1920 * 1.1)};
const normalizeImage = async (abs: string) => {
  const hash = crypto.createHash('sha1').update(`img-v1-${IMAGE_TARGET.width}x${IMAGE_TARGET.height}`).update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
  const ext = path.extname(abs).toLowerCase() === '.png' ? '.png' : '.jpg';
  const cached = path.join(ROOT, '.cache', 'image', `${hash}${ext}`);
  if (fs.existsSync(cached)) return {file: cached, cached: true};
  fs.mkdirSync(path.dirname(cached), {recursive: true});
  const img = sharp(abs).rotate().resize({...IMAGE_TARGET, fit: 'outside', withoutEnlargement: true});
  await (ext === '.png' ? img.png() : img.jpeg({quality: 90, mozjpeg: true})).toFile(cached);
  return {file: cached, cached: false};
};

// Plan içindeki her dosya yolu iş klasörünün içinde kalmalı, var olmalı ve türü uygun olmalı.
const resolveAsset = (dir: string, rel: string, allowed: string[], warnings: string[]) => {
  const abs = path.resolve(dir, rel);
  if (!abs.startsWith(dir + path.sep)) fail(`${rel}: iş klasörünün dışına çıkıyor`);
  if (!fs.existsSync(abs)) fail(`${rel}: dosya bulunamadı`);
  const ext = path.extname(abs).toLowerCase();
  if (!allowed.includes(ext)) fail(`${rel}: desteklenmeyen tür (${ext})`);
  if (IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext)) {
    const {w, h} = probeSize(abs);
    if (Math.min(w, h) < 720) warnings.push(`${rel}: düşük çözünürlük (${w}×${h}), 1080×1920'de yumuşak görünebilir`);
  }
  return abs;
};

const main = async () => {
  const args = process.argv.slice(2);
  const storyboard = args.includes('--storyboard');
  const jobArg = args.find((a) => !a.startsWith('--'));
  if (!jobArg) fail('İş klasörü verilmedi. Örnek: npm run render -- jobs/demo-kuafor');
  const jobDir = path.resolve(ROOT, jobArg!);

  // 1. Doğrulama
  const planParse = planSchema.safeParse(readJson(path.join(jobDir, 'plan.json')));
  if (!planParse.success) fail(`plan.json geçersiz:\n${formatZod(planParse.error.issues)}`);
  const plan: Plan = planParse.data!;

  const brandDir = path.join(ROOT, 'brands', plan.brand);
  const brandParse = brandSchema.safeParse(readJson(path.join(brandDir, 'brand.json')));
  if (!brandParse.success) fail(`brands/${plan.brand}/brand.json geçersiz:\n${formatZod(brandParse.error.issues)}`);
  const brand: Brand = brandParse.data!;

  const warnings: string[] = [];
  const assets = new Map<string, string>(); // göreli → mutlak
  const add = (rel: string, allowed: string[]) => assets.set(rel, resolveAsset(jobDir, rel, allowed, warnings));

  plan.scenes.forEach((scene, i) => {
    if (scene.type === 'media') {
      add(scene.src, [...IMAGE_EXT, ...VIDEO_EXT]);
      if (VIDEO_EXT.includes(path.extname(scene.src).toLowerCase())) {
        const len = probeDuration(assets.get(scene.src)!);
        if (len < scene.videoStart + scene.duration) {
          fail(`sahne ${i + 1}: ${scene.src} ${len.toFixed(1)} sn, ama ${scene.videoStart}+${scene.duration} sn isteniyor`);
        }
      }
    }
    if (scene.type === 'montage') {
      for (const item of scene.items) add(item.src, IMAGE_EXT);
      const perItem = scene.duration / scene.items.length;
      if (perItem < 0.2) warnings.push(`sahne ${i + 1}: montaj karesi başına ${perItem.toFixed(2)} sn, gözle seçilemeyebilir`);
    }
    if (scene.type === 'cta' && scene.background) add(scene.background, IMAGE_EXT);
    if (scene.type === 'split') {
      add(scene.top, IMAGE_EXT);
      add(scene.bottom, IMAGE_EXT);
    }
    if (scene.type === 'cta' && scene.showLogo && !brand.logo) warnings.push(`sahne ${i + 1}: logo isteniyor ama markada logo yok`);
    if (scene.type === 'cta') {
      for (const key of scene.contact) if (!brand.contact[key]) warnings.push(`sahne ${i + 1}: markada ${key} bilgisi yok, gösterilmeyecek`);
    }
  });
  if (plan.music) add(plan.music.src, AUDIO_EXT);

  let logoAbs: string | null = null;
  if (brand.logo) {
    logoAbs = path.resolve(brandDir, brand.logo);
    if (!logoAbs.startsWith(brandDir + path.sep) || !fs.existsSync(logoAbs)) fail(`marka logosu bulunamadı: ${brand.logo}`);
  }

  const timeline = computeTimeline(plan);
  console.log(`✔ Plan geçerli: ${plan.scenes.length} sahne, ${timeline.totalSec.toFixed(2)} sn`);
  warnings.forEach((w) => console.log(`⚠ ${w}`));

  // 2. Dosyaları public/ altına kopyala (Remotion sadece oradan okur)
  const base = `render/${plan.id}`;
  fs.rmSync(path.join(ROOT, 'public', 'render'), {recursive: true, force: true});
  for (const [rel, abs] of assets) {
    const dest = path.join(ROOT, 'public', base, 'job', rel);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    if (VIDEO_EXT.includes(path.extname(abs).toLowerCase())) {
      const {file, cached} = normalizeVideo(abs);
      console.log(`✔ Video hazır: ${rel}${cached ? ' (önbellekten)' : ' (dönüştürüldü)'}`);
      fs.copyFileSync(file, dest);
    } else if (IMAGE_EXT.includes(path.extname(abs).toLowerCase())) {
      const {file} = await normalizeImage(abs);
      fs.copyFileSync(file, dest);
    } else {
      fs.copyFileSync(abs, dest);
    }
  }
  if (logoAbs) {
    const dest = path.join(ROOT, 'public', base, 'brand', brand.logo!);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(logoAbs, dest);
  }

  // 3. Paketle ve kompozisyonu seç
  const outDir = path.join(ROOT, 'out', plan.id);
  fs.mkdirSync(outDir, {recursive: true});
  process.stdout.write('… paketleniyor');
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
  console.log(' ✔');
  const inputProps: ReelProps = {plan, brand, base};
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps});

  if (storyboard) {
    // Her sahnede yazı animasyonu bitmiş bir kare: başlangıç + %70
    const frames: string[] = [];
    for (const [i, s] of timeline.scenes.entries()) {
      const frame = s.start + Math.max(s.transitionIn, Math.round(s.frames * 0.7));
      const file = path.join(outDir, `scene-${i + 1}.jpg`);
      await renderStill({composition, serveUrl, output: file, frame, inputProps, imageFormat: 'jpeg', jpegQuality: 85});
      frames.push(file);
    }
    const sheet = path.join(outDir, 'storyboard.jpg');
    const inputs = frames.flatMap((f) => ['-i', f]);
    const filter = frames.map((_, i) => `[${i}:v]scale=360:640[s${i}]`).join(';') + ';' + frames.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${frames.length}`;
    execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-q:v', '3', sheet]);
    console.log(`✔ Storyboard: ${path.relative(ROOT, sheet)}`);
    return;
  }

  // 4. Render
  const output = path.join(outDir, `${plan.id}.mp4`);
  let last = -1;
  const t0 = Date.now();
  // Her paralel sekme ayrı bir Chrome sayfası (~400-600 MB). 6 GB RAM'li makinede 2 sekme güvenli.
  const ramGb = os.totalmem() / 1024 ** 3;
  const concurrency = ramGb <= 8 ? 2 : ramGb <= 16 ? 4 : 6;
  const attempt = (conc: number) =>
    renderMedia({
    composition,
    concurrency: conc,
    serveUrl,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709', // TV aralığı + doğru renk etiketi; yoksa yuvj420p (tam aralık) çıkıyor
    outputLocation: output,
    inputProps,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(`\r… render %${pct}`);
      }
    },
  });
  try {
    await attempt(concurrency);
  } catch (e) {
    // Çoğunlukla bellek sıkışması (kare önbelleği, Chrome sekmesi). Tek sekmeyle bir kez daha dene.
    const firstLine = String((e as Error).message ?? e).split('\n')[0];
    console.log(`\n⚠ Render çöktü (${firstLine.slice(0, 140)}). Tek sekmeyle yeniden deneniyor…`);
    last = -1;
    await attempt(1);
  }
  console.log(`\n✔ Render bitti (${((Date.now() - t0) / 1000).toFixed(0)} sn): ${path.relative(ROOT, output)}`);

  // 5. Kalite kontrol
  const report = runQa(output, {expectedSec: timeline.totalSec, expectAudio: Boolean(plan.music)});
  report.warnings.unshift(...warnings);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 2;
};

main().catch((e) => fail((e as Error).stack ?? String(e)));
