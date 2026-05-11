import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model tiers — see design doc section 4.2
const SONNET = 'claude-sonnet-4-6';
const HAIKU = 'claude-haiku-4-5-20251001';

/**
 * Main processor — runs only the steps the author toggled on
 */
export async function processPost({ draft, photos, toggles, seoKeyword }) {
  const result = {
    originalDraft: draft,
    editedDraft: draft,
    diff: null,
    formatSuggestion: null,
    metaTitle: null,
    metaDescription: null,
    altTexts: [],
    socialCaptions: null,
    seoBrief: null,
    tokensUsed: 0,
  };

  // Step 1 — SEO pre-brief (if toggled on)
  if (toggles.seoBrief && seoKeyword) {
    result.seoBrief = await getSeoBrief(seoKeyword);
  }

  // Step 2 — Alt text generation (Haiku — fast, cheap)
  if (toggles.altText && photos?.length > 0) {
    result.altTexts = await generateAltTexts(photos);
  }

  // Step 3 — Format suggestion (Sonnet)
  if (toggles.formatSuggestion && draft) {
    result.formatSuggestion = await suggestFormat(draft, photos);
  }

  // Step 4 — Editorial pass (Sonnet)
  if (toggles.editorialPass && draft) {
    const edited = await editorialPass(draft, result.seoBrief);
    result.editedDraft = edited.text;
    result.diff = buildDiff(draft, edited.text);
    result.metaTitle = edited.metaTitle;
    result.metaDescription = edited.metaDescription;
  }

  // Step 5 — Social captions generated at publish time via webhook
  // (not run here — see social/webhook.js)

  return result;
}

/**
 * SEO pre-brief — Sonnet with web search
 */
async function getSeoBrief(keyword) {
  const response = await client.messages.create({
    model: SONNET,
    max_tokens: 1000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: `You are an SEO research assistant for an adventure travel blog called Winds & Echoes.
Return a JSON object with: primaryKeyword, searchIntent, topCompetitors (array of 3), contentGaps (array), suggestedTitle, suggestedH1, suggestedHeadings (array), relatedKeywords (array).
Return JSON only, no markdown.`,
    messages: [{ role: 'user', content: `Research the keyword: "${keyword}" for an adventure travel blog post.` }],
  });

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Alt text generation — Haiku vision (fast, cheap)
 */
async function generateAltTexts(photos) {
  return Promise.all(photos.map(async (photo) => {
    const imageData = await fs.readFile(photo.processedPath);
    const base64 = imageData.toString('base64');

    const response = await client.messages.create({
      model: HAIKU,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/webp', data: base64 } },
          { type: 'text', text: 'Write a concise, descriptive alt text for this photo for an adventure travel blog. Return only the alt text, no preamble.' }
        ]
      }]
    });

    return {
      filename: photo.filename,
      altText: response.content[0].text.trim(),
    };
  }));
}

/**
 * Format suggestion — Sonnet
 */
async function suggestFormat(draft, photos) {
  const photoCount = photos?.length || 0;
  const response = await client.messages.create({
    model: SONNET,
    max_tokens: 500,
    system: `You are an editorial advisor for Winds & Echoes, an adventure travel blog.
Suggest the best post format based on the draft content and photo count.
Formats: narrative journey, day-by-day itinerary, photo essay, gear review, listicle, trail guide.
Return JSON: { format, reasoning, suggestedStructure (array of section headings) }. No markdown.`,
    messages: [{
      role: 'user',
      content: `Draft (${draft.length} chars), ${photoCount} photos attached.\n\nDraft:\n${draft.substring(0, 1500)}`
    }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return { raw: response.content[0].text };
  }
}

/**
 * Editorial pass — Sonnet
 * Polishes prose, integrates SEO, returns edited draft + meta
 */
async function editorialPass(draft, seoBrief) {
  const seoContext = seoBrief
    ? `\nSEO brief: target keyword "${seoBrief.primaryKeyword}", suggested headings: ${seoBrief.suggestedHeadings?.join(', ')}`
    : '';

  const response = await client.messages.create({
    model: SONNET,
    max_tokens: 4000,
    system: `You are a careful editor for Winds & Echoes, an adventure travel blog.
Your job is to polish the author's prose — fix grammar, tighten sentences, improve flow — while preserving their voice completely.
Do NOT rewrite large sections. Do NOT change the author's perspective or tone.
${seoContext}
Return JSON: { editedDraft, metaTitle, metaDescription, changesSummary }. No markdown.`,
    messages: [{
      role: 'user',
      content: `Please edit this draft:\n\n${draft}`
    }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return { text: response.content[0].text, metaTitle: null, metaDescription: null };
  }
}

/**
 * Simple paragraph-level diff
 */
function buildDiff(original, edited) {
  const originalParas = original.split('\n\n');
  const editedParas = edited.split('\n\n');
  const maxLen = Math.max(originalParas.length, editedParas.length);

  return Array.from({ length: maxLen }, (_, i) => ({
    index: i,
    original: originalParas[i] || '',
    edited: editedParas[i] || '',
    changed: originalParas[i] !== editedParas[i],
  }));
}
