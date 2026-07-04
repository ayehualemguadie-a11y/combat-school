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
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// የአድሚን ፓስወርድ እና የኮንታክት መረጃ ማስገደጃ (ክላውድ)
const setupDatabase = async () => {
    try {
        const adminCheck = await db.prepare("SELECT * FROM admins LIMIT 1").get();
        if (!adminCheck || adminCheck.length === 0) {
            await db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run("admin", "admin123");
            console.log("Default admin verified on cloud.");
        }

        const settingsCheck = await db.prepare("SELECT * FROM settings LIMIT 1").get();
        if (!settingsCheck || settingsCheck.length === 0) {
            await db.prepare(`
                INSERT INTO settings (school_name, address, phone, email) 
                VALUES (?, ?, ?, ?)
            `).run(
                "Combat Technic School",
                "0335400666", 
                "0335400640",
                "e.mail-combat_technique@mode.gov.et"
            );
            console.log("Default contact info verified on cloud.");
        }
    } catch (err) {
        console.log("Cloud db verification setup error:", err.message);
    }
};
setupDatabase();

// ------------------ የገጾች ማሳያ መንገዶች (GET) ------------------

// ዋና ገጽ (Home Page)
// 🏠 ዋና ገጽ (Home Page) - የክላውድ መረጃ አደራደር ማስተካከያ
app.get("/", async (req, res) => {
    try {
        const settingsRows = await db.prepare("SELECT * FROM settings LIMIT 1").get();
        const newsRows = await db.prepare("SELECT * FROM news ORDER BY id DESC LIMIT 20").all();
        
        // ⚠️ PostgreSQL ሁልጊዜ ዝርዝር (Array) ስለሚመልስ የመጀመሪያውን መስመር በዚህ መልኩ እንነጥላለን
        const settings = (settingsRows && settingsRows.length > 0) ? settingsRows[0] : null;
        
        res.render("index", { settings, news: newsRows });
    } catch (err) {
        res.send("Error loading home page: " + err.message);
    }
});


// የጋለሪ ፎቶዎች ማሳያ ገጽ
app.get("/gallery", async (req, res) => {
    try {
        const photos = await db.prepare("SELECT * FROM gallery ORDER BY id DESC").all();
        res.render("gallery", { photos });
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

// ------------------ መረጃ መቀበያ መንገዶች (POST) ------------------

// አድሚን ለመግባት (Login - ⚠️ Updated for Cloud DB)
// 👤 አድሚን ለመግባት (Login) - የክላውድ መረጃ አደራደር ማስተካከያ
// 👤 አድሚን ለመግባት (Login) - ለክላውድ ፖስትግሬስ ዳታ ታይፕ ፍጹም የተስተካከለ
app.post("/login", async (req, res) => {
    const username = String(req.body.username || "");
    const password = String(req.body.password || "");

    try {
        // 💡 ::text የሚለው ምልክት ለክላውድ ዴታቤዙ የላክንለት መረጃ ጽሑፍ መሆኑን በግልጽ ያሳውቃል!
        const rows = await db.prepare("SELECT * FROM admins WHERE username = ?::text AND password = ?::text").get(username, password);
        
        if (rows && rows.length > 0) {
            res.redirect("/dashboard.html");
        } else {
            res.send("<h2>Invalid Username or Password</h2><br><a href='/login.html'>Try Again</a>");
        }
    } catch (err) {
        res.send("Login Error: " + err.message);
    }
});



// 📸 ጋለሪ ፎቶ መጫኛ ተግባር (⚠️ Updated for Cloud DB)
app.post("/upload", upload.single("photo"), async (req, res) => {
    if (!req.file) return res.send("Please select a photo.");
    try {
        await db.prepare("INSERT INTO gallery(filename) VALUES(?)").run(req.file.path);
        res.send(`<h2>Photo uploaded successfully to Cloud Storage!</h2><br><a href="/upload.html">Upload Another Photo</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
    } catch (err) {
        res.send("Upload Error: " + err.message);
    }
});

// 📰 ዜና እና ማስታወቂያዎችን መለጠፊያ ተግባር (⚠️ Updated for Cloud DB)
app.post("/upload-news", upload.single("image"), async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const imageUrl = req.file ? req.file.path : "";

    try {
        await db.prepare("INSERT INTO news (title, description, image) VALUES (?, ?, ?)").run(title, description, imageUrl);
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

// 👤 የአድሚን አካውንት መቀየሪያ ተግባር (⚠️ Updated for Cloud DB)
app.post("/change-admin", async (req, res) => {
    const newUsername = req.body.username;
    const newPassword = req.body.password;

    if (!newUsername || !newPassword) {
        return res.send("<h2>Please fill out both username and password fields.</h2><br><a href='/admin-account.html'>Try Again</a>");
    }

    try {
        // በመጀመሪያ አድሚን መኖሩን ለማረጋገጥ መታወቂያውን (ID) ያገኛል
        const adminCheck = await db.prepare("SELECT id FROM admins LIMIT 1").get();
        const adminId = adminCheck && adminCheck.length > 0 ? adminCheck[0].id : 1;

        await db.prepare("UPDATE admins SET username = ?, password = ? WHERE id = ?").run(newUsername, newPassword, adminId);
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
