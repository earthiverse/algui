import { BankInfo, BankPackName, GData, MapName } from "alclient"
import * as PIXI from "pixi.js"
import { Stage } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { WebfontLoaderPlugin } from "pixi-webfont-loader"
import * as SocketIO from "socket.io-client"
import "./index.css"
import { renderMap } from "./map"
import { removeAllSprites, removeSprite, renderCharacter, renderMonster } from "./sprite"
import { UICharacterData, ClientToServerEvents, MapData, UIMonsterData, ServerToClientEvents, UIProjectileData, UIRayData, InventoryData } from "../definitions/server"
import { Layers } from "../definitions/client"
import G from "../G.json"
import { renderProjectile, renderRay } from "./projectile"

// Setup web font loader
PIXI.Loader.registerPlugin(new WebfontLoaderPlugin())

// These settings make PIXI work well for pixel art based games
PIXI.settings.ROUND_PIXELS = true
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.LOW

// Add the view to the DOM
const app = new PIXI.Application({
    backgroundColor: 0x000000
})
app.stage = new Stage()
document.body.appendChild(app.view)
const viewport = new Viewport({
    interaction: app.renderer.plugins.interaction,
    screenHeight: window.innerHeight,
    screenWidth: window.innerWidth
})
viewport.interactive = true
viewport.interactiveChildren = true
viewport.sortableChildren = true
viewport.setZoom(2, true)
viewport.pinch().drag().decelerate()
app.stage.addChild(viewport)

// Fill the screen, and keep it full on window resize
window.addEventListener("resize", resize)
function resize() {
    app.renderer.resize(window.innerWidth, window.innerHeight)
    viewport.resize(window.innerWidth, window.innerHeight)
}
resize()

// Preload font
PIXI.Loader.shared.add({ name: "m5x7", url: "./assets/m5x7.ttf" })

// Preload images
for (const name in (G as unknown as GData).tilesets) {
    const gTileset = (G as unknown as GData).tilesets[name]
    const url = `.${gTileset.file}`
    console.log(`loading ${url}...`)
    PIXI.Loader.shared.add({ name: url, url: url })
}
for (const name in (G as unknown as GData).sprites) {
    const gSprites = (G as unknown as GData).sprites[name]
    const url = `.${gSprites.file}`
    console.log(`loading ${url}...`)
    PIXI.Loader.shared.add({ name: url, url: url })
}

