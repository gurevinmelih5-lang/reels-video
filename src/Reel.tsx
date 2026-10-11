import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, interpolate, staticFile, useVideoConfig} from 'remotion';
import {loadFonts} from './fonts.ts';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {whip, zoomPunch} from './transitions.tsx';
import {Fx} from './components/Fx.tsx';
import {MontageSceneView} from './scenes/MontageSceneView.tsx';
import {computeTimeline} from './timeline.ts';
import {MediaSceneView} from './scenes/MediaSceneView.tsx';
import {SplitSceneView} from './scenes/SplitSceneView.tsx';
import {CtaSceneView} from './scenes/CtaSceneView.tsx';
import type {ReelProps, Scene} from './schema.ts';

// 'cut' için geçiş elemanı hiç eklenmez (timeline'da transitionIn = 0)
type AnyPresentation = TransitionPresentation<Record<string, unknown>>;
const presentation = (t: Scene['transition']): AnyPresentation => {
  switch (t) {
    case 'slide_up':
      return slide({direction: 'from-bottom'}) as AnyPresentation;
    case 'slide_left':
      return slide({direction: 'from-right'}) as AnyPresentation;
    case 'wipe':
      return wipe({direction: 'from-left'}) as AnyPresentation;
    case 'whip':
      return whip() as unknown as AnyPresentation;
    case 'zoom_punch':
      return zoomPunch() as unknown as AnyPresentation;
    default:
      return fade() as AnyPresentation;
  }
};

export const Reel: React.FC<ReelProps> = ({plan, brand, base}) => {
  const {durationInFrames} = useVideoConfig();
  const timeline = computeTimeline(plan);
  const [fontsReady, setFontsReady] = useState(false);
  const [handle] = useState(() => delayRender('Marka fontları yükleniyor'));
  useEffect(() => {
    loadFonts([brand.fonts.heading, brand.fonts.body])
      .then(() => {
        setFontsReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [brand.fonts.heading, brand.fonts.body, handle]);

  if (!fontsReady) return null;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <TransitionSeries>
        {plan.scenes.map((scene, i) => {
          const {frames, transitionIn, chapter} = timeline.scenes[i];
          const view =
            scene.type === 'media' ? (
              <MediaSceneView scene={scene} brand={brand} base={base} durationInFrames={frames} style={plan.style} chapter={chapter} />
            ) : scene.type === 'montage' ? (
              <MontageSceneView scene={scene} brand={brand} base={base} durationInFrames={frames} style={plan.style} chapter={chapter} />
            ) : scene.type === 'split' ? (
              <SplitSceneView scene={scene} brand={brand} base={base} durationInFrames={frames} chapter={chapter} />
            ) : (
              <CtaSceneView scene={scene} brand={brand} base={base} style={plan.style} />
            );
          return (
            <React.Fragment key={i}>
              {transitionIn > 0 ? (
                <TransitionSeries.Transition presentation={presentation(scene.transition)} timing={linearTiming({durationInFrames: transitionIn})} />
              ) : null}
              <TransitionSeries.Sequence durationInFrames={frames}>{view}</TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {plan.style === 'dynamic' ? <Fx /> : null}
      {plan.music ? (
        <Audio
          src={staticFile(`${base}/job/${plan.music.src}`)}
          startFrom={Math.round(plan.music.start * plan.fps)}
          volume={(f) =>
            interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0, plan.music!.volume, plan.music!.volume, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
