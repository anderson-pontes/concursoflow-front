/**
 * Gera WebP de runtime a partir dos SVGs-fonte (PNG embutido).
 * SVGs em src/assets/*.svg permanecem como fonte de design — não importados no app.
 * Uso: npm run optimize:brand-assets
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "../src/assets");
const brandDir = path.join(assetsDir, "brand");

/** brand-600 — #7C3AED */
const LOGO_RGB = { r: 124, g: 58, b: 237 };

function extractPngFromSvg(svgPath) {
  const content = fs.readFileSync(svgPath, "utf8");
  const match = content.match(/data:image\/png;base64,([^"']+)/);
  if (!match) throw new Error(`Sem PNG embutido em ${svgPath}`);
  return Buffer.from(match[1], "base64");
}

/** Máscara grayscale → roxo brand com alpha (sidebar/login mobile). */
async function logoMaskToBrandWebp(pngBuffer, outPath, width) {
  const { data, info } = await sharp(pngBuffer)
    .resize({ width, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  const rgba = Buffer.alloc(w * h * 4);

  for (let i = 0; i < w * h; i++) {
    const lum = data[i];
    const o = i * 4;
    if (lum > 40) {
      rgba[o] = LOGO_RGB.r;
      rgba[o + 1] = LOGO_RGB.g;
      rgba[o + 2] = LOGO_RGB.b;
      rgba[o + 3] = Math.min(255, Math.round((lum / 255) * 255));
    }
  }

  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, effort: 4, alphaQuality: 100 })
    .toFile(outPath);
}

async function mascoteToTransparentWebp(pngBuffer, outPath, { height }) {
  const { data, info } = await sharp(pngBuffer)
    .resize({ height, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels } = info;
  const rgba = Buffer.alloc(w * h * 4);

  for (let i = 0; i < w * h; i++) {
    const base = i * channels;
    const r = data[base];
    const g = channels > 1 ? data[base + 1] : r;
    const b = channels > 2 ? data[base + 2] : r;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const o = i * 4;
    if (lum > 28) {
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = Math.min(255, Math.round(((lum - 28) / (255 - 28)) * 255));
    }
  }

  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 85, effort: 4, alphaQuality: 100 })
    .toFile(outPath);
}

fs.mkdirSync(brandDir, { recursive: true });

const logoSvg = path.join(assetsDir, "logo2.svg");
const logoOut = path.join(brandDir, "logo2.webp");
await logoMaskToBrandWebp(extractPngFromSvg(logoSvg), logoOut, 440);
console.log(`logo2.svg → brand/logo2.webp (${(fs.statSync(logoOut).size / 1024).toFixed(1)} KB)`);

const aprovinhoSvg = path.join(assetsDir, "aprovinho.svg");
const aprovinhoOut = path.join(brandDir, "aprovinho.webp");
const aprovinhoTmp = path.join(os.tmpdir(), "aprovingo-aprovinho-tmp.png");
fs.writeFileSync(aprovinhoTmp, extractPngFromSvg(aprovinhoSvg));
await mascoteToTransparentWebp(fs.readFileSync(aprovinhoTmp), aprovinhoOut, { height: 360 });
fs.unlinkSync(aprovinhoTmp);
console.log(`aprovinho.svg → brand/aprovinho.webp (${(fs.statSync(aprovinhoOut).size / 1024).toFixed(1)} KB)`);
