// Sahne sürelerini kareye çevirir. Hem Remotion kompozisyonu hem render/QA scripti kullanır.
import type {Plan, Scene} from './schema.ts';

// Hızlı geçişler kısa: whip/punch 0.2 sn, yumuşaklar 0.33-0.4 sn
export const TRANSITION_FRAMES: Record<Scene['transition'], number> = {
  cut: 0,
  whip: 6,
  zoom_punch: 6,
  slide_up: 10,
  slide_left: 10,
  fade: 12,
  wipe: 12,
};

export type SceneTiming = {
  start: number; // videodaki başlangıç karesi
  chapter: number | null; // bölüm numarası (1'den başlar)
  frames: number; // sahnenin kendi uzunluğu (geçiş örtüşmesi dahil)
  transitionIn: number; // önceki sahneyle örtüşen kare sayısı
};

export const computeTimeline = (plan: Plan) => {
  const fps = plan.fps;
  const scenes: SceneTiming[] = [];
  let cursor = 0;
  let chapterNo = 0;
  plan.scenes.forEach((scene, i) => {
    const frames = Math.round(scene.duration * fps);
    const transitionIn = i === 0 ? 0 : TRANSITION_FRAMES[scene.transition];
    const start = cursor - transitionIn;
    const chapter = 'chapter' in scene && scene.chapter ? ++chapterNo : null;
    scenes.push({start, frames, transitionIn, chapter});
    cursor = start + frames;
  });
  return {fps, scenes, totalFrames: cursor, totalSec: cursor / fps};
};
