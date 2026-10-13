import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';

const source = new URL('../src/assets/brand/clickedital-icon-source.png', import.meta.url);
const output = new URL('../public/', import.meta.url);
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(fileURLToPath(source)).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((data, index) => {
 const entry = 6 + index * 16;
 header[entry] = sizes[index]; header[entry + 1] = sizes[index];
 header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
 header.writeUInt32LE(data.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
 offset += data.length;
});
await writeFile(new URL('favicon.ico', output), Buffer.concat([header, ...images]));
for (const [name, size] of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) {
 await sharp(fileURLToPath(source)).resize(size,size).png().toFile(fileURLToPath(new URL(name, output)));
}
