const Database = require("better-sqlite3");

// ሰርቨሩ በአረንጓዴ እንዲነሳ ዴታቤዙን ወደ መደበኛው ፋይል መልሰነዋል
const db = new Database("school.db");

console.log("Database connected successfully to school.db");

module.exports = db;

db.prepare(`
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
`).run();
const existingAdmin = db.prepare(
    "SELECT * FROM admins WHERE username = ?"
).get("admin");

if (!existingAdmin) {
    db.prepare(
        "INSERT INTO admins (username, password) VALUES (?, ?)"
    ).run("admin", "admin123");

    console.log("Default admin created.");
}
db.prepare(`
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

console.log("Gallery table ready.");

console.log("Admin table ready.");
const admin = db.prepare("SELECT * FROM admins WHERE id = 1").get();

if (!admin) {
    db.prepare(
        "INSERT INTO admins (username, password) VALUES (?, ?)"
    ).run("admin", "admin123");

    console.log("Default admin created.");
}
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