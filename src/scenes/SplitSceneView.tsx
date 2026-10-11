// Öncesi/sonrası: üst yarı "önce", alt yarı "sonra". Alt yarı biraz gecikmeli kayarak gelir
// ki göz önce üstü okusun.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Media} from '../components/Media.tsx';
import {Chapter, Label, SAFE} from '../components/Text.tsx';
import {useFont} from '../fonts.ts';
import type {Brand, SplitScene} from '../schema.ts';

type Props = {scene: SplitScene; brand: Brand; base: string; durationInFrames: number; chapter: number | null};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const SplitSceneView: React.FC<Props> = ({scene, brand, base, durationInFrames, chapter}) => {
  const frame = useCurrentFrame();
  const body = useFont(brand.fonts.body);
  const heading = useFont(brand.fonts.heading);
  const chapterFont = useFont(brand.fonts.body);
  const topX = interpolate(frame, [0, 16], [-100, 0], {extrapolateRight: 'clamp', easing: ease});
  const bottomX = interpolate(frame, [8, 24], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const half: React.CSSProperties = {position: 'absolute', left: 0, width: '100%', height: 960, overflow: 'hidden'};

  return (
    <AbsoluteFill style={{backgroundColor: brand.colors.background}}>
      <div style={{...half, top: 0, transform: `translateX(${topX}%)`}}>
        <Media src={`${base}/job/${scene.top}`} motion="zoom_in" focus={{x: 0.5, y: 0.5}} durationInFrames={durationInFrames} />
        <Label text={scene.topLabel} fontFamily={body} background="rgba(0,0,0,0.55)" color="#FFFFFF" style={scene.chapter ? {bottom: 48, left: SAFE.side} : {top: SAFE.top - 40, left: SAFE.side}} />
      </div>
      <div style={{...half, top: 960, transform: `translateX(${bottomX}%)`}}>
        <Media src={`${base}/job/${scene.bottom}`} motion="zoom_in" focus={{x: 0.5, y: 0.5}} durationInFrames={durationInFrames} />
        <Label
          text={scene.bottomLabel}
          fontFamily={body}
          background={brand.colors.accent}
          color={brand.colors.background}
          delay={14}
          style={{top: 48, left: SAFE.side}}
        />
      </div>
      {chapter && scene.chapter ? (
        // Bölüm başlığı varken "önce" etiketi üst yarının alt köşesine iner (çakışmasın)
        <Chapter number={chapter} title={scene.chapter} fontFamily={chapterFont} accent={brand.colors.accent} delay={18} />
      ) : null}
      <div style={{position: 'absolute', top: 957, left: 0, width: '100%', height: 6, backgroundColor: brand.colors.accent}} />
    </AbsoluteFill>
  );
};
