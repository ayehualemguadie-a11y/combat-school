const Database = require("better-sqlite3");

const db = new Database("school.db");

console.log("Database connected successfully.");
db.prepare(`
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
`).run();
db.prepare(`
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

console.log("Gallery table ready.");

console.log("Admin table ready.");
db.prepare(`
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

console.log("News table ready.");
db.prepare(`
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    school_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT
)
`).run();

console.log("Settings table ready.");

module.exports = db;