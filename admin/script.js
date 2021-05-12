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
            createClient("[UNKNOWN]");

            log(`[JOIN] Client`);
            break;
        case "clientLeft": {
            const client = clients.splice(msg.index, 1)[0];
            client.el.remove();

            log(`[LEAVE] ${msg.index} ("${html(client.username)}")`);
            break;
        }
        case "login": {
            const client = clients[msg.index];

            client.usernameEl.innerHTML = client.username = msg.username;

            log(`[LOGIN] ${msg.index} as ${html(msg.username)}`);
            break;
        }
        case "username": {
            const client = clients[msg.index];

            client.usernameEl.innerHTML = client.username = msg.username;
            break;
        }
        case "clients": {
            for (let i in msg.clients) {
                createClient(msg.clients[i].username);
            }
            log(`[LOAD] ${msg.clients.length} client(s)`)
            break;
        }
        case "msg": {
            log(`[/msg] ${msg.author}: ${html(msg.message)}`);
            break;
        }
        case "join": {
            log(`[JOIN] ${msg.index} ("${html(clients[msg.index].username)}") ${msg.id} ("${html(msg.name)}")`);
            break;
        }
        case "exec": {
            log(`[EXEC] ${msg.index}`);
            log(` > ${html(msg.exec)}`);
            log(` >>> ${html(msg.output)}`);
            break;
        }
        case "error": {
            log(`[ERROR] ${msg.index}`);
            log(` > ${html(msg.exec)}`);
            log(` >>> ${html(msg.error)}`);
            break;
        }
    }
});
ws.addEventListener("close", () => {
    document.body.innerHTML = "WebSocket closed :/";
});

function createClient(username = "[UNKNOWN]") {
    const row = document.createElement("tr");

    const indexEl = document.createElement("td");
    const usernameEl = document.createElement("td");
    const execEl = document.createElement("td");

    const client = {
        el: row,
        usernameEl,
        username,
        execEl
    };

    const execInput = document.createElement("input");
    execInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            ws.send(msgpack.encode({
                e: "exec",
                exec: execInput.value,
                index: clients.indexOf(client)
            }));
            execInput.value = "";
        }
    });

    usernameEl.innerHTML = username;

    execEl.appendChild(execInput);

    row.appendChild(indexEl);
    row.appendChild(usernameEl);
    row.appendChild(execEl);

    userTable.appendChild(row);

    clients.push(client);
}

const logDiv = document.getElementById("log");
function log(str = "") {
    const p = document.createElement("p");
    const timestamp = document.createElement("span");
    const time = new Date();

    p.innerHTML = str;
    timestamp.innerHTML = `${fillZeros(time.getHours(), 2)}:${fillZeros(time.getMinutes(), 2)}.${fillZeros(time.getSeconds(), 2)}`;
    timestamp.classList.add("timestamp");

    p.appendChild(timestamp);
    logDiv.appendChild(p);
    p.scrollIntoView();
}
function fillZeros(num = 0, digits = 2, char = "0") {
    return char.repeat(digits - String(num).length) + String(num);
}
function html(str = "") {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}