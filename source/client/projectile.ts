import * as PIXI from "pixi.js"
import G from "../G.json"
import { GData } from "alclient"
import { Layers } from "../definitions/client"
import { UIProjectileData } from "../definitions/server"
import { getAnimationTextures } from "./texture"

export type ProjectileSpriteData = {
    data: UIProjectileData
    sprite: PIXI.AnimatedSprite
}

const projectiles = new Map<string, ProjectileSpriteData>()
function animate() {
    const projectilesToDelete = []
    for (const [pid, datum] of projectiles) {
        const gProjectile = (G as unknown as GData).projectiles[datum.data.projectile]
        const movementAngle = Math.atan2(datum.data.y - datum.data.going_y, datum.data.x - datum.data.going_x)
        const distanceTraveled = gProjectile.speed * PIXI.Ticker.shared.elapsedMS / 1000
        const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
        if (distanceTraveled > distanceToGoal) {
            projectilesToDelete.push(pid)
            continue
        } else {
            datum.data.x = datum.data.x - Math.cos(movementAngle) * distanceTraveled
            datum.data.y = datum.data.y - Math.sin(movementAngle) * distanceTraveled
        }
        datum.sprite.rotation = movementAngle - (Math.PI / 2)
        datum.sprite.x = datum.data.x
        datum.sprite.y = datum.data.y
        datum.sprite.zIndex = datum.data.y
    }

    for (const pid of projectilesToDelete) {
        const datum = projectiles.get(pid)
        if (datum) {
            datum.sprite.destroy({ children: true })
            projectiles.delete(pid)
        }
    }
}
PIXI.Ticker.shared.add(animate)

export function renderProjectile(layers: Layers, projectile: UIProjectileData): PIXI.AnimatedSprite {
    let sprite: PIXI.AnimatedSprite
    if (projectiles.has(projectile.pid)) {
        // Update the data
        const oldProjectile = projectiles.get(projectile.pid)
        for (const datum in projectile) oldProjectile.data[datum] = projectile[datum]
        sprite = oldProjectile.sprite
    } else {
        const gProjectile = (G as unknown as GData).projectiles[projectile.projectile]
        const textures = getAnimationTextures(gProjectile.animation)
        sprite = new PIXI.AnimatedSprite(textures)
        // sprite.cullable = true
        sprite.interactive = false
        sprite.interactiveChildren = false
        layers.foreground?.addChild(sprite)

        const datum: ProjectileSpriteData = {
            data: projectile,
            sprite: sprite
        }
        projectiles.set(projectile.pid, datum)
    }

    const movementAngle = Math.atan2(projectile.y - projectile.going_y, projectile.x - projectile.going_x)

    // Update position
    sprite.anchor.set(0.5, 0.5)
    sprite.rotation = movementAngle
    sprite.x = projectile.x
    sprite.y = projectile.y
    sprite.zIndex = projectile.y

    return sprite
}