import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Media} from '../components/Media.tsx';
import {Chapter, Label, Title, SAFE} from '../components/Text.tsx';
import {headingWeight, useFont} from '../fonts.ts';
import type {Brand, MediaScene, Style} from '../schema.ts';

type Props = {scene: MediaScene; brand: Brand; base: string; durationInFrames: number; style: Style; chapter: number | null};

export const MediaSceneView: React.FC<Props> = ({scene, brand, base, durationInFrames, style, chapter}) => {
  const heading = useFont(brand.fonts.heading);
  const chapterFont = useFont(brand.fonts.body);
  const body = useFont(brand.fonts.body);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Media
        src={`${base}/job/${scene.src}`}
        motion={scene.motion}
        focus={scene.focus}
        videoStart={scene.videoStart}
        durationInFrames={durationInFrames}
      />
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
        />
      ) : null}
      {chapter && scene.chapter ? <Chapter number={chapter} title={scene.chapter} fontFamily={chapterFont} accent={brand.colors.accent} /> : null}
      {scene.label && !scene.chapter ? (
        <Label
          text={scene.label}
          fontFamily={body}
          background={brand.colors.accent}
          color={brand.colors.background}
          style={{top: SAFE.top, left: SAFE.side}}
        />
      ) : null}
    </AbsoluteFill>
  );
};
