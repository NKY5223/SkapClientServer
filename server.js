require("dotenv").config();

const app = require("express")();
const server = app.listen(4000);
const WSServer = new (require("ws").Server)({ server });

const msgpack = require("msgpack-lite");

app.get("*", (req, res) => res.send("Server online"));

server.on("listening", () => {
    console.log("Listening");
});

/** @type {Client[]} */
const clients = [];


WSServer.on("connection", (ws, req) => {
    ws.binaryType = "arraybuffer";
    const client = new Client(ws);
    clients.push(client);

    broadcastClients(msgpack.encode({
        e: "clientJoined",
        username: client.username
    }));

    // Update
    ws.addEventListener("message", e => {
        const msg = msgpack.decode(new Uint8Array(e.data));
        switch (msg.e) {
            case "login":
                client.username = msg.username;
                break;
            case "username":
                client.username = msg.username;
                break;
            case "msg":
                broadcastClients({
                    e: "msg",
                    author: client.username,
                    message: msg.message
                });
                break;
            case "join":
                broadcastClients({
                    e: "msg",
                    author: client.username,
                    message: msg.message
                });
                break;
            case "fuel":
                broadcastClients({
                    e: "fuel",
                    user: client.username,
                    fuel: msg.fuel
                });
        }
    });

    // Bye
    ws.addEventListener("close", () => {
        broadcastClients(msgpack.encode({
            e: "clientLeft",
            username: client.username
        }));
        clients.splice(clients.indexOf(client), 1);
    });
});


class Client {
    /** 
     * @param {WebSocket} ws 
     */
    constructor(ws) {
        this.username = "[UNKNOWN]";
        this.ws = ws;
    }
}
function broadcastClients(message) {
    for (let client of clients) {
        client.ws.send(msgpack.encode(message));
    }
}
function clientjoined() {
}