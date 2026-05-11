# Winds & Echoes

Adventure travel blog — full-stack AI content pipeline.

## What this is

A personal adventure travel blog built by a software engineer who is also the sole author and photographer. The system pairs authentic writing and original photography with an AI-assisted editorial pipeline.

- **Blog**: Ghost CMS self-hosted on DigitalOcean
- **Pipeline**: Node.js server — Claude API, Sharp.js image processing, Ghost Admin API
- **Author interface**: React PWA with offline support (iPhone, iPad, Mac)
- **Theme**: Custom Ghost Handlebars theme

## Repo structure

```
winds-and-echoes/
├── pipeline/          # Node.js AI pipeline server
│   └── src/
│       ├── ingress/   # Photo processing (Sharp.js)
│       ├── editorial/ # Claude editorial layer
│       ├── ghost/     # Ghost Admin API integration
│       └── social/    # Publish webhook → Buffer
├── pwa/               # React author interface (Vite + PWA)
│   └── src/
│       ├── screens/   # Dashboard, NewPost, PipelineOptions, Review, Publish
│       ├── components/
│       ├── hooks/
│       └── lib/       # IndexedDB storage, API client
├── theme/             # Custom Ghost Handlebars theme
└── prompts/           # System prompts (gitignored — private)
```

## Getting started

### Prerequisites
- Node.js 20+ (use nvm)
- Ghost instance running (local or DigitalOcean droplet)
- Anthropic API key

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/winds-and-echoes.git
cd winds-and-echoes

# Install all dependencies
npm install

# Set up pipeline environment
cp pipeline/.env.example pipeline/.env
# Edit pipeline/.env with your API keys

# Start pipeline dev server
npm run pipeline

# In another terminal, start PWA dev server
npm run pwa
```

### Environment variables

See `pipeline/.env.example` for required keys:
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `GHOST_URL` — your Ghost instance URL
- `GHOST_ADMIN_API_KEY` — from Ghost admin → Settings → Integrations

## Pipeline toggles

Every AI step is optional. The author chooses per-post:

| Toggle | Model | Default |
|--------|-------|---------|
| Alt text generation | Haiku | On |
| Editorial pass | Sonnet | On |
| Format suggestion | Sonnet | On |
| SEO integration | Sonnet | On |
| Social captions | Haiku | Off |
| SEO pre-brief | Sonnet | Off |

## Infrastructure

| Component | Host | Cost |
|-----------|------|------|
| Ghost + Pipeline | DigitalOcean $12/mo droplet | $12/mo |
| PWA | Vercel free tier | Free |
| CDN + SSL | Cloudflare free tier | Free |
| Domain | Namecheap | ~$1/mo |
| Analytics | Umami (self-hosted) | Free |
| Photo originals | Backblaze B2 | ~$1/mo |

**Total: ~$16–19/month**

## Portfolio

Built as a live portfolio piece. Skills demonstrated: Anthropic Claude API (vision + text), Ghost Admin API, Node.js pipeline orchestration, React PWA with offline support, Workbox + IndexedDB, Sharp.js image processing, self-hosted Linux server, Cloudflare CDN, Handlebars theme development, prompt engineering, SEO tooling, webhook-driven automation.
