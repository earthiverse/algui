import * as PIXI from "pixi.js"
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

export function renderMap(background: PIXI.Container, foreground: PIXI.Container, map: MapName): void {
    const geometry: GGeometry = (G as unknown as GData).geometry[map as MapName]

    let isBackgroundAnimated = false
    // Draw default layer
    if (geometry.default) {
        const textures = getMapTextures(map, geometry.default)
        if (textures.length == 1) {
            const texture = textures[0]
            for (let x = geometry.min_x; x <= geometry.max_x; x += texture.width) {
                for (let y = geometry.min_y; y <= geometry.max_y; y += texture.height) {
                    renderTile(background, texture, x, y)
                }
            }
        } else {
            isBackgroundAnimated = true
            for (let x = geometry.min_x; x <= geometry.max_x; x += textures[0].width) {
                for (let y = geometry.min_y; y <= geometry.max_y; y += textures[0].height) {
                    renderAnimatedTile(background, textures, x, y)
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
                            renderTile(background, texture, x, y)
                        }
                    }
                } else {
                    renderTile(background, texture, x1, y1)
                }
            } else {
                isBackgroundAnimated = true
                if (x2 != undefined) {
                    for (let x = x1; x <= x2; x += textures[0].width) {
                        for (let y = y1; y <= y2; y += textures[0].height) {
                            renderAnimatedTile(background, textures, x, y)
                        }
                    }
                } else {
                    renderAnimatedTile(background, textures, x1, y1)
                }
            }
        }
    }
    background.cacheAsBitmap = !isBackgroundAnimated

    // Draw groups
    if (geometry.groups) {
        for (const group of geometry.groups) {
            const groupTile = new PIXI.Container()
            let minX = Number.MAX_SAFE_INTEGER
            let minY = Number.MAX_SAFE_INTEGER
            let isGroupAnimated = false
            for (const [index, x1, y1, x2, y2] of group) {
                if (x1 < minX) minX = x1
                if (y1 < minY) minY = y1
                const textures = getMapTextures(map, index)
                if (textures.length == 1) {
                    const texture = textures[0]
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += texture.width) {
                            for (let y = y1; y <= y2; y += texture.height) {
                                renderTile(groupTile, texture, x, y)
                            }
                        }
                    } else {
                        renderTile(groupTile, texture, x1, y1)
                    }
                } else {
                    isGroupAnimated = true
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += textures[0].width) {
                            for (let y = y1; y <= y2; y += textures[0].height) {
                                renderAnimatedTile(groupTile, textures, x, y)
                            }
                        }
                    } else {
                        renderAnimatedTile(groupTile, textures, x1, y1)
                    }
                }
            }
            groupTile.cacheAsBitmap = !isGroupAnimated
            groupTile.x = minX
            groupTile.y = minY
            for (const child of groupTile.children) {
                child.x -= minX
                child.y -= minY
            }
            foreground.addChild(groupTile)
        }
    }
}