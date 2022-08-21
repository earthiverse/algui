import * as PIXI from "pixi.js"
import { GData } from "alclient"
import { getCosmeticFaceTextures, getCosmeticHairTextures, getCosmeticHatTextures, getCosmeticHeadTextures, getCosmeticMakeupTextures, getSkinColorTextures, getSkinTextures, getSkinType } from "./texture"
import G from "../G.json"
import { Layers } from "../definitions/client"
import { addFilter, BURNED_FILTER, POISONED_FILTER, removeFilter } from "./filters"
import { UICharacterData, UIMonsterData } from "../definitions/server"

export type MonsterSpriteData = {
    data: UIMonsterData
    lastDirection: number
    focusedHover?: boolean
    hpBar: PIXI.Graphics
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
}

export type CharacterSpriteData = {
    data: UICharacterData
    lastDirection: number
    focusedHover?: boolean
    hpBar: PIXI.Graphics
    idTag: PIXI.Graphics
    manaBar: PIXI.Graphics
    sprite: PIXI.AnimatedSprite
    textures: PIXI.Texture[][]
    texturesChildren: {
        [T in number]: PIXI.Texture[][]
    }
}

let focusedChar: string
let focusedMon: string
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
            datum.sprite.alpha = datum.sprite.alpha - PIXI.Ticker.shared.elapsedMS / 500
            if (datum.sprite.alpha <= 0) monstersToDelete.push(id)
            continue
        }

        // Movement Computation
        const movementAngle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
        if (datum.data.moving) {
            const distanceTraveled = datum.data.speed * PIXI.Ticker.shared.elapsedMS / 1000
            const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
            if (distanceTraveled > distanceToGoal) {
                datum.data.moving = false
                datum.data.x = datum.data.going_x
                datum.data.y = datum.data.going_y
            } else {
                datum.data.x = datum.data.x + Math.cos(movementAngle) * distanceTraveled
                datum.data.y = datum.data.y + Math.sin(movementAngle) * distanceTraveled
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
        } else if ((datum.data.aa || datum.data.moving) && !datum.sprite.playing) {
            // Set animation speed
            datum.sprite.animationSpeed = datum.data.speed / 1000

            // Start animation
            datum.sprite.play()
        }

        // Filters for status affects
        if (datum.data.s?.burned) addFilter(datum.sprite, BURNED_FILTER)
        else removeFilter(datum.sprite, BURNED_FILTER)
        if (datum.data.s?.poisoned) addFilter(datum.sprite, POISONED_FILTER)
        else removeFilter(datum.sprite, POISONED_FILTER)

        // Update HP Bar
        const hpBar = datum.hpBar
        hpBar.visible = (focusedMon == datum.data.id) || (datum.focusedHover ?? false)
        if (hpBar.visible) {
            hpBar.clear()
            const spriteHalfWidth = datum.sprite.width / 2
            hpBar.beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(datum.sprite.x - (20 - spriteHalfWidth), datum.sprite.y - 12, 40, 10)
                .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(datum.sprite.x - (18 - spriteHalfWidth), datum.sprite.y - 10, 36, 6)
                .beginFill(0xFF0000).lineStyle(1, 0xFF0000, 1, 1, true).drawRect(datum.sprite.x - (16 - spriteHalfWidth), datum.sprite.y - 8, 32 * (datum.data.hp / datum.data.max_hp), 2)
        }

        datum.sprite.zIndex = datum.data.y
    }
    for (const id of monstersToDelete) {
        const datum = monsters.get(id)
        if (datum) {
            datum.hpBar.destroy({ baseTexture: false, children: true, texture: false })
            datum.sprite.destroy({ baseTexture: false, children: true, texture: false })
            monsters.delete(id)
        }
    }

    for (const [, datum] of characters) {
        // Movement Computation
        const angle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
        if (datum.data.moving) {
            const distanceTraveled = datum.data.speed * PIXI.Ticker.shared.elapsedMS / 1000
            const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
            if (distanceTraveled > distanceToGoal) {
                datum.data.moving = false
                datum.data.x = datum.data.going_x
                datum.data.y = datum.data.going_y
            } else {
                datum.data.x = datum.data.x + Math.cos(angle) * distanceTraveled
                datum.data.y = datum.data.y + Math.sin(angle) * distanceTraveled
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
            // Set animation speed
            const speed = datum.data.speed / 1000
            datum.sprite.animationSpeed = speed
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.animationSpeed = speed
            }

            // Start animation
            datum.sprite.play()
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = datum.sprite.children[i] as PIXI.AnimatedSprite
                child.play()
            }
        }

        if (datum.data.s?.burned) {
            // Add the burned filter
            addFilter(datum.sprite, BURNED_FILTER)
        } else {
            // Remove the burned filter
            removeFilter(datum.sprite, BURNED_FILTER)
        }

        // Update Stat Bars
        const hpBar = datum.hpBar
        const manaBar = datum.manaBar
        hpBar.visible = (focusedChar == datum.data.id) || (datum.focusedHover ?? false)
        manaBar.visible = (focusedChar == datum.data.id)
        if (hpBar.visible) {
            hpBar.clear()
            const spriteHalfWidth = datum.sprite.width / 2
            hpBar.beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(datum.sprite.x - (20 - spriteHalfWidth), datum.sprite.y - 30, 40, 10)
                .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(datum.sprite.x - (18 - spriteHalfWidth), datum.sprite.y - 28, 36, 6)
                .beginFill(0xFF0000).lineStyle(1, 0xFF0000, 1, 1, true).drawRect(datum.sprite.x - (16 - spriteHalfWidth), datum.sprite.y - 26, 32 * (datum.data.hp / datum.data.max_hp), 2)
        }
        if (manaBar.visible) {
            manaBar.clear()
            const spriteHalfWidth = datum.sprite.width / 2
            manaBar.beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(datum.sprite.x - (20 - spriteHalfWidth), datum.sprite.y - 6, 40, 10)
                .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(datum.sprite.x - (18 - spriteHalfWidth), datum.sprite.y - 4, 36, 6)
                .beginFill(0x0000FF).lineStyle(1, 0x0000FF, 1, 1, true).drawRect(datum.sprite.x - (16 - spriteHalfWidth), datum.sprite.y - 2, 32 * (datum.data.mp / datum.data.max_mp), 2)
        }

        // Update ID tag
        const idTag = datum.idTag
        const idText = new PIXI.Text(datum.data.id, new PIXI.TextStyle({ align: "center", fill: 0xFFFFFF, fontFamily: "m5x7", fontSize: 24 }))
        const idClass = new PIXI.Text(datum.data.ctype[0].toUpperCase(), new PIXI.TextStyle({ align: "center", fill: getClassColor(datum.data.ctype), fontFamily: "m5x7", fontSize: 24 }))
        const idLvl = new PIXI.Text(datum.data.level.toString(), new PIXI.TextStyle({ align: "center", fill: 0xFFFFFF, fontFamily: "m5x7", fontSize: 24 }))
        idText.blendMode = PIXI.BLEND_MODES.NORMAL_NPM
        idClass.blendMode = PIXI.BLEND_MODES.NORMAL_NPM
        idLvl.blendMode = PIXI.BLEND_MODES.NORMAL_NPM
        idText.scale.set(0.5)
        idClass.scale.set(0.5)
        idLvl.scale.set(0.5)
        idText.roundPixels = true
        idClass.roundPixels = true
        idLvl.roundPixels = true
        idTag.visible = datum.sprite.visible
        idClass.visible = (focusedChar == datum.data.id) || (datum.focusedHover ?? false)
        idLvl.visible = idClass.visible
        idText.x = datum.sprite.x - ((idText.width / 2) - (datum.sprite.width / 2))
        idClass.x = idText.x - (idClass.width + 6)
        idLvl.x = (idText.x + idText.width) + 6
        idText.y = datum.sprite.y - 18
        idClass.y = idText.y
        idLvl.y = idText.y
        idTag.clear()
        idTag.blendMode = PIXI.BLEND_MODES.NORMAL_NPM
        idTag.beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(idText.x - 4, idText.y - 4, idText.width + 8, idText.height + 8)
            .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(idText.x - 2, idText.y - 2, idText.width + 4, idText.height + 4)
        if (idClass.visible) {
            idTag.beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(idClass.x - 4, idClass.y - 4, idClass.width + 8, idClass.height + 8)
                .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(idClass.x - 2, idClass.y - 2, idClass.width + 4, idClass.height + 4)
                .beginFill(0x888888).lineStyle(1, 0x888888, 1, 1, true).drawRect(idLvl.x - 4, idLvl.y - 4, idLvl.width + 8, idLvl.height + 8)
                .beginFill(0x000000).lineStyle(1, 0x000000, 1, 1, true).drawRect(idLvl.x - 2, idLvl.y - 2, idLvl.width + 4, idLvl.height + 4)
        }
        for (const child of idTag.children) {
            child.destroy()
        }
        idTag.addChild(idText, idClass, idLvl)
        datum.sprite.zIndex = datum.data.y
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
        character.hpBar.destroy({ baseTexture: false, children: true, texture: false })
        character.manaBar.destroy({ baseTexture: false, children: true, texture: false })
        character.idTag.destroy({ baseTexture: false, children: true, texture: false })
        character.sprite.destroy({ baseTexture: false, children: true, texture: false })
        characters.delete(id)
        return
    }

    // Setting the HP to -1 will slowly fade away the monster
    const monster = monsters.get(id)
    if (monster) monster.data.hp = -1
}

