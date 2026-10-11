// Plan ve marka şemaları. Claude'un ürettiği plan render'dan önce burada doğrulanır:
// sadece izin verilen hareketler, geçişler ve fontlar kabul edilir.
import {z} from 'zod';

export const MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'punch', 'static'] as const;
export const TRANSITIONS = ['cut', 'fade', 'slide_up', 'slide_left', 'wipe', 'whip', 'zoom_punch'] as const;
export const STYLES = ['calm', 'dynamic'] as const;
export const FONTS = ['Montserrat', 'Inter', 'Poppins', 'DM Sans', 'Playfair Display', 'DM Serif Display', 'Fraunces'] as const;

export const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
export const VIDEO_EXT = ['.mp4', '.mov', '.webm'];
export const AUDIO_EXT = ['.mp3', '.wav', '.m4a', '.aac'];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'renk #RRGGBB olmalı');

// İş klasörüne göre göreli yol. ".." ve mutlak yollar reddedilir.
const assetPath = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\p{L}\p{N}_\-. ]+(\/[\p{L}\p{N}_\-. ]+)*$/u, 'geçersiz dosya yolu')
  .refine((p) => !p.split('/').includes('..'), 'üst klasöre çıkılamaz');

export const brandSchema = z.object({
  name: z.string().min(1).max(40),
  colors: z.object({
    primary: hex,
    accent: hex,
    text: hex,
    background: hex,
  }),
  fonts: z.object({
    heading: z.enum(FONTS),
    body: z.enum(FONTS),
  }),
  logo: assetPath.optional(),
  contact: z
    .object({
      whatsapp: z.string().max(30),
      instagram: z.string().max(40),
      address: z.string().max(60),
    })
    .partial()
    .default({}),
});

// *yıldızlı* kelimeler vurgulanır; yıldızlar uzunluğa sayılmaz
export const stripMarks = (t: string) => t.replace(/\*/g, '');
const textBlock = z.object({
  text: z
    .string()
    .min(1)
    .max(70)
    .refine((t) => stripMarks(t).length <= 60, 'metin en fazla 60 karakter')
    .refine((t) => (t.match(/\*/g) ?? []).length % 2 === 0, 'vurgu yıldızları çift olmalı: *kelime*'),
  position: z.enum(['top', 'center', 'bottom']).default('bottom'),
});

const sceneBase = {
  duration: z.number().min(0.8).max(8),
  transition: z.enum(TRANSITIONS).default('fade'),
};

// Numaralı bölüm başlığı (01 Sahne, 02 Fuaye...). Numara sırayla otomatik verilir.
const chapter = z.string().min(1).max(18).optional();

const focus = z.object({x: z.number().min(0).max(1), y: z.number().min(0).max(1)}).default({x: 0.5, y: 0.5});

const mediaScene = z.object({
  type: z.literal('media'),
  ...sceneBase,
  src: assetPath,
  motion: z.enum(MOTIONS).default('zoom_in'),
  focus,
  label: z.string().max(20).optional(),
  chapter,
  text: textBlock.optional(),
  videoStart: z.number().min(0).default(0),
});

// Hızlı montaj: aynı sahnede art arda birkaç kare (hook ve enerji yükseltmek için)
const montageScene = z.object({
  type: z.literal('montage'),
  ...sceneBase,
  items: z
    .array(z.object({src: assetPath, focus}))
    .min(2)
    .max(10),
  motion: z.enum(MOTIONS).default('punch'),
  chapter,
  text: textBlock.optional(),
});

const splitScene = z.object({
  type: z.literal('split'),
  ...sceneBase,
  top: assetPath,
  bottom: assetPath,
  chapter,
  topLabel: z.string().max(20).default('Önce'),
  bottomLabel: z.string().max(20).default('Sonra'),
});

const ctaScene = z.object({
  type: z.literal('cta'),
  ...sceneBase,
  headline: z.string().min(1).max(40),
  cta: z.string().min(1).max(40),
  showLogo: z.boolean().default(true),
  background: assetPath.optional(), // bulanıklaştırılmış arka plan fotoğrafı
  contact: z.array(z.enum(['whatsapp', 'instagram', 'address'])).default([]),
});

export const sceneSchema = z.discriminatedUnion('type', [mediaScene, montageScene, splitScene, ctaScene]);

export const planSchema = z.object({
  version: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]{1,60}$/, 'id: küçük harf, rakam ve tire'),
  brand: z.string().regex(/^[a-z0-9-]{1,60}$/),
  fps: z.literal(30).default(30),
  style: z.enum(STYLES).default('calm'),
  music: z
    .object({
      src: assetPath,
      volume: z.number().min(0).max(1).default(0.6),
      start: z.number().min(0).default(0),
    })
    .optional(),
  scenes: z.array(sceneSchema).min(2).max(12),
});

export type Brand = z.infer<typeof brandSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type MediaScene = z.infer<typeof mediaScene>;
export type MontageScene = z.infer<typeof montageScene>;
export type Style = (typeof STYLES)[number];
export type SplitScene = z.infer<typeof splitScene>;
export type CtaScene = z.infer<typeof ctaScene>;

export type ReelProps = {
  plan: Plan;
  brand: Brand;
  // public/ altındaki kök: iş dosyaları `${base}/job/...`, marka dosyaları `${base}/brand/...`
  base: string;
};
