import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/supabase', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabaseUrl = `https://api.supabase.com/v1${req.path}`;
    
    const response = await fetch(supabaseUrl, {
      method: req.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
