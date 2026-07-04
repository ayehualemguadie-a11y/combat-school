const { Pool } = require("pg");

// ☁️ የ Neon የክላውድ PostgreSQL ዴታቤዝ ግንኙነት
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_XQ9iMtaG5gFJ@ep-long-feather-at49rajs.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

// 🔒 ሰንጠረዦቹ ቀድሞ ስለተፈጠሩ እንዳይነኩ በ IF NOT EXISTS ተቆልፈዋል
const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS gallery (id SERIAL PRIMARY KEY, filename TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS news (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, school_name TEXT, address TEXT, phone TEXT, email TEXT)`);
        console.log("🚀 Neon Cloud Tables Verified and Secured!");
    } catch (err) {
        console.error("Database init error:", err.message);
    }
};

initDb();

// 💡 ⚠️ የ 500 ስህተቱን ሙሉ በሙሉ የሚያጠፋው እውነተኛው ማስተካከያ መስመር ይህ ነው፡
module.exports = pool; 
