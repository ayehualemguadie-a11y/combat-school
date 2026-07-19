const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./database"); 

// ☁️ የ Cloudinary ማገናኛ ኮድ
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: 'lpaxylxn',
    api_key: '881511541899897',
    api_secret: 'My3ih-4o5BWb'
});

// ፎቶዎችን ቀጥታ ክላውድ ላይ ለመጫን ማዘጋጀት
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'combat_school_gallery',
        allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
    }
});

const upload = multer({ storage: storage });
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// 👤 የክላውድ ዴታቤዝ መነሻ ዝግጅት (የመጀመሪያውን አድሚን ይፈጥራል)
const setupDatabase = async () => {
    try {
        // አድሚን መኖሩን ማረጋገጥ
        const adminCheck = await db.query("SELECT * FROM admins LIMIT 1");
        if (adminCheck.rows.length === 0) {
            await db.query("INSERT INTO admins (username, password) VALUES ($1, $2)", ["admin", "admin123"]);
        }

        // 📞 የኮንታክት መረጃው ባዶ ከሆነ በግድ እንዲሞላ ማድረግ (ይህ የ 500 ስህተቱን ይፈታል!)
        const settingsCheck = await db.query("SELECT * FROM settings LIMIT 1");
        if (settingsCheck.rows.length === 0) {
            await db.query(`
                INSERT INTO settings (school_name, address, phone, email) 
                VALUES ($1, $2, $3, $4)
            `, [
                "Combat Technic School", 
                "0335400666", // Fax
                "0335400640", // Phone
                "e.mail-combat_technique@mode.gov.et" // Email
            ]);
            console.log("🚀 Official military contact information seeded to cloud!");
        }
    } catch (err) {
        console.log("Cloud db setup trace:", err.message);
    }
};
setupDatabase();


// ------------------ የገጾች ማሳያ መንገዶች (GET) ------------------

// ዋና ገጽ (Home Page)
app.get("/", async (req, res) => {
    try {
        const settingsResult = await db.query("SELECT * FROM settings LIMIT 1");
        const newsResult = await db.query("SELECT * FROM news ORDER BY id DESC LIMIT 20");
        
        const settings = settingsResult.rows.length > 0 ? settingsResult.rows[0] : null;
        res.render("index", { settings, news: newsResult.rows });
    } catch (err) {
        res.send("Error loading home page: " + err.message);
    }
});

// የጋለሪ ፎቶዎች ማሳያ ገጽ
app.get("/gallery", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM gallery ORDER BY id DESC");
        res.render("gallery", { photos: result.rows });
    } catch (err) {
        res.send("Error loading gallery: " + err.message);
    }
});

// የፎቶ መጫኛ ፎርም ገጽ
app.get("/upload.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "upload.html"));
});

// ዳሽቦርድ ገጽ
app.get("/dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// የመግቢያ ገጽ
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});
// 👁️ የራዕይና ተልዕኮ ገጽን (vision.ejs) ለሰርቨሩ የሚያስተዋውቅ አዲሱ የዕዝ መስመር
app.get('/vision', (req, res) => {
    res.render('vision');
});


// ------------------ መረጃ መቀበያ መንገዶች (POST) ------------------

// አድሚን ለመግባት (Login)
app.post("/login", async (req, res) => {
    const username = String(req.body.username || "");
    const password = String(req.body.password || "");

    try {
        const result = await db.query("SELECT * FROM admins WHERE username = $1 AND password = $2", [username, password]);
        
        if (result && result.rows.length > 0) {
            res.redirect("/dashboard.html");
        } else {
            res.send("<h2>Invalid Username or Password</h2><br><a href='/login.html'>Try Again</a>");
        }
    } catch (err) {
        res.send("Login Error: " + err.message);
    }
});

// 📸 ጋለሪ ፎቶ መጫኛ ተግባር
app.post("/upload", upload.single("photo"), async (req, res) => {
    if (!req.file) return res.send("Please select a photo.");
    try {
        await db.query("INSERT INTO gallery (filename) VALUES ($1)", [req.file.path]);
        res.send(`<h2>Photo uploaded successfully to Cloud Storage!</h2><br><a href="/upload.html">Upload Another Photo</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
    } catch (err) {
        res.send("Upload Error: " + err.message);
    }
});

// 📰 ዜና እና ማስታወቂያዎችን መለጠፊያ ተግባር
app.post("/upload-news", upload.single("image"), async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const imageUrl = req.file ? req.file.path : "";

    try {
        await db.query("INSERT INTO news (title, description, image) VALUES ($1, $2, $3)", [title, description, imageUrl]);
        res.send(`
            <div style="font-family:sans-serif; text-align:center; margin-top:50px;">
                <h2 style="color:green;">📰 News Published Successfully to Cloud Storage!</h2>
                <br>
                <a href="/news.html" style="padding:10px; background:#222; color:#fff; text-decoration:none; border-radius:5px;">Add Another News</a>
                <br><br><br>
                <a href="/dashboard.html" style="color:#555;">Back to Dashboard</a>
            </div>
        `);
    } catch (err) {
        res.send("News Upload Error: " + err.message);
    }
});

// 👤 የአድሚን አካውንት መቀየሪያ ተግባር
app.post("/change-admin", async (req, res) => {
    const newUsername = req.body.username;
    const newPassword = req.body.password;

    if (!newUsername || !newPassword) {
        return res.send("<h2>Please fill out both username and password fields.</h2><br><a href='/admin-account.html'>Try Again</a>");
    }

    try {
        const adminCheck = await db.query("SELECT id FROM admins LIMIT 1");
        const adminId = adminCheck.rows.length > 0 ? adminCheck.rows[0].id : 1;

        await db.query("UPDATE admins SET username = $1, password = $2 WHERE id = $3", [newUsername, newPassword, adminId]);
        res.send(`
            <div style="font-family:sans-serif; text-align:center; margin-top:50px;">
                <h2 style="color:green;">👤 Admin Account Updated Successfully!</h2>
                <p>Please use your new credentials next time you log in.</p>
                <br>
                <a href="/login.html" style="padding:10px 15px; background:#111827; color:#fff; text-decoration:none; border-radius:5px;">Go to Login Page</a>
                <br><br><br>
                <a href="/dashboard.html" style="color:#555;">Back to Dashboard</a>
            </div>
        `);
    } catch (err) {
        res.send(`<h2>Error updating admin account: ${err.message}</h2><br><a href="/admin-account.html">Back</a>`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
