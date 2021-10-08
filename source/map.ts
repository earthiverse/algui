import * as PIXI from 'pixi.js'
import { SpatialHash } from "pixi-cull"
import { Viewport } from 'pixi-viewport'
import { GData, GGeometry, MapName } from 'alclient'
import { getTexture } from './texture'
const G:GData = require("./G.json")

export function renderMap(viewport : Viewport, cull: SpatialHash, map: MapName) {
    const geometry:GGeometry = G.geometry[map as MapName]

    const base = new PIXI.Container()
    base.interactiveChildren = false
    base.zIndex = -1
    viewport.addChild(base)
    // Draw default layer
    if(geometry.default) {
        const texture = getTexture(map, geometry.default)
        const tile = new PIXI.TilingSprite(texture, geometry.max_x - geometry.min_x + texture.width, geometry.max_y - geometry.min_y + texture.height)
        tile.x = geometry.min_x
        tile.y = geometry.min_y
        base.addChild(tile)
    }

    // Draw placements
    if(geometry.placements) {
    for(let [index, x1, y1, x2, y2] of geometry.placements) {
        const texture = getTexture(map, index)

        if(x2 != undefined) {
            for(let x = x1; x <= x2; x+=texture.width) {
                for(let y = y1; y <= y2; y+=texture.height) {
                    // Tiling Sprite
                    const tile = new PIXI.Sprite(texture);
                    tile.x = x
                    tile.y = y
                    tile.width = texture.width
                    tile.height = texture.height
                    base.addChild(tile)
                }
            }
        } else {
            // Single Sprite
            const tile = new PIXI.Sprite(texture);
            tile.x = x1
            tile.y = y1
            tile.width = texture.width
            tile.height = texture.height
            base.addChild(tile)
            }
        }
    }
    cull.addContainer(base, true)

    // Draw groups
    const top = new PIXI.Container()
    top.interactiveChildren = false
    top.zIndex = 1
    viewport.addChild(top)
    if(geometry.groups) {
    for(let group of geometry.groups) {
        for(let [index, x1, y1, x2, y2, yDisp] of group) {
        const texture = getTexture(map, index)
        if(x2 != undefined) {
            for(let x = x1; x <= x2; x+=texture.width) {
                for(let y = y1; y <= y2; y+=texture.height) {
                    // Tiling Sprite
                    const tile = new PIXI.Sprite(texture);
                    tile.x = x
                    tile.y = y
                    tile.width = texture.width
                    tile.height = texture.height
                    top.addChild(tile)
                }
            }
        } else {
            // Single Sprite
            const tile = new PIXI.Sprite(texture);
            tile.x = x1
            tile.y = y1
            tile.width = texture.width
            tile.height = texture.height
            top.addChild(tile)
        }
        }
    }
    }
    cull.addContainer(top, true)
}