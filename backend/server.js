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

// Ensure required tables exist (idempotent)
async function ensureSchema() {
  try {
    // Add username column to users if missing (compat with MySQL versions)
    const [cols] = await pool.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'
    `);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE`);
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        content VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dm_read_state (
        user_id INT NOT NULL,
        other_user_id INT NOT NULL,
        last_read_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (user_id, other_user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (other_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error('Schema ensure error:', err);
  }
}

ensureSchema();

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
  const { email, username, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 chars (letters, numbers, underscore)' });
  }
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const [userByUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (userByUsername.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)', [email, username, password_hash]);
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
    const token = jwt.sign({ email: user.email, username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello, ${req.user.username || req.user.email}! This is a protected route.` });
});

// List users for DM (excluding current user)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username FROM users WHERE id <> ?', [req.user.id]);
    res.json(users);
  } catch (err) {
    console.error('Users retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Send a direct message
app.post('/api/dm', authenticateToken, async (req, res) => {
  const { toEmail, toId, content } = req.body;
  if (!content || content.length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  if (content.length > 500) {
    return res.status(400).json({ error: 'Message cannot exceed 500 characters' });
  }
  try {
    let recipientId = toId;
    if (!recipientId) {
      if (!toEmail) {
        return res.status(400).json({ error: 'Recipient is required' });
      }
      const [recipients] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [toEmail, toEmail]);
      if (recipients.length === 0) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
      recipientId = recipients[0].id;
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }
    await pool.query(
      'INSERT INTO private_messages (sender_id, recipient_id, content) VALUES (?, ?, ?)',
      [req.user.id, recipientId, content]
    );
    res.json({ message: 'Direct message sent' });
  } catch (err) {
    console.error('DM send error:', err);
    res.status(500).json({ error: 'Failed to send direct message' });
  }
});

// Get conversation with a user
app.get('/api/dm/:userId', authenticateToken, async (req, res) => {
  const otherUserId = parseInt(req.params.userId, 10);
  if (!otherUserId) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    const [exists] = await pool.query('SELECT id FROM users WHERE id = ?', [otherUserId]);
    if (exists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [messages] = await pool.query(
      `SELECT id, sender_id, recipient_id, content, created_at
       FROM private_messages
       WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       ORDER BY created_at ASC`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    );
    res.json(messages);
  } catch (err) {
    console.error('Conversation retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

// Mark a conversation as read (sets last_read_at to now for current user)
app.post('/api/dm/read/:userId', authenticateToken, async (req, res) => {
  const otherUserId = parseInt(req.params.userId, 10);
  if (!otherUserId) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    await pool.query(
      `INSERT INTO dm_read_state (user_id, other_user_id, last_read_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
      [req.user.id, otherUserId]
    );
    res.json({ message: 'Conversation marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Get unread counts per user for current user
app.get('/api/dm/unread-counts', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id AS other_user_id, u.username,
              COALESCE(COUNT(pm.id), 0) AS unread_count
       FROM users u
       LEFT JOIN dm_read_state r
         ON r.user_id = ? AND r.other_user_id = u.id
       LEFT JOIN private_messages pm
         ON pm.recipient_id = ? AND pm.sender_id = u.id
        AND (r.last_read_at IS NULL OR pm.created_at > r.last_read_at)
       WHERE u.id <> ?
       GROUP BY u.id, u.username
       ORDER BY u.username ASC`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Unread counts error:', err);
    res.status(500).json({ error: 'Failed to retrieve unread counts' });
  }
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

    const user_id = req.user.id;
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

    const user_id = req.user.id;

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
      'SELECT messages.id, messages.content, messages.created_at, COALESCE(users.username, users.email) as author FROM messages JOIN users ON messages.user_id = users.id ORDER BY messages.created_at DESC'
    );
    res.json(messages);
  } catch (err) {
    console.error('Message retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});


app.get('/api/my-messages', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
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

 