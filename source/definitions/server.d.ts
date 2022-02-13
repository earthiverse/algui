import { CXData, MapName, StatusInfo } from "alclient"

export type CharacterData = {
    cx?: CXData
    hp: number
    id: string
    going_x: number
    going_y: number
    max_hp: number
    moving: boolean
    s: StatusInfo
    skin: string
    speed: number
    target?: string
    x: number
    y: number
}

export type MonsterData = {
    aa?: number
    hp: number
    id: string
    going_x: number
    going_y: number
    max_hp: number
    moving: boolean
    s: StatusInfo
    size?: number
    skin: string
    speed: number
    target?: string
    x: number
    y: number
}

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