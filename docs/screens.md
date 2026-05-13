# Screen Documentation

Detailed description of every screen, its components, props, and behaviour.

---

## 1. Dashboard

**File:** `screens/Dashboard.jsx`
**Entry point:** App loads here on start

### Purpose
The author's home base. Shows all drafts with their status, quick stats, and
contextual action buttons. First screen seen when opening the PWA.

### Components

| Component       | Purpose |
|----------------|---------|
| `OfflineBanner` | Pulsing dot + queue count when offline (from `components/index.jsx`) |
| `Header`        | W&E brand mark, "New post" button |
| `SyncBar`       | Last synced timestamp, sync button with spinner |
| `StatsBar`      | Total / drafts / review / published counts (Playfair Display numbers) |
| `FilterTabs`    | All, Drafts, Review, Ready, Published — horizontal scroll |
| `PullToRefresh` | Hint label at top of list |
| `SwipeCard`     | Swipeable card per draft — swipe left to reveal delete |
| `SlugModal`     | Bottom sheet for setting URL slug before publishing |

### SwipeCard quick actions (context-aware by status)

| Status          | Actions shown |
|----------------|---------------|
| `draft`         | Continue writing, Run pipeline |
| `review`        | Run pipeline, Review edits → |
| `approved`      | Publish → |
| `published`     | Update URL |

### Data source
Reads from IndexedDB via `getAllDrafts()` from `lib/storage.js`.

### Props
```
onNewPost    () => void          — navigate to NewPost
onOpenDraft  (draft) => void     — navigate to PostDetail
onAction     (action, draft) => void — 'pipeline' | 'review' | 'publish'
showToast    (msg, type) => void
```

---

## 2. New Post

**File:** `screens/NewPost.jsx`
**Reached from:** Dashboard ("New post" button) or PostDetail (Edit)

### Purpose
The primary writing screen. Author writes their draft and attaches photos.
Everything autosaves to IndexedDB — no manual save needed.

### Components

| Component        | Purpose |
|-----------------|---------|
| `Header`         | Back button, "New post" title, `SaveIndicator` |
| `TitleInput`     | Large Playfair Display input, placeholder "Post title…" |
| `PhotoUpload`    | Horizontal thumbnail grid, add/remove photos, hero badge on first |
| `DraftEditor`    | Auto-growing textarea, 1.75 line height, generous placeholder |
| `SeoKeywordInput`| Hidden by default, "+ Add target keyword" reveals it |
| `Footer`         | Fixed bottom bar — photo/word count pills, "Continue →" button |

