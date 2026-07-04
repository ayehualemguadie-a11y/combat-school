const { Pool } = require("pg");

// ☁️ የ Neon የክላውድ PostgreSQL ዴታቤዝ ግንኙነት
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_XQ9iMtaG5gFJ@ep-long-feather-at49rajs.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

// ዴታቤዝ ውስጥ ሰንጠረዦች ከሌሉ በራስ-ሰር እንዲፈጥር ማዘጋጀት
const initDb = async () => {
    try {
        // 1. የጋለሪ ሰንጠረዥ
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gallery (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL
            )
        `);
        
        // 2. የአድሚን ሰንጠረዥ
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )
        `);

        // 3. የዜና ሰንጠረዥ
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. የኮንታክት (Settings) ሰንጠረዥ
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                school_name TEXT,
                address TEXT,
                phone TEXT,
                email TEXT
            )
        `);

        console.log("🚀 Neon Cloud Database Tables Verified & Ready!");
    } catch (err) {
        console.error("Database init error:", err.message);
    }
};

initDb();

// ከ SQLite መጠይቆች (db.prepare) ጋር ኮዱ እንዲናበብ አስመሳይ ረዳት ተግባር (Helper)
module.exports = {
    query: (text, params) => pool.query(text, params),
    prepare: (text) => {
        return {
            get: async (...params) => {
                const res = await pool.query(text.replace(/\?/g, (_, i) => `$${i + 1}`), params);
                return res.rows[0];
            },
            all: async (...params) => {
                const res = await pool.query(text.replace(/\?/g, (_, i) => `$${i + 1}`), params);
                return res.rows;
            },
            run: async (...params) => {
                return await pool.query(text.replace(/\?/g, (_, i) => `$${i + 1}`), params);
            }
        };
    }
};
