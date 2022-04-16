import * as PIXI from "pixi.js"
import { GData, GGeometry, MapName } from "alclient"
import { getMapTextures } from "./texture"
import G from "../G.json"
import { Layers } from "../definitions/client"

function createTile(texture: PIXI.Texture, x: number, y: number) {
    const tile = new PIXI.Sprite(texture)
    tile.x = x
    tile.y = y
    tile.width = texture.width
    tile.height = texture.height
    return tile
}

function createAnimatedTile(textures: PIXI.Texture[], x: number, y: number) {
    const tile = new PIXI.AnimatedSprite(textures)
    tile.x = x
    tile.y = y
    tile.width = textures[0].width
    tile.height = textures[0].height
    tile.animationSpeed = 1 / 30
    tile.play()
    return tile
}

export function renderMap(renderer: PIXI.Renderer | PIXI.AbstractRenderer, layers: Layers, map: MapName): void {
    const geometry: GGeometry = (G as unknown as GData).geometry[map as MapName]

    const defaultTextures = getMapTextures(map, geometry.default)
    const backgroundTextures: PIXI.RenderTexture[] = []
    const width = geometry.max_x - geometry.min_x
    const height = geometry.max_y - geometry.min_y
    backgroundTextures.push(PIXI.RenderTexture.create({ height: height, width: width }))
    backgroundTextures.push(PIXI.RenderTexture.create({ height: height, width: width }))
    backgroundTextures.push(PIXI.RenderTexture.create({ height: height, width: width }))

    const fixX = -geometry.min_x
    const fixY = -geometry.min_y

    // Draw default layer
    if (geometry.default) {
        if (defaultTextures.length == 1) {
            const texture = defaultTextures[0]
            const tile = createTile(texture, 0, 0)
            for (let i = 0; i < backgroundTextures.length; i++) {
                for (let x = 0; x <= width; x += texture.width) {
                    for (let y = 0; y <= height; y += texture.height) {
                        tile.x = x
                        tile.y = y
                        renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                    }
                }
            }
        } else {
            for (let i = 0; i < backgroundTextures.length; i++) {
                const texture = defaultTextures[i]
                const tile = createTile(texture, 0, 0)
                for (let x = 0; x <= width; x += texture.width) {
                    for (let y = 0; y <= height; y += texture.height) {
                        tile.x = x
                        tile.y = y
                        renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                    }
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
                    const tile = createTile(texture, 0, 0)
                    for (let i = 0; i < backgroundTextures.length; i++) {
                        for (let x = x1 + fixX; x <= x2 + fixX; x += texture.width) {
                            for (let y = y1 + fixY; y <= y2 + fixY; y += texture.height) {
                                tile.x = x
                                tile.y = y
                                renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                                // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                            }
                        }
                    }
                } else {
                    const tile = createTile(texture, x1 + fixX, y1 + fixY)
                    for (let i = 0; i < backgroundTextures.length; i++) {
                        renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                    }
                }
            } else {
                if (x2 != undefined) {
                    for (let i = 0; i < backgroundTextures.length; i++) {
                        const tile = createTile(textures[i], 0, 0)
                        for (let x = x1 + fixX; x <= x2 + fixX; x += textures[i].width) {
                            for (let y = y1 + fixY; y <= y2 + fixY; y += textures[i].height) {
                                tile.x = x
                                tile.y = y
                                renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                                // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < backgroundTextures.length; i++) {
                        const tile = createTile(textures[i], x1 + fixX, y1 + fixY)
                        renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        // renderer.render(tile, { renderTexture: backgroundTextures[i] })
                    }
                }
            }
        }
    }
    layers.background.addChild(createAnimatedTile(backgroundTextures, geometry.min_x, geometry.min_y))

    // Draw groups
    if (geometry.groups) {
        for (const group of geometry.groups) {
            const groupTile: PIXI.Container = new PIXI.Container()
            let minX = Number.MAX_SAFE_INTEGER
            let minY = Number.MAX_SAFE_INTEGER
            let maxY = Number.MIN_SAFE_INTEGER
            let isGroupAnimated = false
            for (const [index, x1, y1, x2, y2] of group) {
                if (x1 < minX) minX = x1
                if (y1 < minY) minY = y1
                if (y2 > maxY) maxY = y2
                const textures = getMapTextures(map, index)
                if (textures.length == 1) {
                    const texture = textures[0]
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += texture.width) {
                            for (let y = y1; y <= y2; y += texture.height) {
                                groupTile.addChild(createTile(texture, x, y))
                            }
                        }
                    } else {
                        groupTile.addChild(createTile(texture, x1, y1))
                    }
                } else {
                    isGroupAnimated = true
                    if (x2 != undefined) {
                        for (let x = x1; x <= x2; x += textures[0].width) {
                            for (let y = y1; y <= y2; y += textures[0].height) {
                                groupTile.addChild(createAnimatedTile(textures, x, y))
                            }
                        }
                    } else {
                        groupTile.addChild(createAnimatedTile(textures, x1, y1))
                    }
                }
            }
            groupTile.cacheAsBitmap = !isGroupAnimated
            groupTile.x = minX
            groupTile.y = minY
            groupTile.zIndex = groupTile.y - (maxY - minY)
            for (const child of groupTile.children) {
                child.x -= minX
                child.y -= minY
            }
            layers.foreground.addChild(groupTile)
        }
    }
}