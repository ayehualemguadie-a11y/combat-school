const db = require("./database");

const username = "admin";
const password = "Combat@2026";

const stmt = db.prepare(`
INSERT INTO admins (username, password)
VALUES (?, ?)
`);

try {
    stmt.run(username, password);
    console.log("Admin account created successfully.");
} catch (err) {
    console.log("Admin already exists.");
}