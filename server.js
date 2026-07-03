const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const db = require("./database");
const app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
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
app.post("/upload", upload.single("photo"), (req, res) => {

    db.prepare(
        "INSERT INTO gallery(filename) VALUES(?)"
    ).run(req.file.filename);

    res.send(`
    <h2>Photo uploaded successfully!</h2>

    File: ${req.file.filename}

    <br><br>

    <a href="/upload.html">Upload Another Photo</a>

    <br><br>

    <a href="/gallery.html">View Gallery</a>
    `);

});
app.post("/upload-news", upload.single("image"), (req, res) => {

    db.prepare(
        "INSERT INTO news(title, description, image) VALUES(?,?,?)"
    ).run(
        req.body.title,
        req.body.description,
        req.file.filename
    );

    res.send(`
        <h2>News Published Successfully!</h2>

        <br>

        <a href="/news.html">Add Another News</a>

        <br><br>

        <a href="/">Go Home</a>
    `);

});
app.get("/", (req, res) => {

    const settings = db.prepare("SELECT * FROM settings LIMIT 1").get();

    const news = db.prepare(
        "SELECT * FROM news ORDER BY id DESC LIMIT 5"
    ).all();

    res.render("index", {
        settings,
        news
    });

});
app.get("/gallery", (req, res) => {

    const photos = db.prepare(
        "SELECT * FROM gallery ORDER BY id DESC"
    ).all();

    res.render("gallery", { photos });

});
app.get("/", (req, res) => {

    const news = db.prepare(
        "SELECT * FROM news ORDER BY id DESC"
    ).all();

    res.render("index", { news });

});
app.post("/save-settings", (req, res) => {

    db.prepare("DELETE FROM settings").run();

    db.prepare(`
        INSERT INTO settings
        (school_name, address, phone, email)
        VALUES (?, ?, ?, ?)
    `).run(
        req.body.school_name,
        req.body.address,
        req.body.phone,
        req.body.email
    );

    res.send(`
        <h2>Website information saved successfully!</h2>

        <br><br>

        <a href="/edit-website.html">Back</a>
    `);

});
app.post("/change-admin", (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    db.prepare(`
        UPDATE admins
        SET username = ?, password = ?
        WHERE id = 1
    `).run(username, password);

    res.send(`
        <h2>Admin account updated successfully!</h2>

        <br><br>

        <a href="/admin-account.html">Back</a>

        <br><br>

        <a href="/login.html">Go to Login</a>
    `);

});
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
