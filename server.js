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

// ⚠️ የቆየውን የ try-catch ክፍል አጥፍተህ ይህንን አዲሱን የክላውድ ኮድ ለጥፈው (Paste)፦
const setupDatabase = async () => {
    try {
        // አድሚን መኖሩን በክላውድ ላይ ይፈትሻል
        const adminCheck = await db.prepare("SELECT * FROM admins LIMIT 1").get();
        if (!adminCheck || adminCheck.length === 0) {
            await db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run("admin", "admin123");
            console.log("Default admin verified on cloud.");
        }

        // የኮንታክት መረጃ መኖሩን በክላውድ ላይ ይፈትሻል
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
app.get("/", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings LIMIT 1").get();
    const news = db.prepare("SELECT * FROM news ORDER BY id DESC LIMIT 20").all();
    res.render("index", { settings, news });
});

// የጋለሪ ፎቶዎች ማሳያ ገጽ
app.get("/gallery", (req, res) => {
    const photos = db.prepare("SELECT * FROM gallery ORDER BY id DESC").all();
    res.render("gallery", { photos });
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

// 📸 ጋለሪ ፎቶ መጫኛ ተግባር
app.post("/upload", upload.single("photo"), (req, res) => {
    if (!req.file) return res.send("Please select a photo.");
    db.prepare("INSERT INTO gallery(filename) VALUES(?)").run(req.file.path);
    res.send(`<h2>Photo uploaded successfully to Cloud Storage!</h2><br><a href="/upload.html">Upload Another Photo</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
});

// 📰 ዜና እና ማስታወቂያዎችን መለጠፊያ ተግባር
app.post("/upload-news", upload.single("image"), (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const imageUrl = req.file ? req.file.path : "";

    db.prepare("INSERT INTO news (title, description, image) VALUES (?, ?, ?)")
      .run(title, description, imageUrl);

    res.send(`
        <div style="font-family:sans-serif; text-align:center; margin-top:50px;">
            <h2 style="color:green;">📰 News Published Successfully to Cloud Storage!</h2>
            <br>
            <a href="/news.html" style="padding:10px; background:#222; color:#fff; text-decoration:none; border-radius:5px;">Add Another News</a>
            <br><br><br>
            <a href="/dashboard.html" style="color:#555;">Back to Dashboard</a>
        </div>
    `);
});

// 👤 የአድሚን አካውንት መቀየሪያ ተግባር
app.post("/change-admin", (req, res) => {
    const newUsername = req.body.username;
    const newPassword = req.body.password;

    if (!newUsername || !newPassword) {
        return res.send("<h2>Please fill out both username and password fields.</h2><br><a href='/admin-account.html'>Try Again</a>");
    }

    try {
        db.prepare("UPDATE admins SET username = ?, password = ? WHERE id = 1").run(newUsername, newPassword);
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
