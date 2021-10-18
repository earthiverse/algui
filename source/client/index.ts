import { GData, MapName, MonsterName } from "alclient"
import * as PIXI from "pixi.js"
import { SpatialHash } from "pixi-cull"
import { Layer, Stage } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { WebfontLoaderPlugin } from "pixi-webfont-loader"
import * as SocketIO from "socket.io-client"
import "./index.css"
import { renderMap } from "./map"
import { renderMonster, MonsterData, renderCharacter, CharacterData } from "./sprite"
import G from "./G.json"

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
viewport.pinch().drag().decelerate()
app.stage.addChild(viewport)

// Add culling to improve performance
const cull = new SpatialHash({
    dirtyTest: true,
    simpleTest: true
})
PIXI.Ticker.shared.add(() => {
    if (viewport.dirty) {
        cull.cull(viewport.getVisibleBounds().pad(25))
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

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

// Render a map!
export function getMapNames(): MapName[] {
    const maps = []
    for (const i in (G as unknown as GData).maps) maps.push(i)
    return maps.sort()
}

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

    const explanation = new PIXI.Text("left: aa:0, center: aa:1, right: aa:default value", { fill: "white", fontFamily: "m5x7", fontSize: 28, lineHeight: 28, lineJoin: "round", strokeThickness: 5 })
    explanation.x = 0
    explanation.y = 0
    explanation.zIndex = 2
    app.stage.addChild(explanation)
})
PIXI.Loader.shared.load()

const background = new Layer()
background.group.enableSort = false
background.zIndex = -1
viewport.addChild(background)
cull.addContainer(background)

const foreground = new Layer()
foreground.group.enableSort = true
foreground.group.on("sort", (sprite) => {
    sprite.zOrder = sprite.y
})
foreground.zIndex = 0
viewport.addChild(foreground)
cull.addContainer(foreground)

// Add lines to line up monsters
let lines: PIXI.Graphics[] = []
function addLine(x1, y1, x2, y2, color = 0xff0000) {
    const graphic = new PIXI.Graphics()
    graphic.setParent(viewport)
    graphic.zIndex = -0.5
    graphic.position.set(x1, y1)
    graphic.lineStyle(1, color).lineTo(x2 - x1, y2 - y1)
    cull.add(graphic)
    lines.push(graphic)
}
function removeLines() {
    for (const line of lines) line.destroy()
    lines = []
}

// Add base lines
addLine(-375, -5000, -375, 5000)
addLine(-325, -5000, -325, 5000)
addLine(-275, -5000, -275, 5000)
addLine(-225, -5000, -225, 5000)
addLine(-75, -5000, -75, 5000)
addLine(-25, -5000, -25, 5000)
addLine(25, -5000, 25, 5000)
addLine(75, -5000, 75, 5000)
addLine(225, -5000, 225, 5000)
addLine(275, -5000, 275, 5000)
addLine(325, -5000, 325, 5000)
addLine(375, -5000, 375, 5000)
lines = []

// const map: MapName = mapNames[getRandomInt(0, mapNames.length)]
const map = "abtesting"
renderMap(background, foreground, map)
viewport.moveCenter(0, 0)
viewport.setZoom(8, true)
viewport.sortableChildren = true

export function getMonsterNames(): MonsterName[] {
    const monsters = []
    for (const i in (G as unknown as GData).monsters) monsters.push(i)
    return monsters.sort()
}

export function addBorder(sprite: PIXI.AnimatedSprite) {
    addLine(sprite.x, sprite.y, sprite.x + sprite.width, sprite.y, 0x00ff00)
    addLine(sprite.x, sprite.y + sprite.height, sprite.x + sprite.width, sprite.y + sprite.height, 0x00ff00)
    addLine(sprite.x, sprite.y, sprite.x, sprite.y + sprite.height, 0x00ff00)
    addLine(sprite.x + sprite.width, sprite.y, sprite.x + sprite.width, sprite.y + sprite.height, 0x00ff00)
}

let monsterID = 0
const monsterNames = getMonsterNames()
const monsters = new Map<string, MonsterData>()
const characters = new Map<string, CharacterData>()
const sprites: PIXI.AnimatedSprite[] = []

const startX = -375
const startY = -2500
for (let i = 0; i < monsterNames.length; i++) {

    // Render aa:0
    for (let j = 0; j < 4; j++) {
        const x = startX + j * 50
        const y = startY + i * 50
        const data: MonsterData = {
            ...(G as unknown as GData).monsters[monsterNames[i]],
            aa: 0,
            going_x: x,
            going_y: y,
            hp: getRandomInt(1, 100),
            id: `${monsterID++}`,
            max_hp: 100,
            moving: true,
            x: x,
            y: y
        }
        const sprite = renderMonster(foreground, data, j)
        cull.add(sprite)
        monsters.set(data.id, data)
        sprites.push(sprite)
    }

    // Render aa:1
    for (let j = 0; j < 4; j++) {
        const x = 300 + startX + j * 50
        const y = startY + i * 50
        const data: MonsterData = {
            ...(G as unknown as GData).monsters[monsterNames[i]],
            aa: 1,
            going_x: x,
            going_y: y,
            hp: getRandomInt(1, 100),
            id: `${monsterID++}`,
            max_hp: 100,
            moving: true,
            x: x,
            y: y
        }
        const sprite = renderMonster(foreground, data, j)
        cull.add(sprite)
        monsters.set(data.id, data)
    }

    // Render default
    for (let j = 0; j < 4; j++) {
        const x = 600 + startX + j * 50
        const y = startY + i * 50
        const data: MonsterData = {
            ...(G as unknown as GData).monsters[monsterNames[i]],
            going_x: x,
            going_y: y,
            hp: getRandomInt(1, 100),
            id: `${monsterID++}`,
            max_hp: 100,
            moving: true,
            x: x,
            y: y
        }
        const sprite = renderMonster(foreground, data, j)
        cull.add(sprite)
        monsters.set(data.id, data)
    }
}

for (const sprite of sprites) {
    addBorder(sprite)
}

const earthiverse: CharacterData = {
    cx: {
        "hair": "hairdo106",
        "makeup": "facemakeup02"
    },
    going_x: 150,
    going_y: 0,
    hp: 1000,
    id: "earthiverse",
    max_hp: 1000,
    moving: false,
    skin: "marmor5a",
    speed: 50,
    x: 150,
    y: 0
}
const sprite2 = renderCharacter(foreground, earthiverse, 0)
cull.add(sprite2)
characters.set(earthiverse.id, earthiverse)

const wizard: CharacterData = {
    cx: {},
    going_x: 175,
    going_y: 0,
    hp: 1000,
    id: "Wizard",
    max_hp: 1000,
    moving: false,
    skin: "wizard",
    speed: 50,
    x: 175,
    y: 0
}
const sprite3 = renderCharacter(foreground, wizard, 0)
cull.add(sprite3)
characters.set(wizard.id, wizard)

const kouin: CharacterData = {
    cx: { "head": "mmakeup00", "hat": "hat221", "face": "catbatg" },
    going_x: 200,
    going_y: 0,
    hp: 1000,
    id: "kouin",
    max_hp: 1000,
    moving: false,
    skin: "marmor2g",
    speed: 50,
    x: 200,
    y: 0
}
const sprite4 = renderCharacter(foreground, kouin, 0)
cull.add(sprite4)
characters.set(kouin.id, kouin)

const spadar: CharacterData = {
    cx: { "hair": "hairdo403", "upper": "marmor5c", "head": "makeup117", "makeup": "facemakeup02", "hat": "hat311" },
    going_x: 150,
    going_y: 50,
    hp: 1000,
    id: "spadar",
    max_hp: 1000,
    moving: false,
    skin: "marmor5c",
    speed: 50,
    x: 150,
    y: 50
}
const sprite5 = renderCharacter(foreground, spadar, 0)
cull.add(sprite5)
characters.set(spadar.id, spadar)

// // setInterval(() => {
// for (let i = 0; i < 25; i++) {
//     const mType = monsterNames[getRandomInt(0, monsterNames.length)]
//     // const mType: MonsterName = "mummy"
//     const monster = {
//         ...(G as unknown as GData).monsters[mType],
//         going_x: getRandomInt(-100, 100),
//         going_y: getRandomInt(-100, 100),
//         id: `${monsterID++}`,
//         moving: true,
//         x: getRandomInt(-100, 100),
//         y: getRandomInt(-100, 100)
//     }
//     monster.hp = 1000 // Overwrite HP
//     renderMonster(foreground, monster)
//     monsters.set(monster.id, monster)
// }
// // }, 100)

// setInterval(() => {
//     const keys = [...monsters.keys()]
//     for (const id of keys) {
//         const monster = monsters.get(id)
//         if (!monster) return
//         if (!monster.moving) {
//             monster.going_x = getRandomInt(-100, 100)
//             monster.going_y = getRandomInt(-100, 100)
//             monster.moving = true
//         }
//     }
// }, 1000)

// setInterval(() => {
//     // Kill random monsters
//     const id = [...monsters.keys()][getRandomInt(0, monsters.size)]
//     const monster = monsters.get(id)
//     if (!monster) return
//     monster.hp = 0
//     if (monster.hp <= 0) monsters.delete(id)
// }, 100)

const socket = SocketIO.io({
    autoConnect: true
})
socket.on("message", (message) => console.log(`We got ${message} back`))
let i = 0
setInterval(() => {
    console.log(`Emitting Hello ${i}!`)
    socket.emit("message", `Hello #${i++}!`)
}, 1000)