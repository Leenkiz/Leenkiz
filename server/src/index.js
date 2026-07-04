import 'dotenv/config';
import express from 'express';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check — lets the client (and us) confirm API + database are up.
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Gems & Rackets API',
    database: db.open ? 'connected' : 'unavailable',
  });
});

app.listen(PORT, () => {
  console.log(`Gems & Rackets API running at http://localhost:${PORT}`);
});
