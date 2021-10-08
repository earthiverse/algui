import * as PIXI from 'pixi.js'
import { GData, GGeometry, MapName, TilesetName } from "alclient"
const G:GData = require("./G.json")

// Base textures hold the image
const baseTextures = new Map<TilesetName, PIXI.BaseTexture>()
const getBaseTexture = (tileset: TilesetName): PIXI.BaseTexture => {
  let baseTexture = baseTextures.get(tileset)
  if(baseTexture) return baseTexture
  
  baseTexture = PIXI.BaseTexture.from(G.tilesets[tileset].file)
  baseTextures.set(tileset, baseTexture)
  return baseTexture
}

// Textures hold a region of the base texture
const textures = new Map<MapName, Map<number, PIXI.Texture>>()
export const getTexture = (map: MapName, index: number): PIXI.Texture => {
  let mapTextures = textures.get(map)
  if(!mapTextures) {
    mapTextures = new Map<number, PIXI.Texture>()
    textures.set(map, mapTextures)
  }
  let texture = mapTextures.get(index)
  if(texture) return texture

  // Make the texture
  let [tileset, x3, y3, width, height] = (G.geometry[map as MapName] as GGeometry).tiles[index]
  if(height == undefined) height = width
  let baseTexture = getBaseTexture(tileset)
  const frame = new PIXI.Rectangle(x3, y3, width, height)
  texture = new PIXI.Texture(baseTexture, frame)
  mapTextures.set(index, texture)
  return texture
}