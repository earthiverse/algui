import { GData, MapName } from "alclient"
import * as PIXI from "pixi.js"
import { Cull } from "@pixi-essentials/cull"
import { Layer, Stage } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { WebfontLoaderPlugin } from "pixi-webfont-loader"
import * as SocketIO from "socket.io-client"
import "./index.css"
import { renderMap } from "./map"
import { removeAllSprites, removeSprite, renderCharacter, renderMonster } from "./sprite"
import { MapData } from "../definitions/server"
import { CharacterData, MonsterData } from "../definitions/client"
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
    const text = new PIXI.Text("x: 0.00, y: 0.00", { fill: "white", fontFamily: "m5x7", fontSize: 28, lineHeight: 28, lineJoin: "round", strokeThickness: 5 })
    text.anchor.set(0, 0)
    text.zIndex = 2
    app.stage.addChild(text)
    PIXI.Ticker.shared.add(() => {
        const mouse = app.renderer.plugins.interaction.mouse.getLocalPosition(viewport)
        text.x = window.innerWidth - text.width
        text.y = window.innerHeight - text.height
        text.text = `x: ${mouse.x.toFixed(2)}, y: ${mouse.y.toFixed(2)}`
    })

    let background: PIXI.Container = new PIXI.Container()
    background.interactive = false
    background.interactiveChildren = false
    background.zIndex = -1
    viewport.addChild(background)
    let foreground: Layer = new Layer()
    foreground.zIndex = 0
    foreground.group.enableSort = true
    viewport.addChild(foreground)

    let activeTab: string
    const socket = SocketIO.io({
        autoConnect: true,
        reconnection: true,
        transports: ["websocket"]
    })
    socket.on("message", (message) => console.log(`We got ${message} back`))
    socket.on("newTab", (tabName: string) => {
        socket.emit("switchTab", tabName)
        activeTab = tabName
    })

    socket.on("clear", () => {
        removeAllSprites()
    })

    let lastMap: MapName = undefined
    const mapCache = new Map<MapName, {
        background: PIXI.Container
        foreground: Layer
    }>()
    socket.on("map", (data: MapData) => {
        console.log(`Switching map to ${data.map},${data.x},${data.y}`)
        cull.clear()
        removeAllSprites()
        if (lastMap !== data.map) {
        // Check the cache
            foreground.group.removeAllListeners()
            const cache = mapCache.get(data.map)
            if (cache) {
                background.visible = false
                foreground.visible = false
                foreground.group.enableSort = false
                viewport.removeChild(background)
                viewport.removeChild(foreground)
                background = cache.background
                background.visible = true
                foreground = cache.foreground
                foreground.visible = true
                foreground.group.enableSort = true
                foreground.on("sort", (sprite) => {
                    sprite.zOrder = sprite.y
                })
                viewport.addChild(background)
                viewport.addChild(foreground)
            } else {
                if (lastMap == undefined) {
                    background.destroy()
                    foreground.destroy()
                }
                background = new PIXI.Container()
                background.interactive = false
                background.interactiveChildren = false
                background.zIndex = -1
                foreground = new Layer()
                foreground.zIndex = 0
                foreground.group.enableSort = true
                foreground.on("sort", (sprite) => {
                    sprite.zOrder = sprite.y
                })
                renderMap(app.renderer, background, foreground, data.map)
                mapCache.set(data.map, {
                    background: background,
                    foreground: foreground
                })
                viewport.addChild(background)
                viewport.addChild(foreground)
            }

            lastMap = data.map
        }
        cull.addAll(background.children)
        cull.addAll(foreground.children)
        viewport.moveCenter(data.x, data.y)
        viewport.dirty = true
    })
    socket.on("monster", (data: MonsterData) => {
        renderMonster(foreground, data)
    })
    socket.on("character", (data: CharacterData) => {
        const sprite = renderCharacter(foreground, data)
        if (activeTab == data.id) {
            viewport.follow(sprite)
        }
    })
    socket.on("remove", (id: string) => {
        removeSprite(id)
    })
})