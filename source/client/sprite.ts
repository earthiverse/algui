import * as PIXI from "pixi.js"
import { GData } from "alclient"
import { getCosmeticFaceTextures, getCosmeticHairTextures, getCosmeticHatTextures, getCosmeticMakeupTextures, getSkinColorTextures, getSkinTextures, getSkinType } from "./texture"
import G from "../G.json"
import { CharacterData, Layers, MonsterData } from "../definitions/client"

export type MonsterSpriteData = {
    data: MonsterData
    lastDirection: number
    focusedHover?: boolean
    hpBar: PIXI.Graphics
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
}

export type CharacterSpriteData = {
    data: CharacterData
    lastDirection: number
    focusedHover?: boolean
    hpBar: PIXI.Graphics
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
    texturesChildren: {
        [T in number]: PIXI.Texture[][]
    }
}

let focused: string
const monsters = new Map<string, MonsterSpriteData>()
const characters = new Map<string, CharacterSpriteData>()
function animate() {
    // console.log(`Data size: ${data.size}`)
    const monstersToDelete = []
    for (const [id, datum] of monsters) {
        // Slowly fade away on death
        if (datum.data.hp <= 0) {
            // Stop animating
            datum.sprite.gotoAndStop(1)

            // Hide HP bar
            datum.sprite.interactive = false
            for (const child of datum.sprite.children) {
                child.visible = false
            }

            // Reduce alpha until it's 0, then destroy the sprite object
            datum.sprite.alpha = datum.sprite.alpha - 0.1
            if (datum.sprite.alpha <= 0) monstersToDelete.push(id)
            continue
        }

        // Movement Computation
        const movementAngle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
        if (datum.data.moving) {
            const distanceTravelled = datum.data.speed * PIXI.Ticker.shared.elapsedMS / 1000
            const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
            if (distanceTravelled > distanceToGoal) {
                datum.data.moving = false
                datum.data.x = datum.data.going_x
                datum.data.y = datum.data.going_y
            } else {
                datum.data.x = datum.data.x + Math.cos(movementAngle) * distanceTravelled
                datum.data.y = datum.data.y + Math.sin(movementAngle) * distanceTravelled
            }
        }
        datum.sprite.x = datum.data.x - datum.sprite.width / 2
        datum.sprite.y = datum.data.y - datum.sprite.height

        // Change sprite texture based on direction
        let direction = datum.lastDirection
        if (datum.data.target && (characters.has(datum.data.target) || monsters.has(datum.data.target))) {
            const target = characters.get(datum.data.target) || monsters.get(datum.data.target)
            if (target) {
                const targetAngle = Math.atan2(target.data.y - datum.data.y, target.data.x - datum.data.x)
                direction = radsToDirection(targetAngle)
            }
        } else if (datum.data.moving) {
            direction = radsToDirection(movementAngle)
        }
        if (datum.lastDirection !== direction) {
            datum.sprite.textures = datum.textures[direction]
            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.data.moving && !datum.data.aa && datum.sprite.playing) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
        } else if (datum.data.moving && !datum.sprite.playing) {
            datum.sprite.play()
        }

        if (datum.data.s.burned) {
            datum.sprite.tint = 0xFF0000
        } else {
            datum.sprite.tint = 0xFFFFFF
        }

        // Update HP Bar
        const hpBar = datum.hpBar
        hpBar.visible = (focused == datum.data.id) || (datum.focusedHover ?? false)
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(datum.sprite.x, datum.sprite.y - 4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(datum.sprite.x + 1, datum.sprite.y - 3, (datum.sprite.width - 2) * datum.data.hp / datum.data.max_hp, 2)
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y)
        }

        datum.sprite.zIndex = datum.sprite.y
    }
    for (const id of monstersToDelete) {
        const datum = monsters.get(id)
        if (datum) {
            datum.hpBar.destroy()
            datum.sprite.destroy({ children: true })
            monsters.delete(id)
        }
    }

    for (const [id, datum] of characters) {
        // Movement Computation
        const angle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
        if (datum.data.moving) {
            const distanceTravelled = datum.data.speed * PIXI.Ticker.shared.elapsedMS / 1000
            const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
            if (distanceTravelled > distanceToGoal) {
                datum.data.moving = false
                datum.data.x = datum.data.going_x
                datum.data.y = datum.data.going_y
            } else {
                datum.data.x = datum.data.x + Math.cos(angle) * distanceTravelled
                datum.data.y = datum.data.y + Math.sin(angle) * distanceTravelled
            }
        }
        datum.sprite.x = datum.data.x - datum.sprite.width / 2
        datum.sprite.y = datum.data.y - datum.sprite.height

        let direction = datum.lastDirection
        if (datum.data.target && (characters.has(datum.data.target) || monsters.has(datum.data.target))) {
            // Change sprite texture based on target
            const target = monsters.get(datum.data.target) || characters.get(datum.data.target)
            if (target) {
                const targetAngle = Math.atan2(target.data.y - datum.data.y, target.data.x - datum.data.x)
                direction = radsToDirection(targetAngle)
            }
        } else if (datum.data.moving) {
            // Change sprite texture based on direction
            direction = radsToDirection(angle)
        }
        if (datum.lastDirection !== direction) {
            datum.sprite.textures = datum.textures[direction]

            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.textures = datum.texturesChildren[i][direction]
            }

            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.data.moving && datum.sprite.playing) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.gotoAndStop(child.totalFrames > 1 ? 1 : 0)
            }
        } else if (datum.data.moving && !datum.sprite.playing) {
            datum.sprite.play()
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.play()
            }
        }

        if (datum.data.s.burned) {
            datum.sprite.tint = 0xFF0000
        } else {
            datum.sprite.tint = 0xFFFFFF
        }

        // Update HP Bar
        const hpBar = datum.hpBar
        hpBar.visible = (focused == datum.data.id) || (datum.focusedHover ?? false)
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(datum.sprite.x, datum.sprite.y - 4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(datum.sprite.x + 1, datum.sprite.y - 3, (datum.sprite.width - 2) * datum.data.hp / datum.data.max_hp, 2)
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y)
        }

        datum.sprite.zIndex = datum.sprite.y
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

