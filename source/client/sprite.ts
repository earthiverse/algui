import * as PIXI from "pixi.js"
import { GData } from "alclient"
import { getCosmeticFaceTextures, getCosmeticHairTextures, getCosmeticHatTextures, getCosmeticMakeupTextures, getSkinColorTextures, getSkinTextures, getSkinType } from "./texture"
import G from "../G.json"
import { CharacterData, MonsterData } from "../definitions/client"

export type MonsterSpriteData = {
    data: MonsterData
    lastDirection: number
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
}

export type CharacterSpriteData = {
    data: CharacterData
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
    for (const id of [...monsters.keys()]) {
        const datum = monsters.get(id)
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
            if (datum.sprite.alpha <= 0) {
                datum.sprite.destroy({ children: true })
                monsters.delete(id)
            }
            continue
        }

        // Movement Computation
        const movementAngle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
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
        datum.sprite.x = datum.data.x - datum.sprite.width / 2
        datum.sprite.y = datum.data.y - datum.sprite.height

        // Change sprite texture based on direction
        let direction = datum.lastDirection
        if (datum.data.target) {
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
            // Play a random frame
            datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)))
            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.data.moving && !datum.data.aa) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
        } else if (datum.data.moving && !datum.sprite.playing) {
            datum.sprite.play()
        }

        // Update HP Bar
        const hpBar = datum.sprite.children[0] as PIXI.Graphics
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.data.hp / datum.data.max_hp, 2)
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y)
        }
    }

    for (const key of [...characters.keys()]) {
        const datum = characters.get(key)

        // Movement Computation
        const angle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
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
        datum.sprite.x = datum.data.x - datum.sprite.width / 2
        datum.sprite.y = datum.data.y - datum.sprite.height

        // Change sprite texture based on direction
        let direction = datum.lastDirection
        if (datum.data.target) {
            const target = monsters.get(datum.data.target) || characters.get(datum.data.target)
            if (target) {
                const targetAngle = Math.atan2(target.data.y - datum.data.y, target.data.x - datum.data.x)
                direction = radsToDirection(targetAngle)
            }
        } else if (datum.data.moving) direction = radsToDirection(angle)
        if (datum.lastDirection !== direction) {
            const randomFrame = Math.floor(Math.random() * (datum.sprite.totalFrames + 1))
            datum.sprite.textures = datum.textures[direction]
            datum.sprite.gotoAndPlay(randomFrame)

            for (let i = 1; i < datum.sprite.children.length; i++) {
                try {
                    const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                    child.textures = datum.texturesChildren[i][direction % child.totalFrames]
                    child.gotoAndPlay(Math.min(child.totalFrames, randomFrame))
                } catch (e) {
                    console.log(datum.data)
                    console.log(`# children: ${datum.sprite.children.length}`)
                    console.log(`# texturesChildren: ${datum.texturesChildren[i].length}`)
                    console.error(e)
                }
            }

            datum.lastDirection = direction
        }

        // Animate on movement
        if (!datum.data.moving) {
            // The middle sprite is the one in the "stopped" position
            datum.sprite.gotoAndStop(1)
            for (let i = 1; i < datum.sprite.children.length; i++) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.gotoAndStop(Math.min(child.totalFrames, 1))
            }
        } else if (datum.data.moving && !datum.sprite.playing) {
            datum.sprite.play()
        }

        // Update HP Bar
        const hpBar = datum.sprite.children[0] as PIXI.Graphics
        if (hpBar.visible) {
            hpBar.clear()
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.data.hp / datum.data.max_hp, 2)
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

export function removeSprite(id: string) {
    const character = characters.get(id)
    if (character) {
        character.sprite.destroy({ children: true })
        characters.delete(id)
        return
    }

    // Setting the HP to 1 will slowly fade away the monster
    const monster = monsters.get(id)
    if (monster) monster.data.hp = -1
}

export function removeAllSprites() {
    for (const [, character] of characters) character.sprite.destroy({ children: true })
    characters.clear()
    for (const [, monster] of monsters) monster.sprite.destroy({ children: true })
    monsters.clear()
}

