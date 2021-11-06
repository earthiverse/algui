
import { ActionData, ChestData, ChestOpenedData, DeathData, DisappearingTextData, EntitiesData, GameLogData, GData, HitData, NewMapData, PlayerData, WelcomeData } from "alclient"
import Express from "express"
import Http from "http"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { CharacterData, MonsterData } from "../definitions/client"
import { MapData } from "../definitions/server"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientFolder = Path.join(__dirname, "../client")
const app = Express()
const server = Http.createServer(app)
let io: SocketIO.Server

let G: GData
const tabs = new Map<string, MapData>()

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
            for (const [tab] of tabs) if (tab !== newTab) connection.leave(tab)
            connection.join(newTab)
            const mapData = tabs.get(newTab)
            if (mapData) connection.emit("map", mapData)
        })

        for (const [tab] of tabs) connection.emit("newTab", tab)
    })
}

export function addSocket(tabName: string, characterSocket: Socket, initialPosition: MapData = { map: "main", x: 0, y: 0 }) {
    if (!tabs.has(tabName)) {
        tabs.set(tabName, {
            map: initialPosition.map,
            x: initialPosition.x,
            y: initialPosition.y
        })
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
                // TODO: Animate chest
                break
            }
            case "death": {
                const data = args as DeathData
                io.to(tabName).emit("remove", data.id)
                break
            }
            case "disappearing_text": {
                const data = args as DisappearingTextData
                // TODO: Animate text
                break
            }
            case "drop": {
                const data = args as ChestData
                // TODO: Animate chest
                break
            }
            case "entities": {
                const data = args as EntitiesData
                if (data.type == "all") io.to(tabName).emit("clear")
                for (const monster of data.monsters) {
                    const monsterData: MonsterData = {
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
                    }
                    io.to(tabName).emit("monster", monsterData)
                }
                for (const player of data.players) {
                    const characterData: CharacterData = {
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
                    }
                    io.to(tabName).emit("character", characterData)
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
                tabs.set(tabName, mapData)
                io.to(tabName).emit("map", mapData)
                for (const monster of data.entities.monsters) {
                    const monsterData: MonsterData = {
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
                    }
                    io.to(tabName).emit("monster", monsterData)
                }
                for (const player of data.entities.players) {
                    const characterData: CharacterData = {
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
                    }
                    io.to(tabName).emit("character", characterData)
                }
                break
            }
            case "player": {
                const data = args as PlayerData

                // Update Map Data
                const mapData = tabs.get(tabName)
                if (mapData) {
                    mapData.x = data.x
                    mapData.y = data.y
                }
                tabs.set(tabName, mapData)

                const characterData: CharacterData = {
                    cx: data.cx,
                    going_x: data.going_x,
                    going_y: data.going_y,
                    hp: data.hp,
                    id: data.id,
                    max_hp: data.max_hp,
                    moving: data.moving,
                    skin: data.skin,
                    speed: data.speed,
                    target: data.target,
                    x: data.x,
                    y: data.y
                }
                io.to(tabName).emit("character", characterData)
                break
            }
            case "welcome": {
                const data = args as WelcomeData
                console.log(data)
                const mapData: MapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                }
                tabs.set(tabName, mapData)
                io.to(tabName).emit("map", mapData)
                break
            }

            // Sockets to ignore
            case "eval":
            case "game_event":
            case "server_info":
                break
            // default: {
            //     console.log(`------------------------------ ${eventName} ------------------------------`)
            //     console.log(JSON.stringify(args, undefined, 2))
            //     console.log("--------------------------------------------------------------------------------")
            //     break
            // }
        }
    })

    // Send a request to get all the entities so that everything renders correctly on the GUI
    characterSocket.emit("send_updates", {})
}