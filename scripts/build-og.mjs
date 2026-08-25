/**
 * Builds the social share card: the brand field cropped to 1200x630 with the
 * primary lockup composited on top.
 *
 * white.svg is the right file here: it is the LOGO PRINCIPAL, drawn for dark
 * backgrounds, and the card is dark. normal.svg would disappear into it.
 *
 * Run with: npm run og
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";

const CARD = { width: 1200, height: 630 };
const LOGO_WIDTH = 520;
const MARGIN_X = 96;

const field = await sharp("src/assets/brand-field.png")
  .resize(CARD.width, CARD.height, { fit: "cover", position: "centre" })
  .toBuffer();

// Rasterise the SVG at 2x then downscale, so the wordmark edges stay crisp.
const logo = await sharp(readFileSync("public/logos/white.svg"), { density: 384 })
  .resize({ width: LOGO_WIDTH * 2 })
  .resize({ width: LOGO_WIDTH })
  .png()
  .toBuffer();

const { height: logoHeight } = await sharp(logo).metadata();

const out = await sharp(field)
  .composite([
    {
      input: logo,
      left: MARGIN_X,
      top: Math.round((CARD.height - (logoHeight ?? 0)) / 2),
    },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile("public/media/og-nexus-series.jpg");

console.log(
  `og-nexus-series.jpg  ${out.width}x${out.height}  ${Math.round(out.size / 1024)} KB  (logo ${LOGO_WIDTH}x${logoHeight})`,
);
