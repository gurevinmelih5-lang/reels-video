// Sadece şemadaki fontlar yüklenir; latin-ext alt kümesi Türkçe karakterler (ğ, ş, ı, İ) için şart.
import {loadFont as montserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as inter} from '@remotion/google-fonts/Inter';
import {loadFont as poppins} from '@remotion/google-fonts/Poppins';
import {loadFont as dmSans} from '@remotion/google-fonts/DMSans';
import {loadFont as playfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as dmSerif} from '@remotion/google-fonts/DMSerifDisplay';
import {loadFont as fraunces} from '@remotion/google-fonts/Fraunces';
import type {FONTS} from './schema.ts';

type FontName = (typeof FONTS)[number];

type Loaded = {fontFamily: string; waitUntilDone: () => Promise<unknown>};

const loaders: Record<FontName, () => Loaded> = {
  Montserrat: () => montserrat('normal', {weights: ['500', '700', '800'], subsets: ['latin', 'latin-ext']}),
  Inter: () => inter('normal', {weights: ['500', '700', '800'], subsets: ['latin', 'latin-ext']}),
  Poppins: () => poppins('normal', {weights: ['500', '700', '800'], subsets: ['latin', 'latin-ext']}),
  'DM Sans': () => dmSans('normal', {weights: ['500', '700'], subsets: ['latin', 'latin-ext']}),
  'Playfair Display': () => playfair('normal', {weights: ['600', '800'], subsets: ['latin', 'latin-ext']}),
  'DM Serif Display': () => dmSerif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']}),
  Fraunces: () => fraunces('normal', {weights: ['600', '800'], subsets: ['latin', 'latin-ext']}),
};

const cache = new Map<FontName, Loaded>();
const load = (name: FontName) => {
  if (!cache.has(name)) cache.set(name, loaders[name]());
  return cache.get(name)!;
};

export const useFont = (name: FontName): string => load(name).fontFamily;

// Yazı ölçümü (fitText) doğru fontla yapılsın diye render, fontlar inene kadar bekletilir.
export const loadFonts = (names: FontName[]) => Promise.all(names.map((n) => load(n).waitUntilDone()));

// Tek ağırlıklı serif fontlar 800 istenince sahte kalın görünmesin
export const headingWeight = (name: FontName) => (name === 'DM Serif Display' ? 400 : 800);

// Türkçe büyük harf: "istanbul" → "İSTANBUL" (toUpperCase "ISTANBUL" verir)
export const upperTr = (s: string) => s.toLocaleUpperCase('tr-TR');
