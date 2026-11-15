/* Generates the Skin Aesthetics icon set from one vector source.
 * Run: node scripts/favicons.cjs   (outputs src/app/{icon.svg,favicon.ico,apple-icon.png} and public/icon-*.png) */
const sharp = require("sharp");
const fs = require("fs");

const ESPRESSO = "#633b2c";
const CREAM = "#fdf7ef";

// The clinic's leaf mark, drawn on a 64×64 canvas.
const LEAF = `<g fill="none" stroke="${CREAM}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(10.4 10.4) scale(1.8)"><path d="M12 2.5c4.6 3.4 6.3 8.4 3.4 13.2A4 4 0 0 1 12 17.8a4 4 0 0 1-3.4-2.1C5.7 10.9 7.4 5.9 12 2.5Z"/><path d="M12 7v14.5"/></g>`;

const rounded = (radius = 15) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="${ESPRESSO}"/>${LEAF}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${ESPRESSO}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)">${LEAF}</g></svg>`;

const ico = (buffers) => {
  const count = buffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let offset = 6 + 16 * count;
  const dirs = [];
  for (const { size, data } of buffers) {
    const d = Buffer.alloc(16);
    d[0] = size >= 256 ? 0 : size;
    d[1] = size >= 256 ? 0 : size;
    d[2] = 0;
    d[3] = 0;
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(data.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += data.length;
    dirs.push(d);
  }
  return Buffer.concat([header, ...dirs, ...buffers.map((b) => b.data)]);
};

(async () => {
  fs.writeFileSync("src/app/icon.svg", rounded() + "\n");
  const png = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

  fs.writeFileSync("src/app/apple-icon.png", await png(rounded(0), 180));
  fs.writeFileSync("public/icon-192.png", await png(rounded(), 192));
  fs.writeFileSync("public/icon-512.png", await png(rounded(), 512));
  fs.writeFileSync("public/icon-maskable-512.png", await png(maskable, 512));

  const sizes = [16, 32, 48];
  const buffers = [];
  for (const size of sizes) buffers.push({ size, data: await png(rounded(size <= 16 ? 4 : size <= 32 ? 7 : 11), size) });
  fs.writeFileSync("src/app/favicon.ico", ico(buffers));

  // Social-share card: the hero portrait cropped to 1200×630, warmed and darkened slightly.
  const og = await sharp("public/images/site/hero-poster.jpg")
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .modulate({ brightness: 0.82, saturation: 1.05 })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync("public/og.jpg", og);

  for (const f of ["src/app/favicon.ico", "src/app/apple-icon.png", "public/icon-192.png", "public/icon-512.png", "public/icon-maskable-512.png", "public/og.jpg"]) {
    console.log(f.padEnd(34), (fs.statSync(f).size / 1024).toFixed(1) + " KB");
  }
})();
