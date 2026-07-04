const { Pool } = require("pg");

// ☁️ የ Neon የክላውድ PostgreSQL ዴታቤዝ ግንኙነት
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_XQ9iMtaG5gFJ@ep-long-feather-at49rajs.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

// 🔒 የቆዩትን አወቃቀሮች አጽድቶ አዲስ ንጹሕ የክላውድ ሰንጠረዦችን በቋሚነት የሚቆልፍ ተግባር
const initDb = async () => {
    try {
        // የቆዩትን እና የተጋጩትን ሰንጠረዦች ሙሉ በሙሉ ያጸዳል
        //await pool.query(`DROP TABLE IF EXISTS settings CASCADE`);
        //await pool.query(`DROP TABLE IF EXISTS gallery CASCADE`);
        //await pool.query(`DROP TABLE IF EXISTS news CASCADE`);
        //await pool.query(`DROP TABLE IF EXISTS admins CASCADE`);

        // 1. አዲስ የጋለሪ ሰንጠረዥ
        await pool.query(`
            CREATE TABLE gallery (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL
            )
        `);
        
        // 2. አዲስ የአድሚን ሰንጠረዥ
        await pool.query(`
            CREATE TABLE admins (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )
        `);
        
        // 3. አዲስ የዜና ሰንጠረዥ
        await pool.query(`
            CREATE TABLE news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 4. አዲስ የኮንታክት (Settings) ሰንጠረዥ - ፍጹም የተስተካከለ
        await pool.query(`
            CREATE TABLE settings (
                id SERIAL PRIMARY KEY,
                school_name TEXT,
                address TEXT,
                phone TEXT,
                email TEXT
            )
        `);
        
        console.log("🚀 ALL NEON CLOUD TABLES ARE COMPLETELY RE-BUILT & SECURED!");
    } catch (err) {
        console.error("Database init error:", err.message);
    }
};

initDb();

module.exports = {
    query: (text, params) => pool.query(text, params)
};
