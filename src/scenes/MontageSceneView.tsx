// Hızlı montaj: kareler sahne süresine eşit bölünür, her biri kesmeyle gelir.
// Yazı tüm sahne boyunca sabit kalır, kareler altında akar.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Media} from '../components/Media.tsx';
import {Chapter, Title} from '../components/Text.tsx';
import {headingWeight, useFont} from '../fonts.ts';
import type {Brand, MontageScene, Style} from '../schema.ts';

type Props = {scene: MontageScene; brand: Brand; base: string; durationInFrames: number; style: Style; chapter: number | null};

export const MontageSceneView: React.FC<Props> = ({scene, brand, base, durationInFrames, style, chapter}) => {
  const heading = useFont(brand.fonts.heading);
  const chapterFont = useFont(brand.fonts.body);
  const n = scene.items.length;
  const each = Math.floor(durationInFrames / n);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {scene.items.map((item, i) => {
        // son kare kalan tüm süreyi alır (yuvarlama artığı boşluk bırakmasın)
        const len = i === n - 1 ? durationInFrames - each * (n - 1) : each;
        return (
          <Sequence key={i} from={i * each} durationInFrames={len} layout="none">
            <AbsoluteFill>
              <Media src={`${base}/job/${item.src}`} motion={scene.motion} focus={item.focus} durationInFrames={len} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {scene.text ? (
        <Title
          text={scene.text.text}
          position={scene.text.position}
          fontFamily={heading}
          fontWeight={headingWeight(brand.fonts.heading)}
          color="#FFFFFF"
          accent={brand.colors.accent}
          accentText={brand.colors.background}
          style={style}
          delay={2}
        />
      ) : null}
      {chapter && scene.chapter ? <Chapter number={chapter} title={scene.chapter} fontFamily={chapterFont} accent={brand.colors.accent} /> : null}
    </AbsoluteFill>
  );
};