export function removeAllSprites() {
    for (const [, character] of characters) {
        character.hpBar.destroy({ baseTexture: false, children: true, texture: false })
        character.manaBar.destroy({ baseTexture: false, children: true, texture: false })
        character.sprite.destroy({ baseTexture: false, children: true, texture: false })
        character.idTag.destroy({ baseTexture: false, children: true, texture: false })
    }
    characters.clear()
    for (const [, monster] of monsters) {
        monster.hpBar.destroy({ baseTexture: false, children: true, texture: false })
        monster.sprite.destroy({ baseTexture: false, children: true, texture: false })
    }
    monsters.clear()
}

export function renderCharacter(layers: Layers, character: UICharacterData, initialDirection = 0): PIXI.AnimatedSprite {
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
        // sprite.cullable = true
        sprite.interactive = true
        sprite.interactiveChildren = false
        sprite.sortableChildren = true

        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        const manaBar = new PIXI.Graphics()
        hpBar.visible = false
        manaBar.visible = false
        sprite.on("click", () => {
            if (focusedChar != character.id) {
                focusedChar = character.id
            } else {
                focusedChar = null
            }
        })
        sprite.on("mouseover", () => { datum.focusedHover = true })
        sprite.on("mouseout", () => { datum.focusedHover = false })
        layers.hpBars.addChild(hpBar, manaBar)

        // Add ID tag
        const idTag = new PIXI.Graphics()
        idTag.visible = false
        layers.idTags.addChild(idTag)

        const datum: CharacterSpriteData = {
            data: character,
            hpBar: hpBar,
            idTag: idTag,
            lastDirection: initialDirection,
            manaBar: manaBar,
            sprite: sprite,
            textures: textures,
            texturesChildren: {}
        }
        characters.set(character.id, datum)

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
                const headTextures = getCosmeticHeadTextures(character.cx.head)
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
        layers.foreground?.addChild(sprite)

        if (character.moving) {
            // Set animation speed
            const speed = character.speed / 1000
            sprite.animationSpeed = speed
            for (let i = datum.sprite.children.length - 1; i >= 0 ; i--) {
                const child = sprite.children[i] as PIXI.AnimatedSprite
                child.animationSpeed = speed
            }

            // Start on a random frame
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

    }

    // Update position
    sprite.x = character.x - sprite.width / 2
    sprite.y = character.y - sprite.height
    sprite.zIndex = character.y

    return sprite
}

