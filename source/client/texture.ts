import * as PIXI from "pixi.js"
import { GData, GGeometry, MapName, MonsterName } from "alclient"
import G from "./G.json"

// Base textures hold the image
const baseTexturesCache = new Map<string, PIXI.BaseTexture>()
const getBaseTexture = (id: string, file: string): PIXI.BaseTexture => {
    let baseTexture = baseTexturesCache.get(id)
    if (baseTexture) return baseTexture

    baseTexture = PIXI.BaseTexture.from(file)
    baseTexturesCache.set(id, baseTexture)
    return baseTexture
}

// Textures hold a region of the base texture
const mapTexturesCache = new Map<MapName, Map<number, PIXI.Texture[]>>()
export const getMapTextures = (map: MapName, index: number): PIXI.Texture[] => {
    let mapTextures = mapTexturesCache.get(map)
    if (!mapTextures) {
        mapTextures = new Map<number, PIXI.Texture[]>()
        mapTexturesCache.set(map, mapTextures)
    }
    let textures = mapTextures.get(index)
    if (textures) return textures

    // Make the texture
    const [tilesetName, x3, y3, width, height] = ((G as unknown as GData).geometry[map as MapName] as GGeometry).tiles[index]
    const gTileset = (G as unknown as GData).tilesets[tilesetName]
    const baseTexture = getBaseTexture(tilesetName, `.${gTileset.file}`)
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

const monsterTexturesCache = new Map<string, PIXI.Texture[][]>()
export const getMonsterTextures = (skin: string): PIXI.Texture[][] => {
    let textures = monsterTexturesCache.get(skin)
    if (textures) return textures

    // Make the textures
    const gSprites = (G as unknown as GData).sprites
    let found = false
    for (const spriteName in gSprites) {
        if (found) break
        const sprites = gSprites[spriteName]
        for (let row = 0; row < sprites.rows; row++) {
            if (found) break
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    // We found it!
                    const file = sprites.file.split(/[?#]/)[0]
                    const baseTexture = getBaseTexture(spriteName, `.${file}`)
                    const dimensions = (G as unknown as GData).dimensions[skin as MonsterName] ?? []
                    try {
                        const width = (G as unknown as GData).images[file].width / sprites.columns / 3
                        const height = (G as unknown as GData).images[file].height / sprites.rows / 4

                        textures = [[], [], [], []]
                        const directions = [0, 2, 3, 1] // Rearrange to North-East-South-West order
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i]
                            for (let animationFrame = 0; animationFrame < 3; animationFrame++) { // There's three frames of animation for each direction
                                let x = (col * 3 * width) + (animationFrame * width)
                                if (dimensions[2]) x += Math.min(0, dimensions[2]) // NOTE: If the images were fixed in an image editor, we wouldn't have to apply this offset.
                                const y = (row * 4 * height) + (direction * height)
                                const frame = new PIXI.Rectangle(x, y, width, height)
                                const texture = new PIXI.Texture(baseTexture, frame)
                                textures[i].push(texture)
                            }
                            textures[i].push(textures[i][1])
                        }
                        found = true
                    } catch (e) {
                        console.error(e)
                    }
                    break
                }
            }
        }
    }
    monsterTexturesCache.set(skin, textures)
    return textures
}