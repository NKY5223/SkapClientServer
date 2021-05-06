const ws = new WebSocket(location.href.replace(/^http/, "ws"));
ws.binaryType = "arraybuffer";

const userTable = document.getElementById("users");
const clients = [];

ws.addEventListener("message", e => {
    const msg = msgpack.decode(new Uint8Array(e.data));
    switch (msg.e) {
        case "adminJoined":
            log("Admin Joined");
            break;
        case "adminLeft":
            log("Admin Left");
            break;
        case "clientJoined":
            createClient("[UNKNOWN]", msg.ip);

            log(`Client ${msg.ip} joined`);
            break;
        case "usernameUpdate":
            const client = clients[msg.index];
            client.usernameEl.innerHTML = client.username = msg.username;

            log(`Client ${client.ip} logged in as ${msg.username}`);
            break;
        case "clients":
            for (let client of msg.clients) {
                createClient(client.username, client.ip);
            }
            log(`${msg.clients.length} client(s) loaded`)
            break;
    }
});

function createClient(username = "[UNKNOWN]", ip = "[UNKNOWN]") {
    const row = document.createElement("tr");
    const usernameEl = document.createElement("td");
    const ipEl = document.createElement("td");

    usernameEl.innerHTML = username;
    ipEl.innerHTML = ip;

    row.appendChild(usernameEl);
    row.appendChild(ipEl);
    userTable.appendChild(row);

    clients.push({
        usernameEl: usernameEl,
        username,
        ip
    });
}

const logDiv = document.getElementById("log");
function log(str = "") {
    logDiv.append(str);
    logDiv.appendChild(document.createElement("br"));
}