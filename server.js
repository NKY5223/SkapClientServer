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

    broadcast({
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
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                }
                broadcast({
                    e: "clientUsername",
                    from: client.username,
                    to: client.username = msg.username
                });
                break;
            case "username":
                if (typeof msg.username !== "string" || msg.username.length < 3 || msg.username.length > 15) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                    return;
                }
                if (msg.username === client.username) return;
                broadcast({
                    e: "clientUsername",
                    from: client.username,
                    to: client.username = msg.username
                });
                break;
            case "msg":
                if (typeof msg.message !== "string") {
                    clients.splice(clients.indexOf(client), 1);
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                    return;
                }
                broadcast({
                    e: "msg",
                    author: client.username,
                    message: msg.message.slice(0, 200)
                });
                break;
            case "fuel":
                if ((typeof msg.fuel !== "number") || (msg.fuel < 0) || (msg.fuel > 10)) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                    return;
                }
                broadcast({
                    e: "fuel",
                    user: client.username,
                    fuel: msg.fuel
                });
                break;
            case "power":
                if ((msg.slot !== 0 && msg.slot !== 1) || (typeof msg.power !== "number") || (!Number.isInteger(msg.power)) || (msg.power < 0) || (msg.power > 11)) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                    return;
                }
                broadcast({
                    e: "power",
                    user: client.username,
                    slot: msg.slot,
                    power: msg.power
                });
                break;
            case "cooldown":
                if ((msg.slot !== 0 && msg.slot !== 1) || (typeof msg.cooldown !== "number") || (msg.cooldown < 0) || (msg.cooldown > 1)) {
                    clients.splice(clients.indexOf(client), 1);
                    broadcast({
                        e: "clientLeft",
                        user: client.username
                    });
                    return;
                }
                broadcast({
                    e: "cooldown",
                    user: client.username,
                    slot: msg.slot,
                    cooldown: msg.cooldown
                });
                break;
        }
    });

    // Bye
    ws.addEventListener("close", () => {
        broadcast({
            e: "clientLeft",
            user: client.username
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
function broadcast(message) {
    for (let client of clients) {
        client.ws.send(msgpack.encode(message));
    }
}