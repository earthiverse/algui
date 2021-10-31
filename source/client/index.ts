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
import G from "../G.json"
import { MapData } from "../definitions/server"
import { CharacterData, MonsterData } from "../definitions/client"

// Setup web font loader
PIXI.Loader.registerPlugin(WebfontLoaderPlugin)

// These settings make PIXI work well for pixel art based games
PIXI.settings.ROUND_PIXELS = true
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

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
    toggle: "visible"
})
cull.addAll(viewport.children)
let cullDirty = false
viewport.on("frame-end", function () {
    if (viewport.dirty) {
        console.log("Culling!")
        cull.cull(app.renderer.screen)
        viewport.dirty = false
        cullDirty = false
    }
})

// Once the webfont is loaded, render the text
PIXI.Loader.shared.add({ name: "m5x7", url: "./assets/m5x7.woff2" }).onComplete.add(() => {
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
})
PIXI.Loader.shared.load()

const background = new PIXI.Container()
background.interactive = false
background.interactiveChildren = false
background.zIndex = -1
viewport.addChild(background)

const foreground = new Layer()
foreground.group.enableSort = true
foreground.group.on("sort", function (sprite) {
    sprite.zOrder = sprite.y
})
foreground.zIndex = 0
viewport.addChild(foreground)

const socket = SocketIO.io({
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"]
})
socket.on("message", (message) => console.log(`We got ${message} back`))
socket.on("newTab", (tabName: string) => {
    socket.emit("switchTab", tabName)
})

socket.on("clear", () => {
    removeAllSprites()
})
let lastMap: MapName = undefined
socket.on("map", (data: MapData) => {
    cull.clear()
    removeAllSprites()
    if (lastMap !== data.map) {
        background.removeChildren()
        foreground.removeChildren()
        renderMap(background, foreground, data.map)
        lastMap = data.map
    }
    viewport.moveCenter(data.x, data.y)
    cull.addAll(viewport.children)
    cullDirty = true
})
socket.on("monster", (data: MonsterData) => {
    renderMonster(foreground, data)
})
socket.on("character", (data: CharacterData) => {
    renderCharacter(foreground, data)
})
socket.on("remove", (id: string) => {
    removeSprite(id)
})