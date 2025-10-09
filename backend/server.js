const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db'); 

const app = express();
const PORT = 4000;
const JWT_SECRET = 'your_jwt_secret_key';

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the backend API! Try /api/health for a health check.');
});


app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, password_hash]);
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}! This is a protected route.` });
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content || content.length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  if (content.length > 250) {
    return res.status(400).json({ error: 'Message cannot exceed 250 characters' });
  }
  try {

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [req.user.email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user_id = users[0].id;
    await pool.query('INSERT INTO messages (user_id, content) VALUES (?, ?)', [user_id, content]);
    res.json({ message: 'Message submitted' });
  } catch (err) {
    console.error('Message posting error:', err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});


app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  const messageId = req.params.id;
  try {

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [req.user.email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user_id = users[0].id;

    const [messages] = await pool.query('SELECT * FROM messages WHERE id = ? AND user_id = ?', [messageId, user_id]);
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }
    await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});


app.get('/api/messages', async (req, res) => {
  try {
    const [messages] = await pool.query(
      'SELECT messages.id, messages.content, messages.created_at, users.email as author FROM messages JOIN users ON messages.user_id = users.id ORDER BY messages.created_at DESC'
    );
    res.json(messages);
  } catch (err) {
    console.error('Message retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});


app.get('/api/my-messages', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [req.user.email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user_id = users[0].id;
    const [userMessages] = await pool.query(
      'SELECT messages.id, messages.content, messages.created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json(userMessages);
  } catch (err) {
    console.error('My messages retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve my messages' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

 