export function removeSprite(id: string) {
    const character = characters.get(id)
    if (character) {
        character.hpBar.destroy()
        character.sprite.destroy({ children: true })
        characters.delete(id)
        return
    }

    // Setting the HP to 1 will slowly fade away the monster
    const monster = monsters.get(id)
    if (monster) monster.data.hp = -1
}

export function removeAllSprites() {
    for (const [, character] of characters) {
        character.hpBar.destroy()
        character.sprite.destroy({ children: true })
    }
    characters.clear()
    for (const [, monster] of monsters) {
        monster.hpBar.destroy()
        monster.sprite.destroy({ children: true })
    }
    monsters.clear()
}

export function renderCharacter(layers: Layers, character: CharacterData, initialDirection = 0): PIXI.AnimatedSprite {
    // TODO: Update so we don't have to keep destroying the character...
    // Remove the old sprite
    let sprite: PIXI.AnimatedSprite
    if (characters.has(character.id)) {
        // Update the data
        const oldCharacter = characters.get(character.id)
        for (const datum in character) oldCharacter.data[datum] = character[datum]
        sprite = oldCharacter.sprite
    } else {
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
        sprite = new PIXI.AnimatedSprite(textures[initialDirection])
        sprite.interactive = true
        sprite.interactiveChildren = false
        sprite.sortableChildren = true

        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        hpBar.visible = false
        sprite.on("click", () => { focused = character.id })
        sprite.on("mouseover", () => { datum.focusedHover = true })
        sprite.on("mouseout", () => { datum.focusedHover = false })
        layers.hpBars.addChild(hpBar)

        const datum: CharacterSpriteData = {
            data: character,
            hpBar: hpBar,
            lastDirection: initialDirection,
            sprite: sprite,
            textures: textures,
            texturesChildren: {}
        }
        characters.set(character.id, datum)

        // Start on a random frame
        if (character.moving) {
            const randomFrame = Math.floor(Math.random() * (sprite.totalFrames + 1))
            sprite.gotoAndPlay(randomFrame)
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = sprite.children[i] as PIXI.AnimatedSprite
                child.gotoAndPlay(child.totalFrames > 1 ? randomFrame : 0)
            }
        } else {
            sprite.gotoAndStop(1)
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = sprite.children[i] as PIXI.AnimatedSprite
                child.gotoAndStop(child.totalFrames > 1 ? 1 : 0)
            }
        }
        sprite.animationSpeed = character.speed / 100000

        // Add base skin
        if (type !== "full") {
            const covers = (G as unknown as GData).cosmetics.prop[character.skin]?.includes("covers") ?? false
            const noHair = (G as unknown as GData).cosmetics.prop[character.skin]?.includes("no_hair") ?? false

            // Add skin here, unless it's covers, in which case it will be added at the end
            if (!covers) {
                const baseTextures = getSkinTextures(character.skin)
                const baseSkin = new PIXI.AnimatedSprite(baseTextures[initialDirection])
                if (sprite.width !== baseSkin.width) baseSkin.x += (sprite.width - baseSkin.width)
                baseSkin.zIndex = -1
                sprite.addChild(baseSkin)
                datum.texturesChildren[sprite.children.length - 1] = baseTextures
            }

            // Add head
            if (character.cx.head) {
                const headTextures = getCosmeticMakeupTextures(character.cx.head)
                const head = new PIXI.AnimatedSprite(headTextures[initialDirection])
                if (sprite.width !== head.width) head.x += (sprite.width - head.width)
                head.y -= 0
                head.zIndex = 0
                sprite.addChild(head)
                datum.texturesChildren[sprite.children.length - 1] = headTextures
            }

            // Add face
            if (character.cx.face) {
                const faceTextures = getCosmeticFaceTextures(character.cx.face)
                const face = new PIXI.AnimatedSprite(faceTextures[initialDirection])
                if (sprite.width !== face.width) face.x += (sprite.width - face.width)
                // face.y -= 1 + (G as unknown as GData).cosmetics.default_face_position
                face.y -= 0
                face.zIndex = 1
                sprite.addChild(face)
                datum.texturesChildren[sprite.children.length - 1] = faceTextures
            }

            // Add makeup
            if (character.cx.makeup) {
                const makeupTextures = getCosmeticMakeupTextures(character.cx.makeup)
                const makeup = new PIXI.AnimatedSprite(makeupTextures[initialDirection])
                if (sprite.width !== makeup.width) makeup.x += (sprite.width - makeup.width)
                // makeup.y -= 1 + (G as unknown as GData).cosmetics.default_makeup_position
                makeup.y -= 0
                makeup.zIndex = 2
                sprite.addChild(makeup)
                datum.texturesChildren[sprite.children.length - 1] = makeupTextures
            }

            // Add hair
            if (character.cx.hair && !noHair) {
                const hairTextures = getCosmeticHairTextures(character.cx.hair)
                const hair = new PIXI.AnimatedSprite(hairTextures[initialDirection])
                if (sprite.width !== hair.width) hair.x += (sprite.width - hair.width)
                hair.zIndex = 3
                hair.y -= 0
                sprite.addChild(hair)
                datum.texturesChildren[sprite.children.length - 1] = hairTextures
            }

            // Add hat
            if (character.cx.hat) {
                const hatTextures = getCosmeticHatTextures(character.cx.hat)
                const hat = new PIXI.AnimatedSprite(hatTextures[initialDirection])
                if (sprite.width !== hat.width) hat.x += (sprite.width - hat.width)
                hat.zIndex = 4
                hat.y -= 0
                sprite.addChild(hat)
                datum.texturesChildren[sprite.children.length - 1] = hatTextures
            }

            // Add covers
            if (covers) {
                const coversTextures = getSkinTextures(character.skin)
                const covers = new PIXI.AnimatedSprite(coversTextures[initialDirection])
                if (sprite.width !== covers.width) covers.x += (sprite.width - covers.width)
                covers.zIndex = 5
                sprite.addChild(covers)
                datum.texturesChildren[sprite.children.length - 1] = coversTextures
            }
        }
        layers.foreground.addChild(sprite)
    }

    // Update position
    sprite.x = character.x - sprite.width / 2
    sprite.y = character.y - sprite.height
    sprite.zIndex = sprite.y

    return sprite
}

