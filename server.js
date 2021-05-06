require("dotenv").config();

const app = require("express")();
const server = app.listen(4000);
const WSServer = new (require("ws").Server)({ server });

const fs = require("fs");
const msgpack = require("msgpack-lite");

const key = process.env.KEY;

console.log("Key:", key);

app.get("/", (req, res) => {
    if (req.query.key && req.query.key === key) {
        fs.readFile("admin/index.html", "utf8", (err, data) => {
            if (err) {
                res.send(err.toString());
            } else {
                res.send(
                    data
                        .replace("{{style}}", `<style>\n${fs.readFileSync("admin/style.css")}\n</style>`)
                        .replace("{{script}}", `<script>\n${fs.readFileSync("admin/script.js")}\n</script>`)
                );
            }
        });
    } else {
        res.status(403).send(errorPage("Error 403 Forbidden"));
    }
});
server.on("listening", () => {
    console.log("Listening");
});

/** @type {WebSocket[]} */
const admins = [];
/** @type {Client[]} */
const clients = [];


WSServer.on("connection", (ws, req) => {
    ws.binaryType = "arraybuffer";
    const isAdmin = new URLSearchParams(req.url.slice(1)).get("key") === key;

    if (isAdmin) {
        // Admin
        const index = admins.push(ws) - 1;
        broadcastAdmins(msgpack.encode({ e: "adminJoined", index }));

        // "History"
        if (clients.length) {
            const clientArr = [];
            for (let client of clients) {
                clientArr.push({
                    ip: client.ip,
                    username: client.username
                });
            }
            ws.send(msgpack.encode({ e: "clients", clients: clientArr }));

            // Bye
            ws.addEventListener("close", () => {
                broadcastAdmins(msgpack.encode({ e: "adminLeft", index }));
                admins.splice(index, 1);
            });
        }
    } else {
        // User
        const client = new Client(ws, req.socket.remoteAddress);
        const index = clients.push(client) - 1;
        broadcastAdmins(msgpack.encode({ e: "clientJoined", index, ip: client.ip }));

        // Update
        ws.addEventListener("message", e => {
            const msg = msgpack.decode(new Uint8Array(e.data));
            switch (msg.e) {
                case "username":
                    client.username = msg.username;
                    broadcastAdmins(msgpack.encode({ e: "usernameUpdate", username: msg.username, index }));
                    break;
            }
        });

        // Bye
        ws.addEventListener("close", () => {
            clients.splice(index, 1);
            broadcastAdmins(msgpack.encode({ e: "clientLeft", index }));
        });
    }
});


class Client {
    /** 
     * @param {WebSocket} ws 
     * @param {string} ip
     */
    constructor(ws, ip) {
        this.username = "[UNKNOWN]";
        this.ws = ws;
        this.ip = ip;
    }
}



function errorPage(message = "Error 404<br>Error Message not found") {
    return `<!DOCTYPE html>
    <html>
        <head>
            <title>403 Forbidden</title>
        </head>
        <body style="background: #2080ff">
            <h1 style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); color: #ffffff; font: 50px Consolas, monospace; margin: 0;">${message}</h1>
        </body>
    </html>`;
}

function broadcastAdmins(message) {
    for (let ws of admins) {
        ws.send(message);
    }
}