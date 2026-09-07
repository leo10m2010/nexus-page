import sharp from 'sharp';
import { resolve } from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-mediakit-media.mjs <original-stream-art-directory>');

// Derived web previews only. Original production PNGs are never modified.
const scenes = [
  ['STREAM_carga.png', 'waiting'],
  ['STREAM_PICKS.png', 'draft'],
  ['STREAM_roster.png', 'roster'],
  ['STREAM_hud game.png', 'game'],
];
const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><radialGradient id="blue" cx="0" cy="0" r="1"><stop stop-color="#103862"/><stop offset="1" stop-color="#04101e"/></radialGradient><radialGradient id="gold" cx="1" cy="1" r="0.65"><stop stop-color="#ae7c32" stop-opacity=".13"/><stop offset="1" stop-color="#ae7c32" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#blue)"/><rect width="1600" height="900" fill="url(#gold)"/></svg>`);
for (const [file, scene] of scenes) {
  const output = resolve(`public/media/mediakit-${scene}.webp`);
  const artwork = await sharp(resolve(source, file)).resize({ width: 1600, height: 900, fit: 'contain' }).png().toBuffer();
  await sharp(background)
    .composite([{ input: artwork }])
    .webp({ quality: 88 })
    .toFile(output);
  console.log(output);
}
