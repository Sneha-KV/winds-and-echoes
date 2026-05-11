import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const MAX_WIDTH = 2400;
const MAX_HEIGHT = 2400;
const QUALITY = 85;

/**
 * Process a single photo:
 * - Resize to max 2400px on longest edge
 * - Convert to WebP
 * - Strip EXIF (privacy)
 * - Extract metadata before stripping (GPS, gear — used as writing context)
 */
export async function processPhoto(inputPath) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Extract useful context before stripping
  const context = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    // EXIF data if present — camera model, lens, settings
    camera: metadata.exif ? parseExifContext(metadata.exif) : null,
  };

  // Process: resize + WebP + strip EXIF
  const filename = `${path.basename(inputPath, path.extname(inputPath))}.webp`;
  const outputPath = path.join(path.dirname(inputPath), 'processed', filename);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await image
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',        // maintain aspect ratio
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .withMetadata(false)    // strip all EXIF
    .toFile(outputPath);

  const stats = await fs.stat(outputPath);

  return {
    originalPath: inputPath,
    processedPath: outputPath,
    filename,
    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
    context,
  };
}

/**
 * Process multiple photos in parallel
 */
export async function processPhotos(inputPaths) {
  return Promise.all(inputPaths.map(processPhoto));
}

function parseExifContext(exifBuffer) {
  // Basic EXIF extraction for writing context
  // Expand this with the 'exif-reader' package if needed
  try {
    return exifBuffer.toString('utf8').substring(0, 200);
  } catch {
    return null;
  }
}
