// Teslim öncesi teknik kontroller. Hata = teslim edilmemeli, uyarı = gözle bak.
// Tek başına: node scripts/qa.ts out/<iş>/<iş>.mp4 15
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

type Options = {expectedSec: number; expectAudio: boolean};

export type QaReport = {
  file: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, string | number>;
  manualChecks: string[];
};

const ffmpegFilter = (file: string, filter: string) =>
  spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, ...filter.split(' '), '-f', 'null', '-'], {encoding: 'utf8'}).stderr;

export const runQa = (file: string, {expectedSec, expectAudio}: Options): QaReport => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
  const video = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'video');
  const audio = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'audio');
  const duration = Number(probe.format.duration);
  const sizeMb = fs.statSync(file).size / 1024 / 1024;
  const [num, den] = String(video?.r_frame_rate ?? '0/1').split('/').map(Number);
  const fps = num / den;

  if (!video) errors.push('Video akışı yok');
  else {
    if (video.codec_name !== 'h264') errors.push(`Codec ${video.codec_name}, h264 olmalı`);
    if (video.width !== 1080 || video.height !== 1920) errors.push(`Çözünürlük ${video.width}×${video.height}, 1080×1920 olmalı`);
    if (video.pix_fmt !== 'yuv420p') errors.push(`Piksel formatı ${video.pix_fmt}, yuv420p olmalı (bazı telefonlarda açılmaz)`);
    if (Math.abs(fps - 30) > 0.01) warnings.push(`Kare hızı ${fps.toFixed(2)}`);
  }
  if (Math.abs(duration - expectedSec) > 0.2) errors.push(`Süre ${duration.toFixed(2)} sn, plan ${expectedSec.toFixed(2)} sn`);
  if (duration > 90) warnings.push('90 sn üstü: Reels olarak önerilmez');
  if (sizeMb > 100) warnings.push(`Dosya büyük: ${sizeMb.toFixed(1)} MB`);

  // Siyah kare: 0.25 sn'den uzun tamamen karanlık bölüm
  const black = [...ffmpegFilter(file, '-vf blackdetect=d=0.25:pix_th=0.08 -an').matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)];
  black.forEach((m) => errors.push(`Siyah ekran: ${Number(m[1]).toFixed(2)}–${Number(m[2]).toFixed(2)} sn`));

  // Donma: 1.5 sn'den uzun hiç değişmeyen görüntü (Ken Burns varken olmamalı)
  const freeze = [...ffmpegFilter(file, '-vf freezedetect=n=0.001:d=1.5 -an').matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)];
  freeze.forEach((m) => warnings.push(`Donmuş görüntü: ${Number(m[1]).toFixed(2)} sn'den itibaren ${Number(m[2]).toFixed(2)} sn`));

  if (expectAudio) {
    if (!audio) errors.push('Müzik istendi ama ses akışı yok');
    else {
      const mean = Number(/mean_volume: (-?[\d.]+) dB/.exec(ffmpegFilter(file, '-af volumedetect -vn'))?.[1] ?? -91);
      if (mean < -45) errors.push(`Ses neredeyse sessiz (ortalama ${mean} dB)`);
      if (Math.abs(Number(audio.duration) - duration) > 0.2) warnings.push('Ses ve görüntü süreleri farklı');
    }
  } else if (!audio) {
    warnings.push('Ses yok (plan gereği). Müziği Instagram uygulamasında ekle.');
  }

  const report: QaReport = {
    file: path.basename(file),
    ok: errors.length === 0,
    errors,
    warnings,
    info: {duration: Number(duration.toFixed(2)), width: video?.width, height: video?.height, fps, sizeMb: Number(sizeMb.toFixed(1))},
    manualChecks: [
      'İlk 2 saniye durdurup kaydırmaya değer mi?',
      'Kırpmada özne (yüz/hayvan/ürün) kadrajın içinde mi?',
      'Yazılar telefonda rahat okunuyor mu, yeterince ekranda kalıyor mu?',
      'Marka adı, iletişim ve CTA doğru mu?',
    ],
  };

  console.log(`\n${report.ok ? '✔' : '✖'} Kalite kontrol: ${report.info.duration} sn, ${report.info.width}×${report.info.height}, ${report.info.sizeMb} MB`);
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log('  Gözle kontrol et:');
  report.manualChecks.forEach((c) => console.log(`   □ ${c}`));
  return report;
};

if (import.meta.filename === path.resolve(process.argv[1] ?? '')) {
  const [file, expected] = process.argv.slice(2);
  const r = runQa(file, {expectedSec: Number(expected), expectAudio: false});
  process.exitCode = r.ok ? 0 : 2;
}
