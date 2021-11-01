import AL from "alclient";
import Express from "express";
import Http from "http";
import * as SocketIO from "socket.io";
const app = Express();
const server = Http.createServer(app);
let io;
let G;
const tabs = new Map();
export function startServer(port = 8080, g) {
    G = g;
    app.use(Express.static("../client"));
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
    io = new SocketIO.Server(server);
    io.on("connection", (connection) => {
        connection.on("switchTab", (newTab) => {
            for (const [tab] of tabs)
                if (tab !== newTab)
                    connection.leave(tab);
            connection.join(newTab);
            const mapData = tabs.get(newTab);
            if (mapData)
                connection.emit("map", mapData);
        });
        for (const [tab] of tabs)
            connection.emit("newTab", tab);
    });
}
export function addSocket(tabName, characterSocket, initialPosition = { map: "main", x: 0, y: 0 }) {
    if (!tabs.has(tabName)) {
        tabs.set(tabName, {
            map: initialPosition.map,
            x: initialPosition.x,
            y: initialPosition.y
        });
        io.emit("newTab", tabName);
    }
    characterSocket.onAny((eventName, args) => {
        switch (eventName) {
            case "death": {
                const data = args;
                io.to(tabName).emit("remove", data.id);
                break;
            }
            case "entities": {
                const data = args;
                if (data.type == "all")
                    io.to(tabName).emit("clear");
                for (const monster of data.monsters) {
                    const monsterData = {
                        going_x: monster.going_x,
                        going_y: monster.going_y,
                        hp: monster.hp ?? G.monsters[monster.type].hp,
                        id: monster.id,
                        max_hp: monster.max_hp ?? G.monsters[monster.type].hp,
                        moving: monster.moving,
                        size: G.monsters[monster.type].size,
                        skin: monster.type,
                        speed: monster.speed ?? G.monsters[monster.type].speed,
                        x: monster.x,
                        y: monster.y
                    };
                    io.to(tabName).emit("monster", monsterData);
                }
                for (const player of data.players) {
                    const characterData = {
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        max_hp: player.max_hp,
                        moving: player.moving,
                        skin: player.skin,
                        speed: player.speed,
                        x: player.x,
                        y: player.y
                    };
                    io.to(tabName).emit("character", characterData);
                }
                break;
            }
            case "new_map": {
                const data = args;
                const mapData = {
                    map: data.name,
                    x: data.x,
                    y: data.y
                };
                tabs.set(tabName, mapData);
                io.to(tabName).emit("map", mapData);
                for (const monster of data.entities.monsters) {
                    const monsterData = {
                        going_x: monster.going_x,
                        going_y: monster.going_y,
                        hp: monster.hp ?? G.monsters[monster.type].hp,
                        id: monster.id,
                        max_hp: monster.max_hp ?? G.monsters[monster.type].hp,
                        moving: monster.moving,
                        size: G.monsters[monster.type].size,
                        skin: monster.type,
                        speed: monster.speed ?? G.monsters[monster.type].speed,
                        target: monster.target,
                        x: monster.x,
                        y: monster.y
                    };
                    io.to(tabName).emit("monster", monsterData);
                }
                for (const player of data.entities.players) {
                    const characterData = {
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        max_hp: player.max_hp,
                        moving: player.moving,
                        skin: player.skin,
                        speed: player.speed,
                        target: player.target,
                        x: player.x,
                        y: player.y
                    };
                    io.to(tabName).emit("character", characterData);
                }
                break;
            }
            case "welcome": {
                const data = args;
                console.log(data);
                const mapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                };
                tabs.set(tabName, mapData);
                io.to(tabName).emit("map", mapData);
                break;
            }
        }
    });
}
async function run() {
    await AL.Game.loginJSONFile("../../credentials.json");
    await AL.Game.getGData(true, true);
    startServer(8080, AL.Game.G);
    const observer = await AL.Game.startObserver("ASIA", "I");
    addSocket("ASIA I", observer.socket, observer);
}
run();
//# sourceMappingURL=index.js.map