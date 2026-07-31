const { Pool } = require("pg");

// 🟢 በ Vercel ላይ የሞላነውን የ Supabase DATABASE_URL በደህንነት (SSL) ያነባል
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 🔒 ሰንጠረዦቹን በክላውድ ዳታቤዝ ላይ የማረጋገጫ ተግባር
const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS gallery (id SERIAL PRIMARY KEY, filename TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS news (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, school_name TEXT, address TEXT, phone TEXT, email TEXT)`);
        console.log("🚀 Supabase Cloud Tables Verified and Secured!");
    } catch (err) {
        console.error("Database init error:", err.message);
    }
};

initDb();

// 💡 ⚠️ ወሳኝ መስመር፡ በ server.js ላይ 'db' ተብሎ ስለተጠራ ስሙን 'db' በሚል ተለዋዋጭነት እንልከዋለን
const db = pool;
module.exports = db; 
