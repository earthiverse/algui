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
text.zOrder = 2
app.stage.addChild(text)
PIXI.Ticker.shared.add(() => {
    const mouse = app.renderer.plugins.interaction.mouse.getLocalPosition(viewport)
    text.x = window.innerWidth - text.width
    text.y = window.innerHeight - text.height
    text.text = `x: ${mouse.x.toFixed(2)}, y: ${mouse.y.toFixed(2)}`
})

// Render a map!
const map: MapName = "winterland"
renderMap(viewport, cull, map)
viewport.moveCenter(0, 0)
viewport.setZoom(2, true)

// Add a monster, lol
const monsterGroup = new Layer()
monsterGroup.group.enableSort = true
monsterGroup.group.on("sort", (sprite) => {
    sprite.zIndex = -sprite.y
})
monsterGroup.zOrder = 0
viewport.addChild(monsterGroup)

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

export function getMapNames(): MapName[] {
    const maps = []
    for (const i in (G as unknown as GData).maps) maps.push(i)
    return maps.sort()
}

export function getMonsterNames(): MonsterName[] {
    const monsters = []
    for (const i in (G as unknown as GData).monsters) monsters.push(i)
    return monsters.sort()
}

let monsterID = 0
const mNames = getMonsterNames()
const monsters = new Map<string, MonsterData>()

// TEST #1
// setInterval(() => {
//     // console.log(`Monsters size: ${monsters.size}`)
//     const keys = [...monsters.keys()]
//     for (const key of keys) {
//         const monster = monsters.get(key)
//         monster.hp -= getRandomInt(monster.hp / 10, 1.1 * monster.hp)
//         if (monster.hp <= 0) {
//             monsters.delete(key)
//             continue
//         }
//     }
// }, 100)

setInterval(() => {
    const mType = mNames[getRandomInt(0, mNames.length)]
    // const mType: MonsterName = "mummy"
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
    renderMonster(monsterGroup, monster)
    monsters.set(monster.id, monster)
}, 100)


//// TEST #2
// for (let i = monsterID; i < 100; i++) {
//     const mType = mNames[getRandomInt(0, mNames.length)]
//     const x = getRandomInt(-100, 100)
//     const y = getRandomInt(-100, 100)
//     const monster = {
//         ...(G as unknown as GData).monsters[mType],
//         going_x: x,
//         going_y: y,
//         id: `${monsterID++}`,
//         moving: false,
//         x: x,
//         y: y
//     }
//     monsters.set(monster.id, monster)
//     renderMonster(monsterGroup, monster)
// }

setInterval(() => {
    // Kill random monsters
    const id = [...monsters.keys()][getRandomInt(0, monsters.size)]
    const monster = monsters.get(id)
    if (!monster) return
    monster.hp = 0
    if (monster.hp <= 0) monsters.delete(id)
}, 100)