export function renderMonster(layers: Layers, monster: MonsterData, initialDirection = 0): PIXI.AnimatedSprite {
    let sprite: PIXI.AnimatedSprite
    if (monsters.has(monster.id)) {
        // Update the data
        const oldMonster = monsters.get(monster.id)
        for (const datum in monster) oldMonster.data[datum] = monster[datum]
        sprite = oldMonster.sprite
    } else {
        const textures = getSkinTextures(monster.skin)
        sprite = new PIXI.AnimatedSprite(textures[initialDirection])
        layers.foreground.addChild(sprite)
        sprite.interactive = true
        sprite.interactiveChildren = false


        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        hpBar.visible = false
        sprite.on("click", () => { focused = monster.id })
        sprite.on("mouseover", () => { datum.focusedHover = true })
        sprite.on("mouseout", () => { datum.focusedHover = false })
        layers.hpBars.addChild(hpBar)

        const datum: MonsterSpriteData = {
            data: monster,
            hpBar: hpBar,
            lastDirection: initialDirection,
            sprite: sprite,
            textures: textures
        }
        monsters.set(monster.id, datum)

        // Start on a random frame
        if (monster.moving){
            sprite.gotoAndPlay(Math.floor(Math.random() * (sprite.totalFrames + 1)))
        } else {
            sprite.gotoAndStop(1)
        }
        sprite.animationSpeed = monster.speed / 10000
    }

    // Update position
    if (monster.size && monster.size !== 1) sprite.scale.set(monster.size)
    sprite.x = monster.x - sprite.width / 2
    sprite.y = monster.y - sprite.height
    sprite.zIndex = sprite.y

    return sprite
}