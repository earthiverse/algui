import * as PIXI from "pixi.js"
import { GData, GGeometry, MapName, TilesetName } from "alclient"
import G from "./G.json"

// Base textures hold the image
const baseTexturesCache = new Map<TilesetName, PIXI.BaseTexture>()
const getBaseTexture = (tileset: TilesetName): PIXI.BaseTexture => {
    let baseTexture = baseTexturesCache.get(tileset)
    if (baseTexture) return baseTexture

    baseTexture = PIXI.BaseTexture.from(`.${(G as unknown as GData).tilesets[tileset].file}`)
    baseTexturesCache.set(tileset, baseTexture)
    return baseTexture
}

// Textures hold a region of the base texture
const texturesCache = new Map<MapName, Map<number, PIXI.Texture[]>>()
export const getTextures = (map: MapName, index: number): PIXI.Texture[] => {
    let mapTextures = texturesCache.get(map)
    if (!mapTextures) {
        mapTextures = new Map<number, PIXI.Texture[]>()
        texturesCache.set(map, mapTextures)
    }
    let textures = mapTextures.get(index)
    if (textures) return textures

    // Make the texture
    const [tileset, x3, y3, width, height] = ((G as unknown as GData).geometry[map as MapName] as GGeometry).tiles[index]
    const gTileset = (G as unknown as GData).tilesets[tileset]
    const baseTexture = getBaseTexture(tileset)
    if (gTileset.frames) {
        textures = []
        for (let i = 0; i < gTileset.frames; i++) {
            const frame = new PIXI.Rectangle(x3 + (i * gTileset.frame_width), y3, width, height != undefined ? height : width)
            textures.push(new PIXI.Texture(baseTexture, frame))
        }
        for (let i = gTileset.frames - 2; i > 0; i--) {
            textures.push(textures[i])
        }
        mapTextures.set(index, textures)
        return textures
    } else {
        const frame = new PIXI.Rectangle(x3, y3, width, height != undefined ? height : width)
        const texture = new PIXI.Texture(baseTexture, frame)
        mapTextures.set(index, [texture])
        return [texture]
    }
}