import 'dotenv/config';
import express from 'express';
import { processPost } from './editorial/processor.js';
import { handleWebhook } from './social/webhook.js';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'winds-and-echoes-pipeline' });
});

// Main pipeline endpoint — called by PWA when author submits a post
app.post('/api/pipeline', async (req, res) => {
  try {
    const { draft, photos, toggles, seoKeyword } = req.body;
    const result = await processPost({ draft, photos, toggles, seoKeyword });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Pipeline error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ghost publish webhook — fires when author hits publish
app.post('/api/webhook/publish', async (req, res) => {
  try {
    await handleWebhook(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Pipeline server running on port ${PORT}`);
});
