import * as PIXI from "pixi.js"
import { SpatialHash } from "pixi-cull"
import { Layer } from "@pixi/layers"
import { GData, GGeometry, MapName } from "alclient"
import { getMapTextures } from "./texture"
import G from "./G.json"

function renderTile(container: PIXI.Container, texture: PIXI.Texture, x: number, y: number) {
    const tile = new PIXI.Sprite(texture)
    tile.x = x
    tile.y = y
    tile.width = texture.width
    tile.height = texture.height
    container.addChild(tile)
}

function renderAnimatedTile(container: PIXI.Container, textures: PIXI.Texture[], x: number, y: number) {
    const tile = new PIXI.AnimatedSprite(textures)
    tile.x = x
    tile.y = y
    tile.width = textures[0].width
    tile.height = textures[0].height
    tile.animationSpeed = 1 / 30
    tile.play()
    container.addChild(tile)
}

export function renderMap(container: PIXI.Container, cull: SpatialHash, map: MapName): void {
    const geometry: GGeometry = (G as unknown as GData).geometry[map as MapName]

    const base = new Layer()
    base.interactiveChildren = false
    base.zOrder = -1
    container.addChild(base)
    // Draw default layer
    if (geometry.default) {
        const textures = getMapTextures(map, geometry.default)
        if (textures.length == 1) {
            const texture = textures[0]
            for (let x = geometry.min_x; x <= geometry.max_x; x += texture.width) {
                for (let y = geometry.min_y; y <= geometry.max_y; y += texture.height) {
                    renderTile(base, texture, x, y)
                }
            }
        } else {
            for (let x = geometry.min_x; x <= geometry.max_x; x += textures[0].width) {
                for (let y = geometry.min_y; y <= geometry.max_y; y += textures[0].height) {
                    renderAnimatedTile(base, textures, x, y)
                }
            }
        }
    }

    // Draw placements
    if (geometry.placements) {
        for (const [index, x1, y1, x2, y2] of geometry.placements) {
            const textures = getMapTextures(map, index)
            if (textures.length == 1) {
                const texture = textures[0]
                if (x2 != undefined) {
                    for (let x = x1; x <= x2; x += texture.width) {
                        for (let y = y1; y <= y2; y += texture.height) {
                            renderTile(base, texture, x, y)
                        }
                    }
                } else {
                    renderTile(base, texture, x1, y1)
                }
            } else {
                if (x2 != undefined) {
                    for (let x = x1; x <= x2; x += textures[0].width) {
                        for (let y = y1; y <= y2; y += textures[0].height) {
                            renderAnimatedTile(base, textures, x, y)
                        }
                    }
                } else {
                    renderAnimatedTile(base, textures, x1, y1)
                }
            }
        }
    }
    cull.addContainer(base, true)

    // Draw groups
    const top = new Layer()
    top.interactiveChildren = false
    top.zOrder = 1
    container.addChild(top)
    if (geometry.groups) {
        for (const group of geometry.groups) {
            for (const [index, x1, y1, x2, y2] of group) {
                const textures = getMapTextures(map, index)
                if (textures.length == 1) {
                    const texture = textures[0]
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += texture.width) {
                            for (let y = y1; y <= y2; y += texture.height) {
                                renderTile(top, texture, x, y)
                            }
                        }
                    } else {
                        renderTile(base, texture, x1, y1)
                    }
                } else {
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += textures[0].width) {
                            for (let y = y1; y <= y2; y += textures[0].height) {
                                renderAnimatedTile(top, textures, x, y)
                            }
                        }
                    } else {
                        renderAnimatedTile(base, textures, x1, y1)
                    }
                }
            }
        }
    }
    cull.addContainer(top, true)
}