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
            createClient("[UNKNOWN]");

            log(`Client joined`);
            break;
        case "usernameUpdate":
            const client = clients[msg.index];
            client.usernameEl.innerHTML = client.username = msg.username;

            log(`Client ${msg.index} logged in as ${msg.username}`);
            break;
        case "clients":
            for (let client of msg.clients) {
                createClient(client.username);
            }
            log(`${msg.clients.length} client(s) loaded`)
            break;
    }
});

function createClient(username = "[UNKNOWN]") {
    const row = document.createElement("tr");
    const usernameEl = document.createElement("td");

    usernameEl.innerHTML = username;
    row.appendChild(usernameEl);
    row.appendChild(ipEl);
    userTable.appendChild(row);

    clients.push({
        usernameEl: usernameEl,
        username
    });
}

const logDiv = document.getElementById("log");
function log(str = "") {
    logDiv.append(str);
    logDiv.appendChild(document.createElement("br"));
}