### Autosave behaviour
- `useAutosave` hook debounces saves by 3 seconds after any change
- Saves to IndexedDB — survives app close, offline, background
- `SaveIndicator` shows: Saved ✓ / Saving… / Unsaved / Save failed
- Photos stored as metadata only (not File objects — those can't be serialised)

### Props
```
existingDraft {object}   — pre-populate when editing an existing draft
onNext        (data) => void — proceed to PipelineOptions with post data
onBack        () => void
showToast     (msg, type) => void
```

---

## 3. Post Detail

**File:** `screens/PostDetail.jsx`
**Reached from:** Dashboard (tapping a card)

### Purpose
Read-only view of an existing draft or published post. Shows status, metadata,
content preview, photo grid, alt texts, and version history. Action bar at bottom
shows context-appropriate buttons based on post status.

### Components

| Component        | Purpose |
|-----------------|---------|
| `Header`         | Back, "Post" title, Edit button (drafts only) |
| `StatusBadge`    | Coloured pill from `components/index.jsx` |
| `TitleBlock`     | Post title in large Playfair Display |
| `MetaRow`        | Word count, photo count, SEO keyword, last updated |
| `LiveURL`        | Published posts only — clickable link to live URL |
| `ContentPreview` | Read-only draft text, fades out at 300px with gradient |
| `PhotoGrid`      | Horizontal scrolling thumbnails with hero badge |
| `AltTexts`       | Generated alt text per photo |
| `VersionHistory` | Collapsible — shows v0 raw through v3 approved, tap to view |
| `ActionBar`      | Fixed bottom bar, buttons change per status (see below) |

### ActionBar by status

| Status           | Actions |
|-----------------|---------|
| `draft`          | Edit post, Run pipeline |
| `pipeline_pending`| Pipeline running… (disabled) |
| `review`         | Review edits → |
| `approved`       | Publish → |
| `published`      | View on blog ↗, Update post |

### Props
```
draft    {object}   — the draft object from IndexedDB
onEdit   () => void — navigate to NewPost with draft pre-loaded
onAction (action) => void — 'pipeline' | 'review' | 'publish'
onBack   () => void
```

---

## 4. Pipeline Options

**File:** `screens/PipelineOptions.jsx`
**Reached from:** NewPost ("Continue →")

### Purpose
Author chooses which AI pipeline steps to run for this post. Every toggle is
optional. The running cost estimate updates as toggles change.

### Components

| Component      | Purpose |
|---------------|---------|
| `Header`       | Back, "Pipeline" title, `CostEstimate` badge |
| `ToggleRow`    | One row per pipeline step — label, model badge, cost, on/off |
| `ModelBadge`   | Sonnet (purple) / Haiku (green) from `components/index.jsx` |
| `CostEstimate` | Running total of enabled toggle costs |
| `SeoKeyword`   | Text input — only shown when `seoBrief` toggle is on |
| `Footer`       | "Skip AI" (when all off) or "Run pipeline →" |

### Toggle definitions
Defined in `constants/index.js` as `PIPELINE_TOGGLES`. Adding a new pipeline
step only requires adding an entry there — no changes to this screen needed.

### Props
```
postData  {object}   — current post data
onNext    (data) => void — proceed to Review with pipeline result
onBack    () => void
showToast (msg, type) => void
```

---

## 5. Review

**File:** `screens/Review.jsx`
**Reached from:** PipelineOptions (after pipeline completes)

### Purpose
Paragraph-by-paragraph diff viewer. Author reviews every change Claude made,
accepting, rejecting, or manually editing each one. Cannot proceed to Publish
until all changed paragraphs are reviewed.

### Components

| Component         | Purpose |
|------------------|---------|
| `Header`          | Back, "Review edits" title, progress "3 of 12 reviewed", "Accept all" |
| `FormatSuggestion`| Card at top — Claude's recommended format with structure, accept/ignore |
| `SeoBrief`        | Collapsible card — keywords, content gaps, related keywords |
| `MetaPreview`     | Google-style preview of meta title + description |
| `DiffList`        | List of `DiffParagraph` components |
| `DiffParagraph`   | Shows original + Claude's edit, accept/reject/edit buttons |
| `SummaryBar`      | Fixed bottom — X accepted / Y rejected / Z remaining |

### DiffParagraph states
- **Pending** — amber border, accept/reject/edit buttons shown
- **Accepted** — green background, "✓ Accepted" badge + undo
- **Rejected** — faded, "✕ Rejected" badge + undo
- **Edited** — warm background, "✎ Edited" badge + undo
- **Unchanged** — collapsed with "No changes" label

### Props
```
postData  {object}   — post data including pipelineResult.diff array
onApprove (data) => void — proceed to Publish with approved content
onBack    () => void
```

---

## 6. Publish

**File:** `screens/Publish.jsx`
**Reached from:** Review ("Approve & continue →")

### Purpose
Final screen before the post goes live. Author sets the URL slug, SEO meta,
tags, reviews social captions, then either saves as a Ghost draft or publishes.

### Components

| Component         | Purpose |
|------------------|---------|
| `Header`          | Back, "Publish" title |
| `PostPreview`     | Hero image + title + excerpt at top |
| `SlugField`       | `windsandechoes.com/` prefix + editable slug (auto-formats) |
| `MetaTitle`       | Editable, 60 char limit with counter |
| `MetaDescription` | Editable textarea, 160 char limit with counter |
| `TagsInput`       | Pill-based tag input — press Enter or comma to add |
| `AltTextSummary`  | Read-only list of generated alt texts per photo |
| `SocialCaptions`  | Collapsible — editable IG, X, Pinterest captions |
| `Footer`          | "Save draft" (grey) + "Publish now →" (green) |
| `ConfirmModal`    | Bottom sheet before going live — shows final URL |
| `SuccessState`    | Full-screen success after publish — URL + view link |

### Ghost API calls
Uses `api/index.js`:
- `saveGhostDraft()` — creates a Ghost draft post
- `publishGhostPost()` — publishes live

### Props
```
postData  {object}   — approved post data from Review
onDone    () => void — return to Dashboard after publish
onBack    () => void
showToast (msg, type) => void
```
