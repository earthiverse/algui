import * as PIXI from "pixi.js"
import { SpatialHash } from "pixi-cull"
import { Viewport } from "pixi-viewport"
import "./index.css"
import { MapName } from "alclient"
import { renderMap } from "./map"

// These settings make PIXI work well for pixel art based games
PIXI.settings.ROUND_PIXELS = true
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

// Add the view to the DOM
const app = new PIXI.Application({
    backgroundAlpha: 0
})
document.body.appendChild(app.view)
const viewport = new Viewport({
    interaction: app.renderer.plugins.interaction,
    screenHeight: window.innerHeight,
    screenWidth: window.innerWidth
})
viewport.pinch().drag().decelerate()
app.stage.addChild(viewport)

// Add culling to improve performance
const cull = new SpatialHash({
    dirtyTest: true,
    simpleTest: true
})
cull.cull(viewport.getVisibleBounds().pad(100))
PIXI.Ticker.shared.add(() => {
    if (viewport.dirty) {
        cull.cull(viewport.getVisibleBounds().pad(100))
        viewport.dirty = false
    }
})

// Fill the screen, and keep it full on window resize
window.addEventListener("resize", resize)
function resize() {
    app.renderer.resize(window.innerWidth, window.innerHeight)
    viewport.resize(window.innerWidth, window.innerHeight)
}
resize()

// Render a map!
const map: MapName = "winterland"
renderMap(viewport, cull, map)
viewport.moveCenter(0, 0)
viewport.setZoom(2, true)

const text = new PIXI.Text("x: 0.00, y: 0.00", { align: "right", fill: "white", fontFamily: "Arial", fontSize: 24, lineJoin: "round", strokeThickness: 5 })
text.x = window.innerWidth - text.width
text.y = window.innerHeight - text.height
app.stage.addChild(text)
PIXI.Ticker.shared.add(() => {
    const mouse = app.renderer.plugins.interaction.mouse.getLocalPosition(viewport)
    text.x = window.innerWidth - text.width
    text.y = window.innerHeight - text.height
    text.text = `x: ${mouse.x.toFixed(2)}, y: ${mouse.y.toFixed(2)}`
    console.log(text.text)
})