# PWA Architecture

## Overview

The Winds & Echoes PWA is a React application built with Vite. It serves as the
author's primary interface for the entire content workflow — from writing a draft
in the field to publishing on Ghost.

## Folder structure

```
pwa/src/
├── main.jsx              # Entry point — mounts React app
├── App.jsx               # Root component — router + global state
├── index.css             # Global styles + all screen/component styles
│
├── constants/
│   └── index.js          # All app-wide constants (routes, statuses, toggles)
│
├── api/
│   └── index.js          # All fetch calls — never call fetch() in components
│
├── hooks/
│   ├── useAutosave.js    # Debounced autosave to IndexedDB
│   ├── useOnlineStatus.js # Tracks online/offline state
│   └── useToast.js       # App-wide toast notification system
│
├── lib/
│   └── storage.js        # IndexedDB wrapper (drafts, photo queue, pipeline results)
│
├── components/
│   └── index.jsx         # Shared UI components (OfflineBanner, Toast, BottomSheet, etc.)
│
└── screens/
    ├── Dashboard.jsx       # Draft list, stats, quick actions
    ├── NewPost.jsx         # Photo upload + text editor
    ├── PostDetail.jsx      # View existing draft, version history, actions
    ├── PipelineOptions.jsx # Toggle AI pipeline steps
    ├── Review.jsx          # Diff viewer — accept/reject Claude's edits
    └── Publish.jsx         # Meta fields, slug, social captions, publish to Ghost
```

## Navigation

The app uses a simple state-machine router in `App.jsx`. No react-router —
the workflow is linear and has no deep-linking requirements.

```
DASHBOARD
  ↓ New post / open draft
NEW_POST  ←→  POST_DETAIL
  ↓ Continue
PIPELINE_OPTIONS
  ↓ Run / Skip
REVIEW
  ↓ Approve
PUBLISH
  ↓ Done
DASHBOARD
```

## Data flow

`postData` is the single shared state object that accumulates as the author
moves through the workflow. Each screen receives what it needs and merges
updates back via `navigate(screen, newData)`.

```
NewPost         → { title, content, photos, seoKeyword, id }
PipelineOptions → { ...prev, pipelineResult }
Review          → { ...prev, approvedContent, metaTitle, metaDescription, altTexts }
Publish         → publishes to Ghost, returns to Dashboard
```

## Offline support

- All screens work offline — drafts autosave to IndexedDB via `useAutosave`
- Photo uploads queue locally via Workbox background sync
- Pipeline API calls queue and retry when signal returns
- `useOnlineStatus` hook drives the `OfflineBanner` component

## Key architectural decisions

**No global state library (Redux/Zustand)**
The app is linear enough that prop drilling and `useState` in App.jsx is
sufficient. Adding a state library would be premature complexity.

**No react-router**
The PWA has a simple linear workflow with no deep-linking, back/forward, or
URL-based navigation. A state machine in App.jsx is simpler and smaller.

**CSS in one file**
`index.css` contains all styles. This is intentional for a single-developer
project — no build-time CSS modules or styled-components overhead. Styles are
organised by section with clear comments.

**API layer separation**
All fetch calls are in `api/index.js`. Components never call `fetch()` directly.
This makes the API easy to mock, test, or point at a different server.
