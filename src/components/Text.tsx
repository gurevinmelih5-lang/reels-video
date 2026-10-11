// Ekrandaki yazılar. Instagram arayüzünün kapattığı alanlar (üst ~250px, alt ~400px)
// SAFE ile dışarıda bırakılır; yazı boyutu fitTextOnNLines ile kutuya sığacak şekilde küçülür.
import React from 'react';
import {fitTextOnNLines} from '@remotion/layout-utils';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {upperTr} from '../fonts.ts';
import type {Style} from '../schema.ts';

export const SAFE = {top: 260, bottom: 420, side: 80};
export const TEXT_WIDTH = 1080 - SAFE.side * 2;

// "*3 günü* geçti" → [{word:'3', hl:true}, {word:'günü', hl:true}, {word:'geçti', hl:false}]
const parseWords = (text: string) => {
  let on = false;
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const starts = raw.startsWith('*');
      const ends = raw.length > 1 && raw.endsWith('*');
      if (starts) on = true;
      const item = {word: raw.replace(/\*/g, ''), hl: on};
      if (ends || (starts && raw.length > 1 && raw.slice(1).includes('*'))) on = false;
      return item;
    });
};

type TitleProps = {
  text: string;
  position: 'top' | 'center' | 'bottom';
  fontFamily: string;
  fontWeight: number;
  color: string;
  accent: string;
  accentText: string;
  style?: Style;
  maxFontSize?: number;
  delay?: number;
  backdrop?: boolean; // fotoğraf üstünde okunabilirlik degradesi
};

export const Title: React.FC<TitleProps> = ({
  text,
  position,
  fontFamily,
  fontWeight,
  color,
  accent,
  accentText,
  style = 'calm',
  maxFontSize,
  delay = 4,
  backdrop = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dynamic = style === 'dynamic';
  const words = parseWords(dynamic ? upperTr(text) : text);
  const plain = words.map((w) => w.word).join(' ');
  const letterSpacing = dynamic ? '-0.01em' : '-0.02em';
  // Vurgu kutusunun yan boşlukları için genişlikten pay bırak
  const {fontSize, lines} = fitTextOnNLines({
    text: plain,
    maxLines: 3,
    maxBoxWidth: TEXT_WIDTH - (words.some((w) => w.hl) ? 60 : 0),
    fontFamily,
    fontWeight,
    maxFontSize: maxFontSize ?? (dynamic ? 112 : 104),
    letterSpacing,
    validateFontIsLoaded: true,
  });

  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  const gradient =
    position === 'top'
      ? 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 45%)'
      : position === 'bottom'
        ? 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 50%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0) 22%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 78%)';

  let wi = 0;
  return (
    <AbsoluteFill style={{background: backdrop ? gradient : undefined}}>
      <AbsoluteFill style={{justifyContent: justify, padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`}}>
        <div
          style={{
            fontFamily,
            fontWeight,
            fontSize,
            color,
            lineHeight: dynamic ? 1.12 : 1.08,
            letterSpacing,
            textAlign: position === 'center' ? 'center' : 'left',
          }}
        >
          {lines.map((line, li) => (
            <div key={li} style={{whiteSpace: 'nowrap'}}>
              {line.split(' ').map((_, j) => {
                const {word, hl} = words[wi];
                const nextHl = j < line.split(' ').length - 1 && words[wi + 1]?.hl;
                const i = wi++;
                // calm: yumuşak yükselme; dynamic: hafif taşmalı "pop", kelimeler 2 kare arayla
                const p = dynamic
                  ? spring({frame: frame - delay - i * 2, fps, config: {damping: 11, stiffness: 220, mass: 0.6}})
                  : spring({frame: frame - delay - i * 3, fps, config: {damping: 200}, durationInFrames: 18});
                const box = interpolate(frame - delay - i * 2 - 4, [0, 8], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                });
                const transform = dynamic
                  ? `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`
                  : `translateY(${interpolate(p, [0, 1], [28, 0])}px)`;
                return (
                  <React.Fragment key={j}>
                    {j > 0 ? ' ' : null}
                    <span
                      style={{
                        display: 'inline-block',
                        position: 'relative',
                        opacity: Math.min(1, p * 1.5),
                        transform,
                        transformOrigin: '50% 80%',
                        color: hl ? accentText : undefined,
                        textShadow: hl ? undefined : '0 2px 24px rgba(0,0,0,0.35)',
                        padding: hl ? '0 0.1em' : undefined,
                      }}
                    >
                      {hl ? (
                        <span
                          style={{
                            position: 'absolute',
                            // sonraki kelime de vurguluysa aradaki boşluğu da kapla → tek parça kutu
                            inset: `0.04em ${nextHl ? '-0.32em' : '-0.02em'} 0.02em -0.02em`,
                            background: accent,
                            borderRadius: '0.08em',
                            clipPath: `inset(0 ${(1 - box) * 100}% 0 0)`,
                            zIndex: -1,
                          }}
                        />
                      ) : null}
                      {word}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type LabelProps = {
  text: string;
  fontFamily: string;
  background: string;
  color: string;
  delay?: number;
  style?: React.CSSProperties;
};

export const Label: React.FC<LabelProps> = ({text, fontFamily, background, color, delay = 2, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 18, stiffness: 140}});
  return (
    <div
      style={{
        position: 'absolute',
        fontFamily,
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: '0.14em',
        padding: '16px 30px',
        borderRadius: 999,
        background,
        color,
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`,
        ...style,
      }}
    >
      {upperTr(text)}
    </div>
  );
};

type ChapterProps = {
  number: number;
  title: string;
  fontFamily: string;
  accent: string;
  delay?: number;
};

// "01 / SAHNE": izleyiciye bir dizi olduğunu ve sırada başka bölüm olduğunu söyler
export const Chapter: React.FC<ChapterProps> = ({number, title, fontFamily, accent, delay = 2}) => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const numIn = interpolate(frame - delay, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const titleIn = interpolate(frame - delay - 4, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const lineIn = interpolate(frame - delay - 2, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return (
    <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 32% at 0% 14%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', opacity: numIn}} />
    <div style={{position: 'absolute', top: SAFE.top - 20, left: SAFE.side, fontFamily, color: '#FFFFFF', textShadow: '0 2px 20px rgba(0,0,0,0.45)'}}>
      <div style={{overflow: 'hidden', height: 128}}>
        <div style={{fontSize: 120, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', color: accent, transform: `translateY(${(1 - numIn) * 110}%)`}}>
          {String(number).padStart(2, '0')}
        </div>
      </div>
      <div style={{width: 120 * lineIn, height: 4, background: '#FFFFFF', margin: '14px 0 16px'}} />
      <div style={{overflow: 'hidden'}}>
        <div style={{fontSize: 44, fontWeight: 700, letterSpacing: '0.18em', transform: `translateY(${(1 - titleIn) * 110}%)`}}>{upperTr(title)}</div>
      </div>
    </div>
    </>
  );
};
