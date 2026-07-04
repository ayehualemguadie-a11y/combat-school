const { Pool } = require("pg");

// ☁️ የ Neon የክላውድ PostgreSQL ዴታቤዝ ግንኙነት
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_XQ9iMtaG5gFJ@ep-long-feather-at49rajs.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

// ዴታቤዝ ውስጥ ሰንጠረዦች ከሌሉ በራስ-ሰር እንዲፈጥር ማዘጋጀት
const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS gallery (id SERIAL PRIMARY KEY, filename TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS news (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, school_name TEXT, address TEXT, phone TEXT, email TEXT)`);
        console.log("🚀 Neon Cloud Database Tables Verified & Ready!");
    } catch (err) {
        console.error("Database init error:", err.message);
    }
};

initDb();

// 💡 የ PostgreSQL መረጃ ዓይነቶችን (Data Types) በትክክል ለይቶ የሚያስተካክል ረዳት (Helper)
module.exports = {
    query: (text, params) => pool.query(text, params),
    prepare: (text) => {
        const pgText = text.replace(/\?/g, (_, i) => `$${i + 1}`);
        return {
            get: async (...params) => {
                // ⚠️ የ parameter ስህተትን ለመከላከል መረጃዎቹን ወደ string/ጽሑፍ እንለውጣቸዋለን
                const cleanParams = params.map(p => p !== undefined && p !== null ? String(p) : null);
                const res = await pool.query(pgText, cleanParams);
                return res.rows.length > 0 ? res.rows[0] : null; 
            },
            all: async (...params) => {
                const cleanParams = params.map(p => p !== undefined && p !== null ? String(p) : null);
                const res = await pool.query(pgText, cleanParams);
                return res.rows;
            },
            run: async (...params) => {
                const cleanParams = params.map(p => p !== undefined && p !== null ? String(p) : null);
                return await pool.query(pgText, cleanParams);
            }
        };
    }
};
