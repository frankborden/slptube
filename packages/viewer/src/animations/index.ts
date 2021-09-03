import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';

// @ts-ignore
import foxAnimationsUrl from './zips/fox.zip';
// @ts-ignore
import falcoAnimationsUrl from './zips/falco.zip';
// @ts-ignore
import captainFalconAnimationsUrl from './zips/captainFalcon.zip';
// @ts-ignore
import jigglypuffAnimationsUrl from './zips/jigglypuff.zip';
// @ts-ignore
import marthAnimationsUrl from './zips/marth.zip';
// @ts-ignore
import peachAnimationsUrl from './zips/peach.zip';
// @ts-ignore
import pikachuAnimationsUrl from './zips/pikachu.zip';
// @ts-ignore
import sheikAnimationsUrl from './zips/sheik.zip';
// @ts-ignore
import samusAnimationsUrl from './zips/samus.zip';
// @ts-ignore
import luigiAnimationsUrl from './zips/luigi.zip';
// @ts-ignore
import marioAnimationsUrl from './zips/mario.zip';
// @ts-ignore
import doctorMarioAnimationsUrl from './zips/doctorMario.zip';
import { characterNamesById } from '../common';
export { isOneIndexed } from './oneIndexed';
export { animationNameByActionId } from './actions';

const animationsCache = new Map<number, CharacterAnimations>();

export type AnimationFrames = string[];
export type CharacterAnimations = { [actionName: string]: AnimationFrames };

export const fetchAnimations = async (
  charId: number,
): Promise<CharacterAnimations> => {
  if (animationsCache.has(charId)) {
    return animationsCache.get(charId)!;
  }
  const animations = await importAnimation(charId);
  animationsCache.set(charId, animations);
  return animations;
};

const importAnimation = async (
  charId: number,
): Promise<CharacterAnimations> => {
  switch (characterNamesById[charId]) {
    case 'Sheik':
      return load(sheikAnimationsUrl);
    case 'Peach':
      return load(peachAnimationsUrl);
    case 'Fox':
      return load(foxAnimationsUrl);
    case 'Falco':
      return load(falcoAnimationsUrl);
    case 'Captain Falcon':
      return load(captainFalconAnimationsUrl);
    case 'Marth':
      return load(marthAnimationsUrl);
    case 'Jigglypuff':
      return load(jigglypuffAnimationsUrl);
    case 'Pikachu':
      return load(pikachuAnimationsUrl);
    case 'Samus':
      return load(samusAnimationsUrl);
    case 'Luigi':
      return load(luigiAnimationsUrl);
    case 'Mario':
      return load(marioAnimationsUrl);
    case 'Dr. Mario':
      return load(doctorMarioAnimationsUrl);
    default:
      throw new Error(`Unsupported character id: ${charId}`);
  }
};

const load = async (url: string): Promise<CharacterAnimations> => {
  const animations: CharacterAnimations = {};
  const response = await fetch(url);
  const animationsZip = await response.blob();
  const reader = new ZipReader(new BlobReader(animationsZip));
  const files = await reader.getEntries();
  await Promise.all(
    files.map(async (file) => {
      const animationName = file.filename.replace('.json', '');
      const contents = await file.getData?.(new TextWriter());
      const animationData = JSON.parse(contents);
      animations[animationName] = animationData;
    }),
  );
  return animations;
};
