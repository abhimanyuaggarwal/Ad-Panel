// api/server.js — the HTTP surface of the Player Console. Port 4200 (PANEL_PORT).
//
// This file only assembles the app: middleware, the static web app, and one router per
// subject from ./routes. Response shapes live in ./response-shapes.js, the bulk action
// in ./routes/keys-bulk.js, and every rule in ./store (see ../ARCHITECTURE.md for the map).
//
// TWO ROOMS: /panel/keys is the product room (integrations: switches, player, drive,
// which setup fills it); /panel/setups is the ops room (ad setups: placements, ladders,
// behaviour). Everything is in memory; POST /panel/mock/reset rebuilds the world.

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetWorld } from './mock/world.js';
import metaRoutes from './routes/meta.js';
import sessionRoutes from './routes/session.js';
import keyRoutes from './routes/keys.js';
import publishRoutes from './routes/publish.js';
import bulkRoutes from './routes/keys-bulk.js';
import setupRoutes from './routes/setups.js';
import tagRoutes from './routes/tags.js';
import gamRoutes from './routes/gam.js';
import mockRoutes from './routes/mock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

// Route order is the original registration order; no two routes overlap, so it is
// kept for readability, not correctness.
app.use(metaRoutes);
app.use(sessionRoutes);
app.use(keyRoutes);
app.use(publishRoutes);
app.use(bulkRoutes);
app.use(setupRoutes);
app.use(tagRoutes);
app.use(gamRoutes);
app.use(mockRoutes);

resetWorld();

const PORT = process.env.PANEL_PORT || 4200;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`StreamAds panel API on http://localhost:${PORT}`));
}

export default app;
