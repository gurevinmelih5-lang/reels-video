// Görsel veya video: 9:16'ya "cover" kırpma + Ken Burns hareketi.
// focus, kırpmada öznenin (yüz, köpek, ürün) kadrajda kalmasını sağlar.
import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
// OffthreadVideo düşük RAM'de kare önbelleğinden kare kaybediyordu; bu bileşen WebCodecs ile çözüyor.
import {Video} from '@remotion/media';
import {VIDEO_EXT} from '../schema.ts';
import type {MOTIONS} from '../schema.ts';

type Props = {
  src: string; // public/ altındaki yol
  motion: (typeof MOTIONS)[number];
  focus: {x: number; y: number};
  videoStart?: number;
  durationInFrames: number;
};

const isVideo = (src: string) => VIDEO_EXT.some((ext) => src.toLowerCase().endsWith(ext));

export const Media: React.FC<Props> = ({src, motion, focus, videoStart = 0, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  // Hafif tutuyoruz: %8 zoom, %4 kaydırma. Fazlası ucuz durur.
  let scale = 1.08;
  let x = 0;
  let y = 0;
  if (motion === 'zoom_in') scale = 1 + 0.08 * t;
  if (motion === 'zoom_out') scale = 1.08 - 0.08 * t;
  if (motion === 'pan_left') x = interpolate(t, [0, 1], [2, -2]);
  if (motion === 'pan_right') x = interpolate(t, [0, 1], [-2, 2]);
  if (motion === 'pan_up') y = interpolate(t, [0, 1], [2, -2]);
  if (motion === 'static') scale = 1;
  if (motion === 'punch') {
    // Kesmede içeri "vurur" (ilk 10 kare), sonra yavaşça geri çekilir
    const hit = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
    scale = 1.18 - 0.1 * hit - 0.04 * t;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${focus.x * 100}% ${focus.y * 100}%`,
    transform: `translate(${x}%, ${y}%) scale(${scale})`,
    transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
  };

  const url = staticFile(src);
  // Video canvas'a çiziliyor, object-position uygulanmıyor: focus videoda sadece zoom merkezini belirler.
  return isVideo(src) ? (
    <div style={{position: 'absolute', inset: 0, transform: style.transform, transformOrigin: style.transformOrigin}}>
      <Video src={url} muted trimBefore={Math.round(videoStart * fps)} objectFit="cover" style={{width: '100%', height: '100%'}} />
    </div>
  ) : (
    <Img src={url} style={style} />
  );
};