export function renderCharacter(container: PIXI.Container, character: CharacterData, initialDirection = 0): PIXI.AnimatedSprite {
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
        container.addChild(sprite)
        sprite.interactive = true
        sprite.interactiveChildren = false
        const datum = {
            data: character,
            lastDirection: initialDirection,
            sprite: sprite,
            textures: textures,
            texturesChildren: {}
        }
        characters.set(character.id, datum)

        // Start on a random frame
        const randomFrame = Math.floor(Math.random() * (sprite.totalFrames + 1))
        sprite.gotoAndPlay(randomFrame)
        for (let i = 1; i < sprite.children.length; i++) {
            const child = sprite.children[i] as PIXI.AnimatedSprite
            child.gotoAndPlay(Math.min(child.totalFrames, randomFrame))
        }
        sprite.animationSpeed = 1 / 10

        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        hpBar.visible = false
        sprite.addChild(hpBar)
        sprite.on("mouseover", () => { sprite.children[0].visible = true })
        sprite.on("mouseout", () => { sprite.children[0].visible = false })

        // Add base skin
        if (type !== "full") {
            const baseTextures = getSkinTextures(character.skin)
            if (!baseTextures) {
                console.error(`what is going on why don't we have a texture for ${character.skin}`)
            }
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
                datum.texturesChildren[sprite.children.length - 1] = headTextures
            }

            // Add makeup
            if (character.cx.makeup) {
                const makeupTextures = getCosmeticMakeupTextures(character.cx.makeup)
                const makeup = new PIXI.AnimatedSprite(makeupTextures[initialDirection])
                if (sprite.width !== makeup.width) makeup.x += (sprite.width - makeup.width)
                makeup.y -= 1 + (G as unknown as GData).cosmetics.default_makeup_position
                sprite.addChild(makeup)
                datum.texturesChildren[sprite.children.length - 1] = makeupTextures
            }

            // Add face
            if (character.cx.face) {
                const faceTextures = getCosmeticFaceTextures(character.cx.face)
                const face = new PIXI.AnimatedSprite(faceTextures[initialDirection])
                if (sprite.width !== face.width) face.x += (sprite.width - face.width)
                face.y -= 1 + (G as unknown as GData).cosmetics.default_face_position
                sprite.addChild(face)
                datum.texturesChildren[sprite.children.length - 1] = faceTextures
            }

            // Add hair
            if (character.cx.hair) {
                const hairTextures = getCosmeticHairTextures(character.cx.hair)
                const hair = new PIXI.AnimatedSprite(hairTextures[initialDirection])
                if (sprite.width !== hair.width) hair.x += (sprite.width - hair.width)
                hair.y -= 1
                sprite.addChild(hair)
                datum.texturesChildren[sprite.children.length - 1] = hairTextures
            }

            // Add hat
            if (character.cx.hat) {
                const hatTextures = getCosmeticHatTextures(character.cx.hat)
                const hat = new PIXI.AnimatedSprite(hatTextures[initialDirection])
                if (sprite.width !== hat.width) hat.x += (sprite.width - hat.width)
                hat.y -= 1
                sprite.addChild(hat)
                datum.texturesChildren[sprite.children.length - 1] = hatTextures
            }
        }
    }

    // Update position
    sprite.x = character.x - sprite.width / 2
    sprite.y = character.y - sprite.height

    return sprite
}

export function renderMonster(container: PIXI.Container, monster: MonsterData, initialDirection = 0): PIXI.AnimatedSprite {
    let sprite: PIXI.AnimatedSprite
    if (monsters.has(monster.id)) {
        // Update the data
        const oldMonster = monsters.get(monster.id)
        for (const datum in monster) oldMonster.data[datum] = monster[datum]
        sprite = oldMonster.sprite
    } else {
        const textures = getSkinTextures(monster.skin)
        sprite = new PIXI.AnimatedSprite(textures[initialDirection])
        container.addChild(sprite)
        sprite.interactive = true
        sprite.interactiveChildren = false
        monsters.set(monster.id, {
            lastDirection: initialDirection,
            data: monster,
            sprite: sprite,
            textures: textures
        })

        // Start on a random frame
        sprite.gotoAndPlay(Math.floor(Math.random() * (sprite.totalFrames + 1)))
        sprite.animationSpeed = 1 / 10

        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        hpBar.visible = false
        sprite.addChild(hpBar)
        sprite.on("mouseover", () => { sprite.children[0].visible = true })
        sprite.on("mouseout", () => { sprite.children[0].visible = false })
    }

    // Update position
    if (monster.size && monster.size !== 1) sprite.scale.set(monster.size)
    sprite.x = monster.x - sprite.width / 2
    sprite.y = monster.y - sprite.height

    return sprite
}