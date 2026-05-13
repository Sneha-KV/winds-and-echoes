# Pipeline Architecture

## Overview

The pipeline is a Node.js Express server running on the DigitalOcean droplet
alongside Ghost. It handles all AI processing, Ghost API integration, and
social caption generation.

**URL:** `https://api.windsandechoes.com`
**Process manager:** pm2 (`wae-pipeline`)
**Entry point:** `pipeline/src/index.js`

## Folder structure

```
pipeline/src/
├── index.js           # Express server — all API endpoints
├── editorial/
│   └── processor.js   # Claude AI editorial layer (all pipeline steps)
├── ghost/
│   └── api.js         # Ghost Admin API — upload, draft, publish
├── ingress/
│   └── photos.js      # Sharp.js image processing
└── social/
    └── webhook.js     # Publish webhook → Claude captions → Buffer
```

## Endpoints

### GET /health
Health check. Returns `{ status: 'ok', service: 'winds-and-echoes-pipeline' }`.
Used to verify the server is running.

### POST /api/pipeline
Runs the AI editorial pipeline. Called by the PWA PipelineOptions screen.

**Request body:**
```json
{
  "draft": "Your post content here...",
  "photos": [{ "filename": "photo.jpg", "base64": "..." }],
  "toggles": {
    "altText": true,
    "editorialPass": true,
    "formatSuggestion": true,
    "seoIntegration": true,
    "socialCaptions": false,
    "seoBrief": false
  },
  "seoKeyword": "optional keyword for pre-brief"
}
```

**Response:**
```json
{
  "success": true,
  "originalDraft": "...",
  "editedDraft": "...",
  "diff": [{ "index": 0, "original": "...", "edited": "...", "changed": true }],
  "metaTitle": "...",
  "metaDescription": "...",
  "altTexts": [{ "filename": "photo.jpg", "altText": "..." }],
  "formatSuggestion": { "format": "narrative journey", "reasoning": "..." },
  "seoBrief": null
}
```

### POST /api/ghost/draft
Saves a post as a draft in Ghost. Called by PWA Publish screen "Save draft" button.

**Request body:**
```json
{
  "title": "Post title",
  "content": "Markdown content...",
  "metaTitle": "SEO title",
  "metaDescription": "SEO description",
  "slug": "post-url-slug",
  "tags": ["adventure", "hiking"],
  "photos": [{ "filename": "photo.jpg", "base64": "...", "mimeType": "image/jpeg" }],
  "altTexts": [{ "filename": "photo.jpg", "altText": "..." }]
}
```

**Response:**
```json
{
  "success": true,
  "post": { "id": "ghost-post-id", "url": "https://...", "status": "draft", "slug": "..." }
}
```

### POST /api/ghost/publish
Publishes a post live on Ghost. If `ghostPostId` is provided, updates the
existing draft instead of creating a new post.

**Request body:** Same as `/api/ghost/draft` plus optional `ghostPostId`.

**Response:** Same as `/api/ghost/draft` with `status: "published"`.

### POST /api/webhook/publish
Receives Ghost's publish webhook. Responds immediately (non-blocking) then
generates social captions and queues them in Buffer asynchronously.

## Claude model tiers

| Step              | Model  | Reason |
|------------------|--------|--------|
| Alt text          | Haiku  | High volume, short output, cheap |
| Editorial pass    | Sonnet | Needs nuanced voice preservation |
| Format suggestion | Sonnet | Requires structural judgement |
| SEO integration   | Sonnet | Keyword placement requires reasoning |
| Social captions   | Haiku  | Formulaic, short, cheap |
| SEO pre-brief     | Sonnet | Web search + competitor analysis |

## Image handling

Photos flow through two paths depending on context:

**From PWA (base64):**
`PWA uploads base64` → `/api/ghost/draft or /api/ghost/publish` → `uploadImageFromBase64()` → Ghost CDN URL

**From server pipeline (Sharp.js):**
`Photos in /inbox` → `photos.js (Sharp resize/WebP)` → `uploadImageFromPath()` → Ghost CDN URL

## Environment variables

All set in `pipeline/.env` (never committed):

```
ANTHROPIC_API_KEY     — from console.anthropic.com
GHOST_URL             — https://windsandechoes.com
GHOST_ADMIN_API_KEY   — from Ghost admin → Settings → Integrations → Pipeline
BUFFER_ACCESS_TOKEN   — from buffer.com (optional)
PORT                  — 3001 (default)
```

## Deployment

```bash
# SSH into server
ssh root@159.65.100.97
su - skghost

# Pull latest code
cd ~/winds-and-echoes
git pull

# Install any new dependencies
npm install

# Restart pipeline
pm2 restart wae-pipeline

# Check logs
pm2 logs wae-pipeline
```
