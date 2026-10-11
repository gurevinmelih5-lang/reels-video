// Dinamik stil geçişleri. Kısa (6 kare) ve hareket bulanıklıklı: göz kesmeyi "atlama" değil "hız" olarak okur.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type NoProps = Record<string, never>;

// Whip pan: kamera hızla sağa savrulmuş gibi; ortada en bulanık
const Whip: React.FC<TransitionPresentationComponentProps<NoProps>> = ({children, presentationDirection, presentationProgress: p}) => {
  const x = presentationDirection === 'exiting' ? -p * 100 : 100 - p * 100;
  const blur = Math.sin(p * Math.PI) * 28;
  return <AbsoluteFill style={{transform: `translateX(${x}%)`, filter: `blur(${blur.toFixed(1)}px)`}}>{children}</AbsoluteFill>;
};

// Zoom punch: yeni kare içeri doğru "çarparak" gelir, eski kare hafifçe büyüyüp kaybolur
const ZoomPunch: React.FC<TransitionPresentationComponentProps<NoProps>> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 + p * 0.25})`, opacity: 1 - p, filter: `blur(${(p * 12).toFixed(1)}px)`}}>{children}</AbsoluteFill>;
  }
  return <AbsoluteFill style={{transform: `scale(${1.3 - p * 0.3})`, opacity: Math.min(1, p * 1.6)}}>{children}</AbsoluteFill>;
};

export const whip = (): TransitionPresentation<NoProps> => ({component: Whip, props: {}});
export const zoomPunch = (): TransitionPresentation<NoProps> => ({component: ZoomPunch, props: {}});
