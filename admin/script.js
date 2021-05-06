const ws = new WebSocket(location.href.replace(/^http/, "ws"));
ws.binaryType = "arraybuffer";

const userTable = document.getElementById("users");
/** @type {{el: HTMLTableRowElement, usernameEl: HTMLTableDataCellElement, indexEl: HTMLTableDataCellElement, username: string}[]} */
const clients = [];

ws.addEventListener("message", e => {
    const msg = msgpack.decode(new Uint8Array(e.data));

    switch (msg.e) {
        case "adminJoined":
            log("Admin Joined");
            break;
        case "adminLeft":
            log("Admin Left");
            console.log("e");
            break;
        case "clientJoined":
            createClient(msg.index, "[UNKNOWN]");

            log(`Client joined`);
            break;
        case "clientLeft": {
            const client = clients.splice(msg.index, 1)[0];
            client.el.remove();

            for (let i in clients) {
                clients[i].indexEl.innerHTML = i;
            }

            log(`Client ${msg.index} ("${client.username}") left`);
            break;
        }
        case "usernameUpdate": {
            const client = clients[msg.index];

            client.usernameEl.innerHTML = client.username = msg.username;

            log(`Client ${msg.index} logged in as ${msg.username}`);
            break;
        }
        case "clients": {
            for (let i in msg.clients) {
                createClient(i, msg.clients[i].username);
            }
            log(`${msg.clients.length} client(s) loaded`)
            break;
        }
    }
});

function createClient(index = 0, username = "[UNKNOWN]") {
    const row = document.createElement("tr");
    const usernameEl = document.createElement("td");
    const indexEl = document.createElement("td");

    usernameEl.innerHTML = username;
    indexEl.innerHTML = index;

    row.appendChild(indexEl);
    row.appendChild(usernameEl);
    userTable.appendChild(row);

    clients.push({
        el: row,
        usernameEl: usernameEl,
        username,
        indexEl
    });
}

const logDiv = document.getElementById("log");
function log(str = "") {
    logDiv.append(str);
    logDiv.appendChild(document.createElement("br"));
}