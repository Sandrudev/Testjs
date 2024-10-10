const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const randomstring = require('randomstring');

const app = express();
const port = process.env.PORT || 3000;

// Подключение к базе данных SQLite
const db = new sqlite3.Database('./auth_system.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Создание таблиц, если они не существуют
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        token TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        purchase_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        quantity_in_stock INTEGER NOT NULL DEFAULT 0,
        user_id INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        UNIQUE(product_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        sale_date TIMESTAMP NOT NULL,
        total_amount REAL NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`);
});

// Генерация токена
function generateToken() {
    return randomstring.generate(13);
}

// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, adminPassword } = req.body;
    if (adminPassword === "morshenfullsumflpol") {
        const token = generateToken();
        db.run("INSERT INTO users (username, token) VALUES (?, ?)", [username, token], function(err) {
            if (err) {
                return res.status(400).json({ error: "Это имя пользователя уже занято." });
            }
            res.json({ message: "Регистрация успешна!", token });
        });
    } else {
        res.status(403).json({ error: "Неверный пароль администратора!" });
    }
});

// Авторизация пользователя
app.post('/login', (req, res) => {
    const { token } = req.body;
    db.get("SELECT id FROM users WHERE token=?", [token], (err, row) => {
        if (row) {
            res.json({ message: "Добро пожаловать!", userId: row.id });
        } else {
            res.status(401).json({ error: "Неверный токен!" });
        }
    });
});

// Добавление товара
app.post('/products', (req, res) => {
    const { name, description, purchase_price, sale_price, quantity_in_stock, user_id } = req.body;
    db.run("INSERT INTO products (name, description, purchase_price, sale_price, quantity_in_stock, user_id) VALUES (?, ?, ?, ?, ?, ?)", 
           [name, description, purchase_price, sale_price, quantity_in_stock, user_id], function(err) {
               if (err) return res.status(400).json({ error: "Ошибка при добавлении товара." });
               res.json({ message: "Товар успешно добавлен!" });
           });
});

// Получение всех товаров пользователя
app.get('/products/:userId', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM products WHERE user_id=?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
