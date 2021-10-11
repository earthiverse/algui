import * as PIXI from "pixi.js"
import { Layer, Stage } from "@pixi/layers"
import { SpatialHash } from "pixi-cull"
import { Viewport } from "pixi-viewport"
import "./index.css"
import { GData, MapName, MonsterName } from "alclient"
import { renderMap } from "./map"
import { renderMonster, MonsterData } from "./sprite"
import G from "./G.json"

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
viewport.pinch().drag().decelerate()
app.stage.addChild(viewport)

// Add culling to improve performance
const cull = new SpatialHash({
    dirtyTest: true,
    simpleTest: true
})
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

// Show x/y coordinates
const text = new PIXI.Text("x: 0.00, y: 0.00", { align: "right", fill: "white", fontFamily: "Arial", fontSize: 24, lineJoin: "round", strokeThickness: 5 })
text.x = window.innerWidth - text.width
text.y = window.innerHeight - text.height
text.zIndex = 2
app.stage.addChild(text)
PIXI.Ticker.shared.add(() => {
    const mouse = app.renderer.plugins.interaction.mouse.getLocalPosition(viewport)
    text.x = window.innerWidth - text.width
    text.y = window.innerHeight - text.height
    text.text = `x: ${mouse.x.toFixed(2)}, y: ${mouse.y.toFixed(2)}`
})

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

// Render a map!
export function getMapNames(): MapName[] {
    const maps = []
    for (const i in (G as unknown as GData).maps) maps.push(i)
    return maps.sort()
}

const mapNames = getMapNames()
const background = new Layer()
background.group.enableSort = false
background.zIndex = -1
viewport.addChild(background)
cull.addContainer(background, true)

const foreground = new Layer()
foreground.group.enableSort = true
foreground.group.on("sort", (sprite) => {
    sprite.zOrder = sprite.y
})
foreground.zIndex = 0
viewport.addChild(foreground)
cull.addContainer(foreground, true)

const map: MapName = mapNames[getRandomInt(0, mapNames.length)]
renderMap(background, foreground, map)
viewport.moveCenter(0, 0)
viewport.setZoom(2, true)
viewport.sortableChildren = true

export function getMonsterNames(): MonsterName[] {
    const monsters = []
    for (const i in (G as unknown as GData).monsters) monsters.push(i)
    return monsters.sort()
}

let monsterID = 0
const monsterNames = getMonsterNames()
const monsters = new Map<string, MonsterData>()

// setInterval(() => {
for (let i = 0; i < 1000; i++) {
    // const mType = monsterNames[getRandomInt(0, monsterNames.length)]
    const mType: MonsterName = "mummy"
    const monster = {
        ...(G as unknown as GData).monsters[mType],
        going_x: getRandomInt(-100, 100),
        going_y: getRandomInt(-100, 100),
        id: `${monsterID++}`,
        moving: true,
        x: getRandomInt(-100, 100),
        y: getRandomInt(-100, 100)
    }
    monster.hp = 1000 // Overwrite HP
    renderMonster(foreground, monster)
    monsters.set(monster.id, monster)
}
// }, 100)

setInterval(() => {
    const keys = [...monsters.keys()]
    for (const id of keys) {
        const monster = monsters.get(id)
        if (!monster) return
        if (!monster.moving) {
            monster.going_x = getRandomInt(-100, 100)
            monster.going_y = getRandomInt(-100, 100)
            monster.moving = true
        }
    }
}, 1000)

// setInterval(() => {
//     // Kill random monsters
//     const id = [...monsters.keys()][getRandomInt(0, monsters.size)]
//     const monster = monsters.get(id)
//     if (!monster) return
//     monster.hp = 0
//     if (monster.hp <= 0) monsters.delete(id)
// }, 100)