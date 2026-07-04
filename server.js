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
    api_key: 'My3ih-4o5BWb8n9r8Wv2X03H-vo',
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

// የአድሚን ፓስወርድ ማስገደጃ
try {
    db.prepare("DELETE FROM admins").run();
    db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run("admin", "admin123");
} catch (err) {
    console.log("Admin setup:", err.message);
}

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

// 📸 ጋለሪ ፎቶ መጫኛ ተግባር (በ Cloudinary የተስተካከለ)
app.post("/upload", upload.single("photo"), (req, res) => {
    if (!req.file) return res.send("Please select a photo.");

    db.prepare("INSERT INTO gallery(filename) VALUES(?)").run(req.file.path);

    res.send(`<h2>Photo uploaded successfully to Cloud Storage!</h2><br><a href="/upload.html">Upload Another Photo</a><br><br><a href="/dashboard.html">Back to Dashboard</a>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
