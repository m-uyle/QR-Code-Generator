import { PNG_DPI } from "../config/index.js";

function crc32(buf, offset, length) {
  let c = 0xff_ff_ff_ff;
  for (let i = 0; i < length; i += 1) {
    // biome-ignore lint/suspicious/noBitwiseOperators: CRC32 bitwise calculation
    c ^= buf[offset + i];
    for (let k = 0; k < 8; k += 1) {
      // biome-ignore lint/suspicious/noBitwiseOperators: CRC32 bitwise calculation
      c = (c >>> 1) ^ (-(c & 1) & 0xed_b8_83_20);
    }
  }
  // biome-ignore lint/suspicious/noBitwiseOperators: CRC32 bitwise calculation
  return (c ^ 0xff_ff_ff_ff) >>> 0;
}

export async function setPngDpi(blob, dpi = PNG_DPI) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (
    bytes.length < 8 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return blob;
  }

  const ppu = Math.round(dpi / 0.0254);
  const physChunk = new Uint8Array(21);
  const view = new DataView(physChunk.buffer);

  view.setUint32(0, 9);
  physChunk[4] = 0x70;
  physChunk[5] = 0x48;
  physChunk[6] = 0x59;
  physChunk[7] = 0x73;
  view.setUint32(8, ppu);
  view.setUint32(12, ppu);
  physChunk[16] = 1;

  const crc = crc32(physChunk, 4, 13);
  view.setUint32(17, crc);

  let pos = 8;
  const filteredChunks = [];
  filteredChunks.push(bytes.subarray(0, 8));

  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) {
      break;
    }
    const chunkView = new DataView(bytes.buffer, pos, 8);
    const length = chunkView.getUint32(0);
    const chunkType = String.fromCharCode(
      bytes[pos + 4],
      bytes[pos + 5],
      bytes[pos + 6],
      bytes[pos + 7]
    );
    const totalChunkLen = 12 + length;

    if (pos + totalChunkLen > bytes.length) {
      break;
    }

    if (chunkType === "IHDR") {
      filteredChunks.push(bytes.subarray(pos, pos + totalChunkLen));
      filteredChunks.push(physChunk);
    } else if (chunkType !== "pHYs") {
      filteredChunks.push(bytes.subarray(pos, pos + totalChunkLen));
    }

    pos += totalChunkLen;
  }

  const totalLength = filteredChunks.reduce((acc, cur) => acc + cur.length, 0);
  const resultBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of filteredChunks) {
    resultBytes.set(chunk, offset);
    offset += chunk.length;
  }

  return new Blob([resultBytes], { type: "image/png" });
}
