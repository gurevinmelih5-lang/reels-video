import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel.tsx';
import {computeTimeline} from './timeline.ts';
import type {ReelProps} from './schema.ts';

// Studio'da açıldığında boş görünmesin diye; gerçek render'da props scriptten gelir.
const placeholder: ReelProps = {
  base: 'render/studio',
  brand: {
    name: 'Örnek',
    colors: {primary: '#2B2B2B', accent: '#E8C07D', text: '#FFFFFF', background: '#111111'},
    fonts: {heading: 'Montserrat', body: 'Inter'},
    contact: {},
  },
  plan: {
    version: 1,
    id: 'studio',
    brand: 'ornek',
    fps: 30,
    style: 'calm',
    scenes: [
      {type: 'cta', duration: 3, transition: 'fade', headline: 'Önizleme', cta: 'Randevu al', showLogo: false, contact: []},
      {type: 'cta', duration: 3, transition: 'fade', headline: 'İkinci sahne', cta: 'Hemen ara', showLogo: false, contact: []},
    ],
  },
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1}
    defaultProps={placeholder}
    calculateMetadata={({props}) => ({durationInFrames: computeTimeline(props.plan).totalFrames, fps: props.plan.fps})}
  />
);
