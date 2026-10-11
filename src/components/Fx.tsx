// Dinamik stilin sinematik dokusu: hafif film grenı + kenar kararması.
// Gren her kare kaydırılır ki "canlı" dursun; opaklık düşük tutuldu, sıkıştırmada çamur yapmasın.
import React from 'react';
import {AbsoluteFill, random, staticFile, useCurrentFrame} from 'remotion';

export const Fx: React.FC = () => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('fx/grain.png')})`,
          backgroundPosition: `${x}px ${y}px`,
          backgroundSize: '512px 512px',
          mixBlendMode: 'overlay',
          opacity: 0.12,
        }}
      />
    </AbsoluteFill>
  );
};
