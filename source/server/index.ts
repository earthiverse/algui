
import { ActionData, CharacterData, ChestData, ChestOpenedData, DeathData, DisappearData, DisappearingTextData, EntitiesData, GameLogData, GData, HitData, NewMapData, WelcomeData } from "alclient"
import Express from "express"
import Http from "http"
// import { diff } from "json-diff"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { UICharacterData, UIMonsterData, MapData, UIData, ServerToClientEvents, ClientToServerEvents } from "../definitions/server"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientFolder = Path.join(__dirname, "../client")
const app = Express()
const server = Http.createServer(app)
let io: SocketIO.Server<ClientToServerEvents, ServerToClientEvents>

let G: GData
const observers = new Map<string, UIData>()

export function startServer(port = 8080, g: GData) {
    G = g

    // Serve the client stuff
    app.use(Express.static(clientFolder))
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })

    io = new SocketIO.Server(server)
    io.on("connection", (connection) => {
        // Join the update channel
        connection.on("switchTab", (newTab: string) => {
            if (!observers.has(newTab)) return // Not a valid tab

            // Leave all tabs
            for (const [tab] of observers) connection.leave(tab)

            // Switch the tab
            connection.join(newTab)
            const tabData = observers.get(newTab)
            connection.emit("map", tabData.mapData)
            for (const [, monsterData] of tabData.monsters) connection.emit("monster", monsterData)
            for (const [, characterData] of tabData.players) connection.emit("character", characterData)
            if (tabData.bank) connection.emit("bank", tabData.bank)
        })

        for (const [tab] of observers) connection.emit("newTab", tab)
    })
}

