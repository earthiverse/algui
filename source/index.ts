import * as PIXI from 'pixi.js'
import { SpatialHash } from "pixi-cull"
import { Viewport } from 'pixi-viewport'
import "./index.css"
import { GData, GGeometry, MapName, TilesetName } from "alclient"

const G:GData = require("./G.json")

PIXI.settings.ROUND_PIXELS = true;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
const app = new PIXI.Application()
document.body.appendChild(app.view)

// Create the viewport and add it
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  interaction: app.renderer.plugins.interaction
})
viewport.pinch().drag().decelerate()
app.stage.addChild(viewport)

const cull = new SpatialHash({
  dirtyTest: true,
  simpleTest: true
})

const baseTextures = new Map<TilesetName, PIXI.BaseTexture>()
const getBaseTexture = (tileset: TilesetName): PIXI.BaseTexture => {
  let baseTexture = baseTextures.get(tileset)
  if(baseTexture) return baseTexture
  
  baseTexture = PIXI.BaseTexture.from(G.tilesets[tileset].file)
  baseTextures.set(tileset, baseTexture)
  return baseTexture
}
const textures = new Map<MapName, Map<number, PIXI.Texture>>()
const getTexture = (map: MapName, index: number): PIXI.Texture => {
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
const map : MapName = "winterland"
const geometry: GGeometry = G.geometry[map as MapName]

const base = new PIXI.Container()
base.interactiveChildren = false
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

// // Draw groups
const top = new PIXI.Container()
top.interactiveChildren = false
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
        // const tile = new PIXI.TilingSprite(texture, x2 - x1 + texture.width, y2 - y1 + texture.height)
        // tile.x = x1
        // tile.y = y1
        // viewport.addChild(tile)
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

viewport.moveCenter(0, 0)
viewport.animate({
  scale: 2
})

// Culling

cull.addContainer(base)
cull.addContainer(top)
cull.cull(viewport.getVisibleBounds())
PIXI.Ticker.shared.add(() => {
  if (viewport.dirty) {
    cull.cull(viewport.getVisibleBounds())
    viewport.dirty = false
  }
})

// Fill the screen, and keep it full on resize
window.addEventListener('resize', resize);
function resize() { 
  app.renderer.resize(window.innerWidth, window.innerHeight)
  viewport.resize(window.innerWidth, window.innerHeight)
}
resize()