PIXI.Loader.shared.load().onComplete.add(() => {
    // Show x/y coordinates
    let currentMap = undefined
    const text = new PIXI.Text("map: undefined, x: 0.00, y: 0.00", { fill: "white", fontFamily: "m5x7", fontSize: 48, lineHeight: 48, lineJoin: "round" })
    text.anchor.set(0, 0)
    text.zIndex = 4
    app.stage.addChild(text)
    PIXI.Ticker.shared.add(() => {
        const mouse = app.renderer.plugins.interaction.mouse.getLocalPosition(viewport)
        text.x = window.innerWidth - text.width
        text.y = window.innerHeight - text.height
        text.text = `map: ${currentMap}, x: ${mouse.x.toFixed(2)}, y: ${mouse.y.toFixed(2)}`
    })

    const hpBars = new PIXI.Container()
    hpBars.zIndex = 2
    viewport.addChild(hpBars)

    const idTags = new PIXI.Container()
    idTags.zIndex = 3
    viewport.addChild(idTags)

    const layers: Layers = {
        background: undefined,
        foreground: undefined,
        hpBars: hpBars,
        idTags: idTags,
        viewport: viewport
    }

    let activeTab: string
    const socket: SocketIO.Socket<ServerToClientEvents, ClientToServerEvents> = SocketIO.io({
        autoConnect: true,
        reconnection: true,
        transports: ["websocket"]
    })
    socket.on("newTab", (tabName: string) => {
        const tabID = `tab_${tabName}`
        if (document.getElementById(tabID)) return // Already have a button

        if (!activeTab) {
            socket.emit("switchTab", tabName)
            activeTab = tabName

            // Create the menu
            const menu = document.createElement("div")
            menu.setAttribute("id", "menu")
            document.body.appendChild(menu)

            // Create the submenu
            const submenu = document.createElement("div")
            submenu.setAttribute("id", "submenu")
            document.body.appendChild(submenu)
        }

        const menu = document.getElementById("menu")
        const button = document.createElement("div")
        button.id = tabID
        button.setAttribute("class", "tab_button")
        const text = document.createTextNode(tabName)
        button.appendChild(text)
        button.onclick = () => {
            socket.emit("switchTab", tabName)
            viewport.plugins.remove("follow")
            activeTab = tabName
        }
        menu.appendChild(button)
    })

    socket.on("removeAll", () => {
        removeAllSprites()
    })

    let isInventoryDisplayed = false
    socket.on("inventory", (id: string, data: InventoryData) => {
        if (isInventoryDisplayed) {
            updateInv(data)
        } else {
            const invID = `${id}_inv`
            let button = document.getElementById(invID)
            if (!button) {
                const menu = document.getElementById("submenu")
                button = document.createElement("div")
                button.id = invID
                button.setAttribute("class", "inv_button")
                const text = document.createTextNode("Inventory")
                button.appendChild(text)
                menu.appendChild(button)
            }
            button.onclick = () => {
                isInventoryDisplayed = true
                const modal = document.createElement("div")
                modal.setAttribute("class", "modal")
                modal.onclick = () => {
                    isInventoryDisplayed = false
                    modal.parentElement.removeChild(modal)
                }
                const imodal = document.createElement("div")
                imodal.setAttribute("style", "display: inline-block; margin-bottom: 0px; margin-top: 313px; padding: 10px; text-align: left; position: relative;")
                modal.appendChild(imodal)
                const invContain = document.createElement("div")
                invContain.setAttribute("style", "background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block; vertical-align: bottom; margin-top: 40px; margin-bottom: 40px;")
                imodal.appendChild(invContain)
                const goldCell = document.createElement("div")
                goldCell.setAttribute("style", "padding: 4px; font-size: 32px;")
                const goldText = document.createElement("span")
                goldText.id = "goldText"
                goldText.setAttribute("style", "color: gold;")
                goldText.textContent = "GOLD"
                const goldNum = document.createElement("span")
                goldNum.setAttribute("style", "color: white;")
                goldNum.textContent = data.gold.toLocaleString("en-US")
                goldCell.appendChild(goldText)
                const tn = document.createTextNode(": ")
                goldCell.appendChild(tn)
                goldCell.appendChild(goldNum)
                invContain.appendChild(goldCell)
                const divBorder = document.createElement("div")
                divBorder.setAttribute("style", "border-bottom: 5px solid gray; margin-bottom: 2px; margin-left: -5px; margin-right: -5px;")
                invContain.appendChild(divBorder)
                const items = data.items
                for (let i = 0; i < 9; i++) {
                    const row = document.createElement("div")
                    row.setAttribute("id", `row_${i}`)
                    invContain.appendChild(row)
                    for (let j = 0; j < 5; j++) {
                        const slot = document.createElement("div")
                        const slotNum = (i * 5) + j
                        slot.setAttribute("style", "position: relative; display: inline-block; margin: 2px; border: 2px solid gray; height: 46px; width: 46px; background: black; vertical-align: top;")
                        const divSlot = document.createElement("div")
                        divSlot.setAttribute("style", "background: black; position: absolute; bottom: -2px; left: -2px; border: 2px solid gray; padding: 3px;")
                        row.appendChild(slot)
                        slot.appendChild(divSlot)
                        const divFrame = document.createElement("div")
                        divFrame.setAttribute("style", "overflow: hidden; height: 40px; width: 40px;")
                        divFrame.id = `frame_${slotNum}`
                        divSlot.appendChild(divFrame)
                        const item = items[slotNum]
                        if (!item) continue
                        const itemPos = G.positions[item.name]
                        let itemFile = "./images/tiles/items/"
                        switch (itemPos[0]) {
                            case "":
                                itemFile += "pack_20vt8.png"
                                break
                            case "pack_1a":
                                itemFile += "pack_1a.png"
                                break
                            case "custom":
                                itemFile += "custom.png"
                                break
                        }
                        const img = document.createElement("img")
                        img.setAttribute("src", itemFile)
                        const imgData = G.images[itemFile.replace("./", "/")]
                        const width = imgData.width * 2
                        const height = imgData.height * 2
                        const itemLeft = -(itemPos[1] * 40)
                        const itemTop = -(itemPos[2] * 40)
                        img.setAttribute("style", `width: ${width}px; height: ${height}px; margin-top: ${itemTop}px; margin-left: ${itemLeft}px;`)
                        divFrame.appendChild(img)
                        if (item.q && item.q > 1) {
                            const iq = document.createElement("div")
                            let iqStyle = "border: 2px solid gray; background: black; padding: 1px 2px 1px 3px; position: absolute; right: -2px; bottom: -2px; text-align: center; line-height: 16px; font-size: 24px; height: 16px;"
                            if (item.name.includes("hp")) iqStyle += " color: #F37A87;"
                            else if (item.name.includes("mp")) iqStyle += " color: #66B3F6;"
                            iq.setAttribute("style", iqStyle)
                            iq.textContent = item.q.toString(10)
                            divFrame.appendChild(iq)
                        }
                    }
                }
                document.body.appendChild(modal)
            }
        }
    })

    function updateInv(data: InventoryData) {
        const goldText = document.getElementById("goldText")
        goldText.textContent = data.gold.toLocaleString("en-US")
        for (const i in data.items) {
            const frame = document.getElementById(`frame_${i}`)
            const item = data.items[i]
            if (!item) {
                if (!frame.hasChildNodes) continue
                frame.childNodes.forEach((node) => {
                    frame.removeChild(node)
                })
            }
            const itemPos = G.positions[item.name]
            let itemFile = "./images/tiles/items/"
            switch (itemPos[0]) {
                case "":
                    itemFile += "pack_20vt8.png"
                    break
                case "pack_1a":
                    itemFile += "pack_1a.png"
                    break
                case "custom":
                    itemFile += "custom.png"
                    break
            }
            const img = document.createElement("img")
            img.setAttribute("src", itemFile)
            const imgData = G.images[itemFile.replace("./", "/")]
            const width = imgData.width * 2
            const height = imgData.height * 2
            const itemLeft = -(itemPos[1] * 40)
            const itemTop = -(itemPos[2] * 40)
            img.setAttribute("style", `width: ${width}px; height: ${height}px; margin-top: ${itemTop}px; margin-left: ${itemLeft}px;`)
            frame.appendChild(img)
            if (item.q && item.q > 1) {
                const iq = document.createElement("div")
                let iqStyle = "border: 2px solid gray; background: black; padding: 1px 2px 1px 3px; position: absolute; right: -2px; bottom: -2px; text-align: center; line-height: 16px; font-size: 24px; height: 16px;"
                if (item.name.includes("hp")) iqStyle += " color: #F37A87;"
                else if (item.name.includes("mp")) iqStyle += " color: #66B3F6;"
                iq.setAttribute("style", iqStyle)
                iq.textContent = item.q.toString(10)
                frame.appendChild(iq)
            }
        }
    }

    socket.on("removeInv", () => {
        const inv = document.getElementById("inv")
        if (inv) inv.parentNode.removeChild(inv)
    })

    let lastMap: MapName = undefined
    const mapCache = new Map<MapName, { background: PIXI.Container, foreground: PIXI.Container }>()
    socket.on("map", (data: MapData) => {
        viewport.plugins.remove("follow")
        currentMap = data.map
        text.text = `map: ${data.map}, x: ${data.x.toFixed(2)}, y: ${data.y.toFixed(2)}`
        console.log(`Switching map to ${data.map},${data.x},${data.y}`)
        removeAllSprites()
        if (lastMap !== data.map) {
            // Remove the background and foreground
            viewport.removeChild(layers.background)
            viewport.removeChild(layers.foreground)

            // Check the cache
            const cache = mapCache.get(data.map)
            if (cache) {
                layers.background = cache.background
                layers.foreground = cache.foreground
                viewport.addChild(layers.background)
                viewport.addChild(layers.foreground)
            } else {
                layers.background = new PIXI.Container()
                layers.background.interactive = false
                layers.background.interactiveChildren = false
                layers.background.zIndex = 0

                layers.foreground = new PIXI.Container()
                layers.foreground.zIndex = 1
                layers.foreground.interactive = true
                layers.foreground.interactiveChildren = true
                layers.foreground.sortableChildren = true

                renderMap(app.renderer, layers, data.map)
                mapCache.set(data.map, {
                    background: layers.background,
                    foreground: layers.foreground
                })
                viewport.addChild(layers.background)
                viewport.addChild(layers.foreground)
            }

            lastMap = data.map
        }
        viewport.moveCenter(data.x, data.y)
        viewport.dirty = true
    })
    socket.on("monster", (data: UIMonsterData) => {
        renderMonster(layers, data)
    })
    socket.on("character", (data: UICharacterData) => {
        const sprite = renderCharacter(layers, data)
        if (activeTab == data.id) {
            viewport.follow(sprite, { radius: 50, speed: 0 })
        }
    })
    socket.on("projectile", (data: UIProjectileData) => {
        renderProjectile(layers, data)
    })
    socket.on("ray", (data: UIRayData) => {
        renderRay(layers, data)
    })
    socket.on("remove", (id: string) => {
        removeSprite(id)
    })
})