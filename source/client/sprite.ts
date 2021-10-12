import * as PIXI from "pixi.js"
import { getMonsterTextures } from "./texture"

export type MonsterData = {
    aa?: number,
    hp: number,
    id: string,
    going_x: number,
    going_y: number,
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

const data = new Map<string, MonsterSpriteData>()
function animate() {
    // console.log(`Data size: ${data.size}`)
    const keys = [...data.keys()]
    for (const key of keys) {
        const datum = data.get(key)
        // Slowly fade away on death
        if (datum.monster.hp <= 0) {
            datum.sprite.alpha = datum.sprite.alpha - 0.1
            if (datum.sprite.alpha <= 0) {
                datum.sprite.stop()
                datum.sprite.destroy()
                data.delete(key)
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

export function renderMonster(container: PIXI.Container, monster: MonsterData, initialDirection = 0): PIXI.AnimatedSprite {
    const textures = getMonsterTextures(monster.skin)
    const lastDirection = initialDirection
    const sprite = new PIXI.AnimatedSprite(textures[lastDirection])
    container.addChild(sprite)
    const datum = {
        lastDirection: lastDirection,
        monster: monster,
        sprite: sprite,
        textures: textures
    }

    // Update position
    datum.sprite.x = monster.x
    datum.sprite.y = monster.y

    // Start on a random frame
    datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)))
    datum.sprite.animationSpeed = 1 / 10
    data.set(monster.id, datum)
    return sprite
}