
import AL, { DeathData, EntitiesData, GData, NewMapData, WelcomeData } from "alclient"
import Express from "express"
import Http from "http"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { CharacterData, MonsterData } from "../definitions/client"
import { MapData } from "../definitions/server"

const app = Express()
const server = Http.createServer(app)
let io: SocketIO.Server

let G: GData
const tabs = new Set<string>()

export function startServer(port = 8080, g: GData) {
    // Update G
    G = g

    // Serve the client stuff
    app.use(Express.static("../client"))
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })
    io = new SocketIO.Server(server)
    io.on("connection", (connection) => {
        // Join the update channel
        connection.on("switchTab", (newTab: string) => {
            for (const tab of tabs) if (tab !== newTab) connection.leave(tab)
            connection.join(newTab)
        })

        for (const tab of tabs) {
            io.emit("newTab", tab)
        }
    })
}

export function addSocket(tabName: string, characterSocket: Socket) {
    if (!tabs.has(tabName)) {
        tabs.add(tabName)
        io.emit("newTab", tabName)
    }
    characterSocket.onAny((eventName, args) => {
        switch (eventName) {
            case "death": {
                const data = args as DeathData
                io.to(tabName).emit("remove", data.id)
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
                        skin: monster.type,
                        speed: monster.speed ?? G.monsters[monster.type].speed,
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
                        x: player.x,
                        y: player.y
                    }
                    io.to(tabName).emit("character", characterData)
                }
                break
            }
            case "new_map": {
                const data = args as NewMapData
                const mapData: MapData = {
                    map: data.name,
                    x: data.x,
                    y: data.y
                }
                io.to(tabName).emit("map", mapData)
                for (const monster of data.entities.monsters) {
                    const monsterData: MonsterData = {
                        going_x: monster.going_x,
                        going_y: monster.going_y,
                        hp: monster.hp ?? G.monsters[monster.type].hp,
                        id: monster.id,
                        max_hp: monster.max_hp ?? G.monsters[monster.type].hp,
                        moving: monster.moving,
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
            case "welcome": {
                const data = args as WelcomeData
                console.log(data)
                const mapData: MapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                }
                io.to(tabName).emit("map", mapData)
                break
            }
        }
    })
    io.to(tabName)
}

// TODO: Don't call this here in the final script, call it from wherever you're going to use it
async function run() {
    await AL.Game.loginJSONFile("../../credentials.json")
    await AL.Game.getGData(true, true)
    startServer(8080, AL.Game.G)
    const observer = await AL.Game.startObserver("ASIA", "I")
    addSocket("ASIA I", observer.socket)
}
run()