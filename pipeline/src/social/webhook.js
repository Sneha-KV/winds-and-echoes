import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HAIKU = 'claude-haiku-4-5-20251001';

/**
 * Called by Ghost publish webhook
 * Generates social captions and queues them in Buffer
 */
export async function handleWebhook(payload) {
  const post = payload?.post?.current;
  if (!post) return;

  const { title, html, feature_image, url } = post;
  const plainText = htmlToPlainText(html).substring(0, 2000);

  // Generate captions — Haiku is fast and cheap for this
  const captions = await generateCaptions({ title, plainText, url });

  // Queue in Buffer (non-blocking — webhook returns immediately)
  queueInBuffer(captions, feature_image).catch(err => {
    console.error('Buffer queue failed (non-blocking):', err.message);
  });

  return captions;
}

async function generateCaptions({ title, plainText, url }) {
  const response = await client.messages.create({
    model: HAIKU,
    max_tokens: 600,
    system: `You generate social media captions for Winds & Echoes, an adventure travel blog.
Return JSON: {
  instagram: "caption with 3-5 relevant hashtags",
  twitter: "punchy hook under 240 chars with link placeholder",
  pinterest: "keyword-rich description for discoverability, 2-3 sentences"
}
No markdown, JSON only.`,
    messages: [{
      role: 'user',
      content: `Post title: "${title}"\nPost URL: ${url}\n\nContent excerpt:\n${plainText}`
    }]
  });

  try {
    const captions = JSON.parse(response.content[0].text);
    // Replace link placeholder with actual URL
    captions.twitter = captions.twitter.replace('[link]', url).replace('{{url}}', url);
    return captions;
  } catch {
    return { raw: response.content[0].text };
  }
}

async function queueInBuffer(captions, imageUrl) {
  if (!process.env.BUFFER_ACCESS_TOKEN) {
    console.log('Buffer token not set — skipping social queue');
    return;
  }

  // TODO: Add Buffer profile IDs to .env and implement per platform
  // Buffer API docs: https://buffer.com/developers/api
  console.log('Social captions ready for Buffer:', captions);
}

function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
