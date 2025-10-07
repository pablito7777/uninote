// server.js
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Abilita CORS
app.use(cors());
app.use(express.json());

// Endpoint per la trascrizione
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key mancante' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    // Prepara il FormData per OpenAI
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('model', 'whisper-1');
    formData.append('language', req.body.language || 'it');

    // Chiamata all'API OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server proxy in esecuzione su http://localhost:${PORT}`);
});


// ============================================
// ISTRUZIONI PER L'INSTALLAZIONE:
// ============================================
// 1. Crea una nuova cartella per il progetto
// 2. Salva questo file come "server.js"
// 3. Crea un file "package.json" (vedi sotto)
// 4. Esegui: npm install
// 5. Avvia il server: node server.js
// 6. Il server sarà disponibile su http://localhost:3001