require("dotenv").config();

const app = require("express")();
const server = app.listen(4000);
const WSServer = new (require("ws").Server)({ server });

const fs = require("fs");

/** @type {WebSocket | null} */
let adminWS = null;

const key = (function generate(len) {
    const chars = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
    let str = "";
    for (let i = 0; i < len; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
})(32);
console.log("Key:", key);

app.get("/", (req, res) => {
    if (adminWS === null) {
        if (req.hostname === "localhost" || req.query.key && req.query.key === key) {
            fs.readFile("view/index.html", "utf8", (err, data) => {
                if (err) {
                    res.send(err.toString());
                } else {
                    res.send(
                        data
                            .replace("{{style}}", `<style>\n${fs.readFileSync("view/style.css")}\n</style>`)
                            .replace("{{script}}", `<script>\n${fs.readFileSync("view/script.js")}\n</script>`)
                    );
                }
            });
        } else {
            res.status(403).send("Error 403 Forbidden");
        }
    } else {
        res.status(403).send("Error 403 Already-has-admin-lmao")
    }
});
server.on("listening", () => {
    console.log("Listening");
});

WSServer.on("connection", (ws, req) => {
    const isAdmin = new URL(req.url).searchParams.get("key") === key;

    if (isAdmin) {
        // Admin
        adminWS = ws;
        ws.on("close", () => {
            adminWS = null;
        });
    } else {
        // User
    }
});