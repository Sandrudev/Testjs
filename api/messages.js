const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключение к базе данных
const dbPath = path.resolve('/tmp', 'messages.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the messages database.');
});

// Создание таблицы сообщений
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    db.all("SELECT * FROM messages ORDER BY timestamp DESC", [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(200).json(rows);
    });
  } else if (req.method === 'POST') {
    const { content } = req.body;
    db.run(`INSERT INTO messages (content) VALUES (?)`, [content], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const newMessage = { id: this.lastID, content, timestamp: new Date().toISOString() };
      res.status(201).json(newMessage);
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
