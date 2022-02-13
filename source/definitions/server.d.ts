import { MapName } from "alclient"
import { CharacterData, MonsterData } from "./client"

/** Signal to change the map, and center it at the coordinates provided */
export type MapData = {
    map: MapName
    x: number
    y: number
}

export type TabData = {
    mapData: MapData
    monsters: Map<string, MonsterData>
    players: Map<string, CharacterData>
}