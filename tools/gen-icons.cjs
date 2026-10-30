// Run from the project root: npx -y -p sharp node /home/fred/.gemini/antigravity/brain/58bc6613-ee9f-49c5-8f23-345f95b97987/scratch/gen-icons.cjs
// (or: npm i --no-save sharp && node <this file>)
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const P = path.join(process.cwd(), 'public');
const bg = { r: 250, g: 247, b: 240, alpha: 1 }; // --ivory
(async () => {
  fs.mkdirSync(path.join(P, 'icons'), { recursive: true });
  const pad = async (size, inner, out) => {
    const logo = await sharp(path.join(P, 'logo.png'))
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(path.join(P, 'icons', out));
  };
  await pad(192, 168, 'icon-192.png');
  await pad(512, 448, 'icon-512.png');
  await pad(512, 330, 'maskable-512.png'); // logo within the 80% maskable safe zone
  await pad(180, 156, 'apple-touch-icon.png');
  console.log('icons written to public/icons');
})();
