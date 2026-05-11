import GhostAdminAPI from '@tryghost/admin-api';
import fs from 'fs/promises';

const ghost = new GhostAdminAPI({
  url: process.env.GHOST_URL,
  key: process.env.GHOST_ADMIN_API_KEY,
  version: 'v5.0',
});

/**
 * Upload a processed image to Ghost media library
 * Returns the Ghost image URL
 */
export async function uploadImage(photo) {
  const file = await fs.readFile(photo.processedPath);

  const uploaded = await ghost.images.upload({
    file: new Blob([file], { type: 'image/webp' }),
    name: photo.filename,
    ref: photo.filename,
  });

  return uploaded.url;
}

/**
 * Upload all photos and return a map of filename -> Ghost URL
 */
export async function uploadPhotos(photos) {
  const uploads = await Promise.all(
    photos.map(async (photo) => {
      const url = await uploadImage(photo);
      return { filename: photo.filename, url };
    })
  );

  return Object.fromEntries(uploads.map(u => [u.filename, u.url]));
}

/**
 * Create a Ghost draft post from pipeline output
 * Always creates as draft — author reviews before publishing
 */
export async function createDraft({
  title,
  draft,
  metaTitle,
  metaDescription,
  featureImageUrl,
  altTexts,
  tags = [],
}) {
  const post = await ghost.posts.add({
    title: title || 'Untitled Draft',
    html: markdownToHtml(draft),
    status: 'draft',
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    feature_image: featureImageUrl || null,
    tags: tags.map(t => ({ name: t })),
  }, { source: 'html' });

  return post;
}

/**
 * Update an existing Ghost post (after author approves edits)
 */
export async function updatePost(postId, updates) {
  return ghost.posts.edit({
    id: postId,
    updated_at: new Date().toISOString(),
    ...updates,
  });
}

/**
 * Basic markdown to HTML conversion
 * For production, swap this with a proper markdown parser (marked, remark)
 */
function markdownToHtml(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
