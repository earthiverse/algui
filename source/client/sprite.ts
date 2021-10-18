import * as PIXI from "pixi.js"
import { CXData, GData } from "alclient"
import { getCosmeticFaceTextures, getCosmeticHairTextures, getCosmeticHatTextures, getCosmeticMakeupTextures, getSkinColorTextures, getSkinTextures, getSkinType } from "./texture"
import G from "./G.json"

export type MonsterData = {
    aa?: number,
    hp: number,
    id: string,
    going_x: number,
    going_y: number,
    max_hp: number,
    moving: boolean,
    size?: number,
    skin: string,
    speed: number,
    x: number,
    y: number
}
export type CharacterData = {
    cx?: CXData,
    hp: number,
    id: string,
    going_x: number,
    going_y: number,
    max_hp: number,
    moving: boolean,
    skin: string,
    speed: number,
    x: number,
    y: number
}
export type MonsterSpriteData = {
    monster: MonsterData
    lastDirection: number
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
}
export type CharacterSpriteData = {
    character: CharacterData
    lastDirection: number
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
    texturesChildren: {
        [T in number]: PIXI.Texture[][]
    }
}

const monsters = new Map<string, MonsterSpriteData>()
const characters = new Map<string, CharacterSpriteData>()
function animate() {
    // console.log(`Data size: ${data.size}`)
    for (const key of [...monsters.keys()]) {
        const datum = monsters.get(key)
        // Slowly fade away on death
        if (datum.monster.hp <= 0) {
            // Stop animating
            datum.sprite.gotoAndStop(1)

            // Hide HP bar
            datum.sprite.interactive = false
            for (const child of datum.sprite.children) {
                child.visible = false
            }

            // Reduce alpha until it's 0, then destroy the sprite object
            datum.sprite.alpha = datum.sprite.alpha - 0.1
            if (datum.sprite.alpha <= 0) {
                datum.sprite.destroy()
                monsters.delete(key)
            }
            continue
        }

        // Movement Computation
        const angle = Math.atan2(datum.monster.going_y - datum.monster.y, datum.monster.going_x - datum.monster.x)
        const distanceTravelled = datum.monster.speed * PIXI.Ticker.shared.elapsedMS / 1000
        const distanceToGoal = Math.hypot(datum.monster.going_x - datum.monster.x, datum.monster.going_y - datum.monster.y)
        if (distanceTravelled > distanceToGoal) {
            datum.monster.moving = false
            datum.monster.x = datum.monster.going_x
            datum.monster.y = datum.monster.going_y
        } else {
            datum.monster.x = datum.monster.x + Math.cos(angle) * distanceTravelled
            datum.monster.y = datum.monster.y + Math.sin(angle) * distanceTravelled
        }
        datum.sprite.x = datum.monster.x - datum.sprite.width / 2
        datum.sprite.y = datum.monster.y - datum.sprite.height

        // Change sprite texture based on direction
        let direction = datum.lastDirection
        if (datum.monster.moving) direction = radsToDirection(angle)
        if (datum.lastDirection !== direction) {
            datum.sprite.textures = datum.textures[direction]
            // Play a random frame
            datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)))
            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.monster.moving && !datum.monster.aa) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
        } else if (datum.monster.moving && !datum.sprite.playing) {
            datum.sprite.play()
        }

        // Update HP Bar
        const hpBar = datum.sprite.children[0] as PIXI.Graphics
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.monster.hp / datum.monster.max_hp, 2)
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y)
        }
    }

    for (const key of [...characters.keys()]) {
        const datum = characters.get(key)

        // Movement Computation
        const angle = Math.atan2(datum.character.going_y - datum.character.y, datum.character.going_x - datum.character.x)
        const distanceTravelled = datum.character.speed * PIXI.Ticker.shared.elapsedMS / 1000
        const distanceToGoal = Math.hypot(datum.character.going_x - datum.character.x, datum.character.going_y - datum.character.y)
        if (distanceTravelled > distanceToGoal) {
            datum.character.moving = false
            datum.character.x = datum.character.going_x
            datum.character.y = datum.character.going_y
        } else {
            datum.character.x = datum.character.x + Math.cos(angle) * distanceTravelled
            datum.character.y = datum.character.y + Math.sin(angle) * distanceTravelled
        }
        datum.sprite.x = datum.character.x - datum.sprite.width / 2
        datum.sprite.y = datum.character.y - datum.sprite.height

        // Change sprite texture based on direction
        let direction = datum.lastDirection
        if (datum.character.moving) direction = radsToDirection(angle)
        if (datum.lastDirection !== direction) {
            const randomFrame = Math.floor(Math.random() * (datum.sprite.totalFrames + 1))
            datum.sprite.textures = datum.textures[direction]
            datum.sprite.gotoAndPlay(randomFrame)

            for (let i = 1; i < datum.sprite.children.length; i++) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.textures = datum.texturesChildren[i][direction]
                child.gotoAndPlay(Math.min(child.totalFrames, randomFrame))
            }

            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.character.moving) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
            for (let i = 1; i < datum.sprite.children.length; i++) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.gotoAndStop(Math.min(child.totalFrames, 1))
            }
        } else if (datum.character.moving && !datum.sprite.playing) {
            datum.sprite.play()
        }

        // Update HP Bar
        const hpBar = datum.sprite.children[0] as PIXI.Graphics
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.character.hp / datum.character.max_hp, 2)
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y)
        }
    }
}
PIXI.Ticker.shared.add(animate)

function radsToDirection(angle: number): number {
    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
        return 1 // East
    } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
        return 0 // North
    } else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
        return 3 // West
    } else {
        return 2 // South
    }
}

