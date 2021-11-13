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

    broadcastClients({
        e: "clientJoined",
        username: client.username
    });
    ws.send(msgpack.encode({
        e: "clients",
        clients: clients.map(client => client.username)
    }));

    // Update
    ws.addEventListener("message", e => {
        const msg = msgpack.decode(new Uint8Array(e.data));
        switch (msg.e) {
            case "login":
                if (typeof msg.username !== "string" || msg.username.length < 3 || msg.username.length > 15) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcastClients({
                        e: "clientLeft",
                        username: client.username
                    });
                }
                client.username = msg.username;
                break;
            case "username":
                if (typeof msg.username !== "string" || msg.username.length < 3 || msg.username.length > 15) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcastClients({
                        e: "clientLeft",
                        username: client.username
                    });
                }
                client.username = msg.username;
                break;
            case "msg":
                if (typeof msg.message !== "string") {
                    clients.splice(clients.indexOf(client), 1);
                    broadcastClients({
                        e: "clientLeft",
                        username: client.username
                    });
                }
                broadcastClients({
                    e: "msg",
                    author: client.username,
                    message: msg.message.slice(0, 200)
                });
                break;
            case "fuel":
                broadcastClients({
                    e: "fuel",
                    user: client.username,
                    fuel: msg.fuel
                });
                break;
            case "powers":
                break;
        }
    });

    // Bye
    ws.addEventListener("close", () => {
        broadcastClients({
            e: "clientLeft",
            username: client.username
        });
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