export function addSocket(tabName: string, characterSocket: Socket, initialPosition: MapData = { map: "main", x: 0, y: 0 }) {
    if (!observers.has(tabName)) {
        observers.set(tabName, {
            mapData: {
                map: initialPosition.map,
                x: initialPosition.x,
                y: initialPosition.y
            },
            monsters: new Map(),
            players: new Map() })
        io.emit("newTab", tabName)
    }
    characterSocket.onAny((eventName, args) => {
        switch (eventName) {
            case "action": {
                const data = args as ActionData
                // TODO: Animate projectile
                break
            }
            case "chest_opened": {
                const data = args as ChestOpenedData
                // TODO: Animate chest && remove
                break
            }
            case "death": {
                const data = args as DeathData
                // TODO: Render gravestone for players
                const tabData = observers.get(tabName)
                tabData.monsters.delete(data.id) || tabData.players.delete(data.id)
                io.to(tabName).emit("remove", data.id)
                break
            }
            case "disappear": {
                const data = args as DisappearData
                const tabData = observers.get(tabName)
                tabData.monsters.delete(data.id) || tabData.players.delete(data.id)
                io.to(tabName).emit("remove", data.id)
                break
            }
            case "disappearing_text": {
                const data = args as DisappearingTextData
                // TODO: Animate text?
                break
            }
            case "drop": {
                const data = args as ChestData
                // TODO: Animate chest
                break
            }
            case "entities": {
                const data = args as EntitiesData
                const tabData = observers.get(tabName)
                if (data.type == "all") {
                    io.to(tabName).emit("removeAll")
                    tabData.monsters.clear()
                    tabData.players.clear()
                }
                for (const monster of data.monsters) {
                    const monsterData: UIMonsterData = {
                        aa: G.monsters[monster.type].aa,
                        going_x: monster.going_x,
                        going_y: monster.going_y,
                        hp: monster.hp ?? G.monsters[monster.type].hp,
                        id: monster.id,
                        max_hp: monster.max_hp ?? G.monsters[monster.type].hp,
                        moving: monster.moving,
                        s: monster.s || {},
                        size: G.monsters[monster.type].size,
                        skin: G.monsters[monster.type].skin,
                        speed: monster.speed ?? G.monsters[monster.type].speed,
                        target: monster.target,
                        x: monster.x,
                        y: monster.y
                    }
                    // const before = tabData.monsters.get(monster.id)
                    // if (before) {
                    //     // Compute and send the difference
                    //     const d = diff(before, monsterData)
                    //     if (!d || Object.keys(d).length == 0) return // No difference

                    //     const newDiff: Partial<MonsterData> = {}
                    //     for (const key in d) {
                    //         if (key.endsWith("__deleted")) {
                    //             newDiff[key] = undefined
                    //             continue
                    //         }
                    //         if (!d["going_to"] && key == "x") continue // Ignore certain movements
                    //         if (!d["going_to"] && key == "y") continue // Ignore certain movements
                    //         newDiff[key] = d[key]["__new"]
                    //     }
                    //     if (Object.keys(newDiff).length > 0) {
                    //         newDiff.id = monster.id
                    //         io.to(tabName).emit("monster", newDiff)
                    //     }
                    // } else {
                    io.to(tabName).emit("monster", monsterData)
                    // }

                    tabData.monsters.set(monsterData.id, monsterData)
                }
                for (const player of data.players) {
                    const characterData: UICharacterData = {
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        max_hp: player.max_hp,
                        moving: player.moving,
                        s: player.s || {},
                        skin: player.skin,
                        speed: player.speed,
                        target: player.target,
                        x: player.x,
                        y: player.y
                    }

                    // const before = tabData.players.get(player.id)
                    // if (before) {
                    //     // Compute and send the difference
                    //     const d = diff(before, characterData)
                    //     if (!d || Object.keys(d).length == 0) return // No difference

                    //     const newDiff: Partial<CharacterData> = {}
                    //     for (const key in d) {
                    //         if (key.endsWith("__deleted")) {
                    //             newDiff[key] = undefined
                    //             continue
                    //         }
                    //         if (!d["going_to"] && key == "x") continue // Ignore certain movements
                    //         if (!d["going_to"] && key == "y") continue // Ignore certain movements
                    //         newDiff[key] = d[key]["__new"]
                    //     }
                    //     if (Object.keys(newDiff).length > 0) {
                    //         newDiff.id = player.id
                    //         io.to(tabName).emit("character", newDiff)
                    //     }
                    // } else {
                    io.to(tabName).emit("character", characterData)
                    // }

                    tabData.players.set(player.id, characterData)
                }
                break
            }
            case "game_log": {
                const data = args as GameLogData
                // TODO: Animate game log message
                break
            }
            case "hit": {
                const data = args as HitData
                // TODO: Animate projectile
                break
            }
            case "new_map": {
                const data = args as NewMapData
                const mapData: MapData = {
                    map: data.name,
                    x: data.x,
                    y: data.y
                }
                const tabData = observers.get(tabName)
                tabData.mapData = mapData
                tabData.monsters.clear()
                tabData.players.clear()
                io.to(tabName).emit("map", mapData)
                for (const monster of data.entities.monsters) {
                    const monsterData: UIMonsterData = {
                        aa: G.monsters[monster.type].aa,
                        going_x: monster.going_x,
                        going_y: monster.going_y,
                        hp: monster.hp ?? G.monsters[monster.type].hp,
                        id: monster.id,
                        max_hp: monster.max_hp ?? G.monsters[monster.type].hp,
                        moving: monster.moving,
                        s: monster.s || {},
                        size: G.monsters[monster.type].size,
                        skin: G.monsters[monster.type].skin,
                        speed: monster.speed ?? G.monsters[monster.type].speed,
                        target: monster.target,
                        x: monster.x,
                        y: monster.y
                    }
                    tabData.monsters.set(monsterData.id, monsterData)
                    io.to(tabName).emit("monster", monsterData)
                }
                for (const player of data.entities.players) {
                    const characterData: UICharacterData = {
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        max_hp: player.max_hp,
                        moving: player.moving,
                        s: player.s || {},
                        skin: player.skin,
                        speed: player.speed,
                        target: player.target,
                        x: player.x,
                        y: player.y
                    }
                    tabData.players.set(player.id, characterData)
                    io.to(tabName).emit("character", characterData)
                }
                break
            }
            case "player": {
                const data = args as CharacterData

                // Update Map Data
                const tabData = observers.get(tabName)
                tabData.mapData.x = data.x
                tabData.mapData.y = data.y

                const characterData: UICharacterData = {
                    cx: data.cx,
                    going_x: data.going_x,
                    going_y: data.going_y,
                    hp: data.hp,
                    id: data.id,
                    max_hp: data.max_hp,
                    moving: data.moving,
                    s: data.s || {},
                    skin: data.skin,
                    speed: data.speed,
                    target: data.target,
                    x: data.x,
                    y: data.y
                }

                if (data.user) {
                    // Update bank data
                    tabData.bank = data.user
                    io.to(tabName).emit("bank", data.user)
                }

                // const before = tabData.players.get(data.id)
                // if (before) {
                //     // Compute and send the difference
                //     const d = diff(before, characterData)
                //     if (!d || Object.keys(d).length == 0) return // No difference

                //     const newDiff: Partial<CharacterData> = {}
                //     for (const key in d) {
                //         if (key.endsWith("__deleted")) {
                //             newDiff[key] = undefined
                //             continue
                //         }
                //         if (!d["going_to"] && key == "x") continue // Ignore certain movements
                //         if (!d["going_to"] && key == "y") continue // Ignore certain movements
                //         newDiff[key] = d[key]["__new"]
                //     }
                //     if (Object.keys(newDiff).length > 0) {
                //         newDiff.id = characterData.id
                //         io.to(tabName).emit("character", newDiff)
                //     }
                // } else {
                io.to(tabName).emit("character", characterData)
                // }

                tabData.players.set(data.id, characterData)
                break
            }
            case "welcome": {
                const data = args as WelcomeData
                const mapData: MapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                }
                const tabData = observers.get(tabName)
                tabData.mapData = mapData
                io.to(tabName).emit("map", mapData)
                break
            }

            // Sockets to ignore
            // case "eval":
            // case "game_event":
            // case "ping_ack":
            // case "server_info":
            //     break
            default: {
            //     console.log(`------------------------------ ${eventName} ------------------------------`)
            //     console.log(JSON.stringify(args, undefined, 2))
            //     console.log("--------------------------------------------------------------------------------")
                break
            }
        }
    })

    // Send a request to get all the entities so that everything renders correctly on the GUI
    characterSocket.emit("send_updates", {})
}

// async function run() {
//     await AL.Game.loginJSONFile("../../credentials.json")
//     const G = await AL.Game.getGData(true, false)
//     startServer(8080, G)
//     const observer = await AL.Game.startObserver("US", "I")
//     addSocket("US I", observer.socket, observer)

//     const observer2 = await AL.Game.startObserver("US", "II")
//     addSocket("US II", observer2.socket, observer2)
// }
// run()