export function renderCharacter(container: PIXI.Container, character: CharacterData, initialDirection = 0): PIXI.AnimatedSprite {
    const type = getSkinType(character.skin)
    // Defaults
    if (!character.cx) character.cx = {}

    // Skin color is based off the head
    let textures: PIXI.Texture[][]
    if (type == "full") {
        textures = getSkinTextures(character.skin)
    } else {
        if (!character.cx.head) character.cx.head = "makeup117"
        textures = getSkinColorTextures(character.cx.head)
    }
    const sprite = new PIXI.AnimatedSprite(textures[initialDirection])
    sprite.interactive = true
    sprite.interactiveChildren = false
    const datum = {
        character: character,
        lastDirection: initialDirection,
        sprite: sprite,
        textures: textures,
        texturesChildren: {}
    }

    // Add hp bar (will be updated in animate loop)
    const hpBar = new PIXI.Graphics()
    hpBar.visible = false
    sprite.addChild(hpBar)
    sprite.on("mouseover", () => { sprite.children[0].visible = true })
    sprite.on("mouseout", () => { sprite.children[0].visible = false })

    // Add base skin
    if (type !== "full") {
        const baseTextures = getSkinTextures(character.skin)
        const baseSkin = new PIXI.AnimatedSprite(baseTextures[initialDirection])
        if (sprite.width !== baseSkin.width) baseSkin.x += (sprite.width - baseSkin.width)
        sprite.addChild(baseSkin)
        datum.texturesChildren[sprite.children.length - 1] = baseTextures

        // Add head
        if (character.cx.head) {
            const headTextures = getCosmeticMakeupTextures(character.cx.head)
            const head = new PIXI.AnimatedSprite(headTextures[initialDirection])
            if (sprite.width !== head.width) head.x += (sprite.width - head.width)
            head.y -= 1
            sprite.addChild(head)
            datum.texturesChildren[sprite.children.length - 1]
        }

        // Add makeup
        if (character.cx.makeup) {
            const makeupTextures = getCosmeticMakeupTextures(character.cx.makeup)
            const makeup = new PIXI.AnimatedSprite(makeupTextures[initialDirection])
            if (sprite.width !== makeup.width) makeup.x += (sprite.width - makeup.width)
            makeup.y -= 1 + (G as unknown as GData).cosmetics.default_makeup_position
            sprite.addChild(makeup)
            datum.texturesChildren[sprite.children.length - 1]
        }

        // Add face
        if (character.cx.face) {
            const faceTextures = getCosmeticFaceTextures(character.cx.face)
            const face = new PIXI.AnimatedSprite(faceTextures[initialDirection])
            if (sprite.width !== face.width) face.x += (sprite.width - face.width)
            face.y -= 1 + (G as unknown as GData).cosmetics.default_face_position
            sprite.addChild(face)
            datum.texturesChildren[sprite.children.length - 1]
        }

        // Add hair
        if (character.cx.hair) {
            const hairTextures = getCosmeticHairTextures(character.cx.hair)
            const hair = new PIXI.AnimatedSprite(hairTextures[initialDirection])
            if (sprite.width !== hair.width) hair.x += (sprite.width - hair.width)
            hair.y -= 1
            sprite.addChild(hair)
            datum.texturesChildren[sprite.children.length - 1]
        }

        // Add hat
        if (character.cx.hat) {
            const hatTextures = getCosmeticHatTextures(character.cx.hat)
            const hat = new PIXI.AnimatedSprite(hatTextures[initialDirection])
            if (sprite.width !== hat.width) hat.x += (sprite.width - hat.width)
            hat.y -= 1
            sprite.addChild(hat)
            datum.texturesChildren[sprite.children.length - 1]
        }
    }

    // Update position
    datum.sprite.x = character.x - datum.sprite.width / 2
    datum.sprite.y = character.y - datum.sprite.height

    // Start on a random frame
    const randomFrame = Math.floor(Math.random() * (datum.sprite.totalFrames + 1))
    datum.sprite.gotoAndPlay(randomFrame)
    for (let i = 1; i < datum.sprite.children.length; i++) {
        const child = datum.sprite.children[i] as PIXI.AnimatedSprite
        child.gotoAndPlay(Math.min(child.totalFrames, randomFrame))
    }
    datum.sprite.animationSpeed = 1 / 10
    characters.set(character.id, datum)

    container.addChild(sprite)
    return sprite
}

export function renderMonster(container: PIXI.Container, monster: MonsterData, initialDirection = 0): PIXI.AnimatedSprite {
    const textures = getSkinTextures(monster.skin)
    const sprite = new PIXI.AnimatedSprite(textures[initialDirection])
    sprite.interactive = true
    sprite.interactiveChildren = false
    const datum = {
        lastDirection: initialDirection,
        monster: monster,
        sprite: sprite,
        textures: textures
    }

    // Add hp bar (will be updated in animate loop)
    const hpBar = new PIXI.Graphics()
    hpBar.visible = false
    sprite.addChild(hpBar)
    sprite.on("mouseover", () => { sprite.children[0].visible = true })
    sprite.on("mouseout", () => { sprite.children[0].visible = false })

    // Update position
    if (monster.size && monster.size !== 1) datum.sprite.scale.set(monster.size)
    datum.sprite.x = monster.x - datum.sprite.width / 2
    datum.sprite.y = monster.y - datum.sprite.height

    // Start on a random frame
    datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)))
    datum.sprite.animationSpeed = 1 / 10
    monsters.set(monster.id, datum)

    container.addChild(sprite)
    return sprite
}