/* eslint-disable sort-keys */

import { Character, CharacterData, DeathData, DisappearData, EntitiesData, GData, NewMapData, Observer, WelcomeData } from "alclient"
import Express from "express"
import Http from "http"
// import { diff } from "json-diff"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { UICharacterData, UIMonsterData, MapData, UIData, ServerToClientEvents, ClientToServerEvents, UIProjectileData, UIRayData, InventoryData } from "../definitions/server"
import { ActionDataProjectile } from "alclient"

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
            if (tabData.mapData) connection.emit("map", tabData.mapData)
            for (const [, monsterData] of tabData.monsters) connection.emit("monster", monsterData)
            for (const [, characterData] of tabData.players) connection.emit("character", characterData)
            if (tabData.items) connection.emit("inventory", newTab, { gold: tabData.gold, items: tabData.items })
            else connection.emit("removeInv")
            if (tabData.bank) connection.emit("bank", newTab, tabData.bank)
            else connection.emit("removeBank")
        })

        for (const [tab] of observers) connection.emit("newTab", tab)
    })
}

export function addSocket(tabName: string, characterSocket: Socket, object: Character | Observer) {
    if (!observers.has(tabName)) {
        const initialPosition: MapData = {
            map: object.map,
            x: object.x,
            y: object.y
        }
        observers.set(tabName, {
            mapData: {
                map: initialPosition.map,
                x: initialPosition.x,
                y: initialPosition.y
            },
            monsters: new Map(),
            players: new Map(),
            items: (object instanceof Character) ? object.items : undefined,
            gold: (object instanceof Character) ? object.gold : undefined
        })
        io.emit("newTab", tabName)
    }
    characterSocket.onAnyOutgoing((eventName, args) => {
        const id = tabName
        switch (eventName) {
            case "move": {
                const moveData = args as { going_x: number, going_y: number, x: number, y: number }
                const tabData = observers.get(tabName)
                const playerData = tabData.players.get(id)
                if (!playerData) return // We don't have enough data to update

                // Update the data
                playerData.going_x = moveData.going_x
                playerData.going_y = moveData.going_y
                playerData.x = moveData.x
                playerData.y = moveData.y

                io.to(tabName).emit("character", playerData)
            }
        }
    })
    characterSocket.onAny((eventName, args) => {
        switch (eventName) {
            case "action": {
                const tabData = observers.get(tabName)
                const attacker = tabData.players.get(args.attacker) ?? tabData.monsters.get(args.attacker)
                if (!attacker) break // We don't know where the projectile originated

                if (G.projectiles[args.projectile]?.ray) {
                    const data = args as ActionDataProjectile

                    const rayData: UIRayData = {
                        going_x: data.x,
                        going_y: data.y,
                        pid: data.pid,
                        ray: data.projectile,
                        x: attacker.x,
                        y: attacker.y
                    }
                    io.to(tabName).emit("ray", rayData)
                } else if (G.projectiles[args.projectile]?.animation) {
                    const data = args as ActionDataProjectile

                    const projectileData: UIProjectileData = {
                        going_x: data.x,
                        going_y: data.y,
                        pid: data.pid,
                        projectile: data.projectile,
                        x: attacker.x,
                        y: attacker.y
                    }
                    io.to(tabName).emit("projectile", projectileData)
                }
                break
            }
            case "chest_opened": {
                //const data = args as ChestOpenedData
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
                //const data = args as DisappearingTextData
                // TODO: Animate text?
                break
            }
            case "disconnect": {
                // Remove the tab
                observers.delete(tabName)
                io.to(tabName).emit("removeTab", tabName)
                break
            }
            case "drop": {
                //const data = args as ChestData
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
                    io.to(tabName).emit("monster", monsterData)

                    tabData.monsters.set(monsterData.id, monsterData)
                }
                for (const player of data.players) {
                    const characterData: UICharacterData = {
                        ctype: player.ctype,
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        level: player.level,
                        max_hp: player.max_hp,
                        max_mp: player.max_mp,
                        moving: player.moving,
                        mp: player.mp,
                        s: player.s || {},
                        skin: player.skin,
                        speed: player.speed,
                        target: player.target,
                        x: player.x,
                        y: player.y
                    }

                    io.to(tabName).emit("character", characterData)

                    tabData.players.set(player.id, characterData)
                }
                break
            }
            case "game_log": {
                //const data = args as GameLogData
                // TODO: Animate game log message
                break
            }
            case "hit": {
                //const data = args as HitData
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
                        ctype: player.ctype,
                        cx: player.cx,
                        going_x: player.going_x,
                        going_y: player.going_y,
                        hp: player.hp,
                        id: player.id,
                        level: player.level,
                        max_hp: player.max_hp,
                        max_mp: player.max_mp,
                        moving: player.moving,
                        mp: player.mp,
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
                    ctype: data.ctype,
                    cx: data.cx,
                    going_x: data.going_x,
                    going_y: data.going_y,
                    hp: data.hp,
                    id: data.id,
                    level: data.level,
                    max_hp: data.max_hp,
                    max_mp: data.max_mp,
                    moving: data.moving,
                    mp: data.mp,
                    s: data.s || {},
                    skin: data.skin,
                    speed: data.speed,
                    target: data.target,
                    x: data.x,
                    y: data.y
                }

                tabData.gold = data.gold
                tabData.items = data.items

                const invData: InventoryData = { gold: data.gold, items: data.items }
                io.to(tabName).emit("inventory", tabName, invData)

                if (data.user) {
                    // Update bank data
                    tabData.bank = data.user
                }

                io.to(tabName).emit("character", characterData)

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
            default: {
                break
            }
        }
    })

    // Send a request to get all the entities so that everything renders correctly on the GUI
    characterSocket.emit("send_updates", {})
}