export function renderMonster(layers: Layers, monster: UIMonsterData, initialDirection = 0): PIXI.AnimatedSprite {
    let sprite: PIXI.AnimatedSprite
    if (monsters.has(monster.id)) {
        // Update the data
        const oldMonster = monsters.get(monster.id)
        for (const datum in monster) oldMonster.data[datum] = monster[datum]
        sprite = oldMonster.sprite
    } else {
        const textures = getSkinTextures(monster.skin)
        sprite = new PIXI.AnimatedSprite(textures[initialDirection])
        // sprite.cullable = true
        sprite.interactive = true
        sprite.interactiveChildren = false
        layers.foreground?.addChild(sprite)

        // Add hp bar (will be updated in animate loop)
        const hpBar = new PIXI.Graphics()
        hpBar.visible = false
        sprite.on("click", () => {
            if (focusedMon != monster.id) {
                focusedMon = monster.id
            } else {
                focusedMon = null
            }
        })
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

        if (monster.moving) {
            // Set animation speed
            sprite.animationSpeed = monster.speed / 1000

            // Start on a random frame
            sprite.gotoAndPlay(Math.floor(Math.random() * (sprite.totalFrames + 1)))
        } else {
            sprite.gotoAndStop(1)
        }
    }

    // Update position
    if (monster.size && monster.size !== 1) sprite.scale.set(monster.size)
    if (monster.x !== undefined) sprite.x = monster.x - sprite.width / 2
    if (monster.y !== undefined) {
        sprite.y = monster.y - sprite.height
        sprite.zIndex = monster.y
    }

    return sprite
}

function getClassColor(ctype: string): PIXI.TextStyleFill {
    switch (ctype) {
        case "merchant": return 0x7F7F7F
        case "mage": return 0x3E6EED
        case "warrior": return 0xF07F2F
        case "priest": return 0xEB4D82
        case "ranger": return 0x8A512B
        case "paladin": return 0xA3B4B9
        case "rogue": return 0x44B75C
        default: return 0xFFFFFF
    }
}
