/**
 * constants/index.js
 *
 * Single source of truth for all app-wide constants.
 * Never hardcode these values in components — import from here.
 */

// ── Screen routes ─────────────────────────────────────────────────────────
export const SCREENS = {
  DASHBOARD:        'dashboard',
  NEW_POST:         'new_post',
  POST_DETAIL:      'post_detail',
  PIPELINE_OPTIONS: 'pipeline_options',
  REVIEW:           'review',
  PUBLISH:          'publish',
};

// ── Post statuses ─────────────────────────────────────────────────────────
export const STATUS = {
  DRAFT:            'draft',
  PIPELINE_PENDING: 'pipeline_pending',
  REVIEW:           'review',
  APPROVED:         'approved',
  PUBLISHED:        'published',
};

/**
 * Display config for each post status.
 * Used by StatusBadge, DraftCard, PostDetail.
 */
export const STATUS_CONFIG = {
  [STATUS.DRAFT]: {
    label: 'Draft',
    color: '#8B7355',
    bg:    '#F5F1EB',
  },
  [STATUS.PIPELINE_PENDING]: {
    label: 'In Pipeline',
    color: '#4A7C59',
    bg:    '#EAF3DE',
  },
  [STATUS.REVIEW]: {
    label: 'Needs Review',
    color: '#C17E3A',
    bg:    '#FFF8F0',
  },
  [STATUS.APPROVED]: {
    label: 'Ready',
    color: '#2C5F2E',
    bg:    '#EAF3DE',
  },
  [STATUS.PUBLISHED]: {
    label: 'Published',
    color: '#1A3A1B',
    bg:    '#EAF3DE',
  },
};

// ── Pipeline toggle definitions ───────────────────────────────────────────
/**
 * Each toggle maps to one step in the AI pipeline.
 * key       — matches the flag sent to the pipeline API
 * label     — display name
 * desc      — one-line description shown in PipelineOptions
 * model     — which Claude model handles this step
 * costEst   — rough cost estimate shown to author
 * default   — whether the toggle is on by default
 */
export const PIPELINE_TOGGLES = [
  {
    key:      'altText',
    label:    'Alt text generation',
    desc:     'Claude vision generates descriptive alt text for each photo',
    model:    'Haiku',
    costEst:  '~$0.01',
    default:  true,
  },
  {
    key:      'editorialPass',
    label:    'Editorial pass',
    desc:     'Polish prose, fix grammar, tighten flow — your voice stays yours',
    model:    'Sonnet',
    costEst:  '~$0.10',
    default:  true,
  },
  {
    key:      'formatSuggestion',
    label:    'Format suggestion',
    desc:     'Recommend the best post structure for this content',
    model:    'Sonnet',
    costEst:  '~$0.05',
    default:  true,
  },
  {
    key:      'seoIntegration',
    label:    'SEO integration',
    desc:     'Weave keywords naturally, suggest meta title and description',
    model:    'Sonnet',
    costEst:  '~$0.05',
    default:  true,
  },
  {
    key:      'socialCaptions',
    label:    'Social captions',
    desc:     'Generate Instagram, X, and Pinterest captions on publish',
    model:    'Haiku',
    costEst:  '~$0.01',
    default:  false,
  },
  {
    key:      'seoBrief',
    label:    'SEO pre-brief',
    desc:     'Research keywords and content gaps before writing',
    model:    'Sonnet',
    costEst:  '~$0.08',
    default:  false,
  },
];

// Default toggles state derived from definitions above
export const DEFAULT_TOGGLES = Object.fromEntries(
  PIPELINE_TOGGLES.map(t => [t.key, t.default])
);

// ── Model display config ──────────────────────────────────────────────────
export const MODEL_CONFIG = {
  Sonnet: { color: '#534AB7', bg: '#EEEDFE', label: 'Sonnet' },
  Haiku:  { color: '#3B6D11', bg: '#EAF3DE', label: 'Haiku'  },
};

// ── Autosave delay (ms) ───────────────────────────────────────────────────
export const AUTOSAVE_DELAY = 3000;

// ── Blog domain ───────────────────────────────────────────────────────────
export const BLOG_DOMAIN = 'windsandechoes.com';
