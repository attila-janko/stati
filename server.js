const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');
const MAX_STORED_BOOKINGS = 200;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Érvénytelen JSON formátum.' });
  }

  return next(error);
});
app.use(express.static(__dirname));

async function ensureDataFile() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readStoredBookings() {
  await ensureDataFile();

  try {
    const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read bookings file:', error);
    throw new Error('Nem sikerült beolvasni a jelentkezéseket.');
  }
}

async function writeStoredBookings(bookings) {
  try {
    const normalised = Array.isArray(bookings) ? bookings : [];
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(normalised, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write bookings file:', error);
    throw new Error('Nem sikerült elmenteni a jelentkezéseket.');
  }
}

function sanitiseText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

app.get('/api/bookings', async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, MAX_STORED_BOOKINGS) : 20;

  try {
    const bookings = await readStoredBookings();
    const sorted = bookings
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, safeLimit);

    res.json({ bookings: sorted });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ismeretlen hiba történt.' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const name = sanitiseText(req.body?.name);
  const email = sanitiseText(req.body?.email);
  const track = sanitiseText(req.body?.track).toLowerCase();
  const message = sanitiseText(req.body?.message);

  if (!name || !email || !track) {
    return res.status(400).json({ error: 'Kérjük, add meg a nevedet, e-mail címedet és válassz egy csoportot.' });
  }

  if (name.length > 160) {
    return res.status(400).json({ error: 'A név legfeljebb 160 karakter hosszú lehet.' });
  }

  if (email.length > 254) {
    return res.status(400).json({ error: 'Az e-mail cím legfeljebb 254 karakter lehet.' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Az üzenet legfeljebb 2000 karakter lehet.' });
  }

  const allowedTracks = new Set(['math', 'stats', 'python', 'custom']);

  if (!allowedTracks.has(track)) {
    return res.status(400).json({ error: 'A kiválasztott csoport érvénytelen. Frissítsd az oldalt és próbáld újra!' });
  }

  const newEntry = {
    id: randomUUID(),
    name,
    email,
    track,
    message,
    submittedAt: new Date().toISOString(),
  };

  try {
    const bookings = await readStoredBookings();
    bookings.push(newEntry);

    const trimmed = bookings
      .slice(-MAX_STORED_BOOKINGS)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    await writeStoredBookings(trimmed);

    res.status(201).json({ booking: newEntry });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Nem sikerült elmenteni a jelentkezést.' });
  }
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  return next();
});

app.use((req, res) => {
  res.status(404).json({ error: 'A keresett erőforrás nem található.' });
});

app.use((error, req, res, next) => {
  console.error('Unexpected error while handling request:', error);
  res.status(500).json({ error: 'Váratlan hiba történt. Kérjük, próbáld újra később.' });
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Stati server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
