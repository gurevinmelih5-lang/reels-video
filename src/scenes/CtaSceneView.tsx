// Kapanış: (varsa) bulanık etkinlik fotoğrafı üstünde logo, işletme adı, CTA butonu ve iletişim.
// Her şey güvenli alanın ortasında.
import React from 'react';
import {fitText} from '@remotion/layout-utils';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Title, TEXT_WIDTH} from '../components/Text.tsx';
import {headingWeight, useFont} from '../fonts.ts';
import type {Brand, CtaScene, Style} from '../schema.ts';

type Props = {scene: CtaScene; brand: Brand; base: string; style: Style};

const CONTACT_PREFIX = {whatsapp: 'WhatsApp', instagram: '', address: ''} as const;

export const CtaSceneView: React.FC<Props> = ({scene, brand, base, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const heading = useFont(brand.fonts.heading);
  const body = useFont(brand.fonts.body);

  const logoIn = spring({frame, fps, config: {damping: 16, stiffness: 120}});
  const ctaIn = spring({frame: frame - 14, fps, config: {damping: 14, stiffness: 160}});
  const contactIn = interpolate(frame, [22, 32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ctaSize = Math.min(52, fitText({text: scene.cta, withinWidth: TEXT_WIDTH - 140, fontFamily: body, fontWeight: 700, validateFontIsLoaded: true}).fontSize);
  // Arka plan fotoğrafı sahne boyunca çok yavaş yaklaşır
  const bgScale = interpolate(frame, [0, 120], [1.15, 1.22], {extrapolateRight: 'clamp'});

  const contacts = scene.contact
    .map((key) => {
      const value = brand.contact[key];
      return value ? [CONTACT_PREFIX[key], value].filter(Boolean).join('  ') : null;
    })
    .filter((v): v is string => v !== null);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, ${brand.colors.primary} 0%, ${brand.colors.background} 75%)`}}>
      {scene.background ? (
        <>
          <Img
            src={staticFile(`${base}/job/${scene.background}`)}
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) saturate(1.1)', transform: `scale(${bgScale})`}}
          />
          <AbsoluteFill style={{background: `linear-gradient(180deg, ${brand.colors.background}99 0%, ${brand.colors.background}cc 55%, ${brand.colors.background}f2 100%)`}} />
        </>
      ) : null}
      {scene.showLogo && brand.logo ? (
        <Img
          src={staticFile(`${base}/brand/${brand.logo}`)}
          style={{
            position: 'absolute',
            top: 380,
            left: '50%',
            width: 280,
            height: 280,
            objectFit: 'contain',
            transform: `translateX(-50%) scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`,
            opacity: logoIn,
          }}
        />
      ) : null}
      <Title
        text={scene.headline}
        position="center"
        fontFamily={heading}
        fontWeight={headingWeight(brand.fonts.heading)}
        color={brand.colors.text}
        accent={brand.colors.accent}
        accentText={brand.colors.background}
        style={style}
        maxFontSize={style === 'dynamic' ? 96 : 88}
        delay={4}
        backdrop={false}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 470}}>
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: ctaSize,
            color: brand.colors.background,
            backgroundColor: brand.colors.accent,
            padding: '26px 70px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [30, 0])}px)`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          {scene.cta}
        </div>
        {contacts.map((line) => (
          <div key={line} style={{fontFamily: body, fontWeight: 500, fontSize: 38, color: brand.colors.text, opacity: contactIn * 0.85, marginTop: 28}}>
            {line}
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
