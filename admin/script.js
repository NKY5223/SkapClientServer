const ws = new WebSocket(location.href.replace(/^http/, "ws"));
ws.binaryType = "arraybuffer";

const userTable = document.getElementById("users");
/** @type {{el: HTMLTableRowElement, usernameEl: HTMLTableDataCellElement, indexEl: HTMLTableDataCellElement, username: string}[]} */
const clients = [];

ws.addEventListener("message", e => {
    const msg = msgpack.decode(new Uint8Array(e.data));

    switch (msg.e) {
        case "adminJoined":
            log("[JOIN] Admin");
            break;
        case "adminLeft":
            log("[LEAVE] Admin");
            console.log("e");
            break;
        case "clientJoined":
            createClient(msg.index, "[UNKNOWN]");

            log(`[JOIN] Client`);
            break;
        case "clientLeft": {
            const client = clients.splice(msg.index, 1)[0];
            client.el.remove();

            log(`[LEAVE] ${msg.index} ("${client.username}")`);
            break;
        }
        case "usernameUpdate": {
            const client = clients[msg.index];

            client.usernameEl.innerHTML = client.username = msg.username;

            log(`[LOGIN] ${msg.index} as ${msg.username}`);
            break;
        }
        case "clients": {
            for (let i in msg.clients) {
                createClient(i, msg.clients[i].username);
            }
            log(`[LOAD] ${msg.clients.length} client(s)`)
            break;
        }
        case "msg": {
            log(`[/msg] ${msg.author}: ${msg.message}`);
            break;
        }
        case "join": {
            log(`[JOIN] ${msg.index} ("${clients[msg.index]}") ${msg.id} ("${msg.name}")`);
            break;
        }
    }
});
ws.addEventListener("close", () => {
    document.body.innerHTML = "WebSocket closed :/";
});

function createClient(index = 0, username = "[UNKNOWN]") {
    const row = document.createElement("tr");
    const usernameEl = document.createElement("td");
    const indexEl = document.createElement("td");

    usernameEl.innerHTML = username;

    row.appendChild(indexEl);
    row.appendChild(usernameEl);
    userTable.appendChild(row);

    clients.push({
        el: row,
        usernameEl: usernameEl,
        username
    });
}

const logDiv = document.getElementById("log");
function log(str = "") {
    const p = document.createElement("p");
    const timestamp = document.createElement("span");
    const time = new Date();

    p.innerHTML = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    timestamp.innerHTML = `${fillZeros(time.getHours(), 2)}:${fillZeros(time.getMinutes(), 2)}.${fillZeros(time.getSeconds(), 2)}`;
    timestamp.classList.add("timestamp");

    p.appendChild(timestamp);
    logDiv.appendChild(p);
}
function fillZeros(num = 0, digits = 2, char = "0") {
    return char.repeat(digits - String(num).length) + String(num);
}