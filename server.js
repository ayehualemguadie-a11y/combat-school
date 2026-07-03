const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./database");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

// Render ላይ የፎቶ ማስቀመጫ ፎልደር መኖሩን ማረጋገጫ (ከሌለ ይፈጥረዋል)
const uploadDir = path.join(__dirname, "public", "images");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ፎቶዎች የሚቀመጡበት ቦታ ማስተካከያ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// የአድሚን ፓስወርድ ማስገደጃ (አንዴ ከገባህ በኋላ በ // መዝጋት ትችላለህ)
db.prepare("DELETE FROM admins").run();
db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run("admin", "admin123");

// ------------------ የገጾች ማሳያ መንገዶች (GET) ------------------

// ዋና ገጽ (Home Page)
app.get("/", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings LIMIT 1").get();
const news = db.prepare("SELECT * FROM news ORDER BY id DESC LIMIT 20").all();

    res.render("index", { settings, news });
});

// የጋለሪ ፎቶዎች ማሳያ ገጽ (Public Gallery Page)
app.get("/gallery", (req, res) => {
    const photos = db.prepare("SELECT * FROM gallery ORDER BY id DESC").all();
    res.render("gallery", { photos });
});

// 📸 1. የፎቶ መጫኛ ፎርም ገጽ (Upload Form Page)
app.get("/upload.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "upload.html"));
});

// 📰 3. ዜና መለጠፊያ ፎርም ገጽ (Add News Page)
app.get("/news.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "news.html"));
});

// ✏ 4. የዌብሳይት መረጃ ማስተካከያ ፎርም ገጽ (Edit Information Page)
app.get("/edit-website.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "edit-website.html"));
});

// 👤 5. የአድሚን አካውንት ማስተካከያ ፎርም ገጽ (Manage Admin Account Page)
app.get("/admin-account.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin-account.html"));
});

// ዳሽቦርድ ገጽ (Dashboard)
app.get("/dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// የመግቢያ ገጽ (Login Page)
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// 📝 2. የተማሪዎች ማመልከቻ ማሳያ ገጽ (View Applications List)
app.get("/view-applications.html", (req, res) => {
    // ማሳሰቢያ፦ መጀመሪያ በ database.js ላይ የ applications ሰንጠረዥ መኖሩን አረጋግጥ
    let apps = [];
    try {
        apps = db.prepare("SELECT * FROM applications ORDER BY id DESC").all();
    } catch(e) {
        // ሰንጠረዡ ከሌለ እዚሁ ይፈጥረዋል
        db.prepare(`CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT,
            age INTEGER,
            grade TEXT,
            parent_phone TEXT,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`).run();
    }

    let rows = apps.map(a => `
        <tr>
            <td style="padding:12px; border:1px solid #ddd;">${a.student_name || ''}</td>
            <td style="padding:12px; border:1px solid #ddd;">${a.age || ''}</td>
            <td style="padding:12px; border:1px solid #ddd;">${a.grade || ''}</td>
            <td style="padding:12px; border:1px solid #ddd;">${a.parent_phone || ''}</td>
        </tr>
    `).join('');

    res.send(`
        <div style="font-family:sans-serif; max-width:800px; margin:40px auto; padding:20px; box-shadow:0 0 10px rgba(0,0,0,0.1); border-radius:8px;">
            <h2>📝 Student Applications List</h2>
            <hr><br>
            <table style="width:100%; border-collapse:collapse;">
                <tr style="background:#222; color:#fff;">
                    <th style="padding:12px; text-align:left;">Student Name</th>
                    <th style="padding:12px; text-align:left;">Age</th>
                    <th style="padding:12px; text-align:left;">Grade</th>
                    <th style="padding:12px; text-align:left;">Parent Phone</th>
                </tr>
                ${rows.length > 0 ? rows : '<tr><td colspan="4" style="padding:20px; text-align:center; color:#777;">No applications found yet.</td></tr>'}
            </table>
            <br><br>
            <a href="/dashboard.html" style="display:inline-block; padding:10px 15px; background:#f4f4f4; color:#333; text-decoration:none; border-radius:4px; border:1px solid #ccc;">Back to Dashboard</a>
        </div>
    `);
});


// ------------------ መረጃ መቀበያ መንገዶች (POST) ------------------

// አድሚን ለመግባት (Login)
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const admin = db.prepare(
        "SELECT * FROM admins WHERE username = ? AND password = ?"
    ).get(username, password);

    if (admin) {
       res.redirect("/dashboard.html");
    } else {
        res.send("<h2>Invalid Username or Password</h2><br><a href='/login.html'>Try Again</a>");
    }
});

// 📸 ጋለሪ ፎቶ መጫኛ ተግባር (Upload Photo)
app.post("/upload", upload.single("photo"), (req, res) => {
    if (!req.file) return res.send("Please select a photo.");
    db.prepare("INSERT INTO gallery(filename) VALUES(?)").run(req.file.filename);
    res.send(`<h2>Photo uploaded successfully!</h2><br><a href="/upload.html">Upload Another Photo</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
});

// 📰 ዜና መለጠፊያ ተግባር (Publish News)
app.post("/upload-news", upload.single("image"), (req, res) => {
    db.prepare("INSERT INTO news(title, description, image) VALUES(?,?,?)")
      .run(req.body.title, req.body.description, req.file ? req.file.filename : "");
    res.send(`<h2>News Published Successfully!</h2><br><a href="/news.html">Add Another News</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
});

// ✏ የዌብሳይት መረጃ ማዳኛ ተግባር (Save Settings)
app.post("/save-settings", (req, res) => {
    db.prepare("DELETE FROM settings").run();
    db.prepare("INSERT INTO settings (school_name, address, phone, email) VALUES (?, ?, ?, ?)")
      .run(req.body.school_name, req.body.address, req.body.phone, req.body.email);
    res.send(`<h2>Website information saved successfully!</h2><br><a href="/edit-website.html">Back</a><br><br><a href="/dashboard.html">Go to Dashboard</a>`);
});

// 👤 የአድሚን अकाውንት መቀየሪያ ተግባር (Change Admin Account)
app.post("/change-admin", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    db.prepare("UPDATE admins SET username = ?, password = ? WHERE id = 1").run(username, password);
    res.send(`<h2>Admin account updated successfully!</h2><br><a href="/login.html">Go to Login</a>`);
});

// 📝 የተማሪዎች ማመልከቻ መቀበያ (ከዋናው ገጽ ፎርም ለሚላከው)
app.post("/apply", (req, res) => {
    db.prepare("INSERT INTO applications (student_name, age, grade, parent_phone) VALUES (?, ?, ?, ?)")
      .run(req.body.student_name, req.body.age, req.body.grade, req.body.parent_phone);
    res.send(`<h2>Application submitted successfully!</h2><br><a href="/">Go Home</a>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
