import { GData, GGeometry, MapName } from "alclient"
import * as PIXI from "pixi.js"
import { Cull } from "@pixi-essentials/cull"
import { Layer, Stage } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { WebfontLoaderPlugin } from "pixi-webfont-loader"
import * as SocketIO from "socket.io-client"
import "./index.css"
import { renderMap } from "./map"
import { removeAllSprites, removeSprite, renderCharacter, renderMonster } from "./sprite"
import { CharacterData, MapData, MonsterData } from "../definitions/server"
import { Layers } from "../definitions/client"
import G from "../G.json"

// Setup web font loader
PIXI.Loader.registerPlugin(WebfontLoaderPlugin)

// These settings make PIXI work well for pixel art based games
PIXI.settings.ROUND_PIXELS = true
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.LOW

// Add the view to the DOM
const app = new PIXI.Application({
    backgroundAlpha: 0
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

const cull = new Cull({
    recursive: false,
    toggle: "visible"
})
cull.addAll(viewport.children)
viewport.on("frame-end", function () {
    if (viewport.dirty) {
        console.log("Culling!")
        cull.cull(app.renderer.screen)
        viewport.dirty = false
    }
})

// Preload font
PIXI.Loader.shared.add({ name: "m5x7", url: "./assets/m5x7.woff2" })

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
    const text = new PIXI.Text("map: undefined, x: 0.00, y: 0.00", { fill: "white", fontFamily: "m5x7", fontSize: 28, lineHeight: 28, lineJoin: "round", strokeThickness: 5 })
    text.anchor.set(0, 0)
    text.zIndex = 3
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

    const layers: Layers = {
        background: undefined,
        foreground: undefined,
        hpBars: hpBars,
        viewport: viewport
    }

    let activeTab: string
    const socket = SocketIO.io({
        autoConnect: true,
        reconnection: true,
        transports: ["websocket"]
    })
    socket.on("message", (message) => console.log(`We got ${message} back`))
    socket.on("newTab", (tabName: string) => {
        if (!activeTab) {
            socket.emit("switchTab", tabName)
            activeTab = tabName

            // Create the menu
            const menu = document.createElement("div")
            menu.setAttribute("id", "menu")
            document.body.appendChild(menu)
        }

        const menu = document.getElementById("menu")
        const button = document.createElement("div")
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

    socket.on("clear", () => {
        removeAllSprites()
    })

    let lastMap: MapName = undefined
    const mapCache = new Map<MapName, {
        background: PIXI.Container
        foreground: PIXI.Container
    }>()
    socket.on("map", (data: MapData) => {
        currentMap = data.map
        text.text = `map: ${data.map}, x: ${data.x.toFixed(2)}, y: ${data.y.toFixed(2)}`
        console.log(`Switching map to ${data.map},${data.x},${data.y}`)
        cull.clear()
        removeAllSprites()
        if (lastMap !== data.map) {
            // Check the cache
            const cache = mapCache.get(data.map)
            if (cache) {
                viewport.removeChild(layers.background)
                viewport.removeChild(layers.foreground)
                layers.background = cache.background
                layers.foreground = cache.foreground
                console.log(`cached foreground sort: ${layers.foreground.sortableChildren}`)
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
        cull.addAll(layers.background.children)
        cull.addAll(layers.foreground.children)
        const geometry: GGeometry = (G as unknown as GData).geometry[data.map]
        viewport.clamp({
            bottom: geometry.max_y,
            left: geometry.min_x,
            right: geometry.max_x,
            top: geometry.min_y
        })
        viewport.moveCenter(data.x, data.y)
        viewport.dirty = true
    })
    socket.on("monster", (data: MonsterData) => {
        renderMonster(layers, data)
    })
    socket.on("character", (data: CharacterData) => {
        const sprite = renderCharacter(layers, data)
        if (activeTab == data.id) {
            viewport.follow(sprite, { acceleration: 10, radius: 50, speed: data.speed })
        }
    })
    socket.on("remove", (id: string) => {
        removeSprite(id)
    })
})