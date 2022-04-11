import { BankInfo, CXData, MapName, StatusInfo } from "alclient"

export type UICharacterData = {
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

export type UIMonsterData = {
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

export type UIData = {
    mapData: MapData
    monsters: Map<string, UIMonsterData>
    players: Map<string, UICharacterData>
    bank?: BankInfo
}

export type ServerToClientEvents = {
    "bank": (bankInfo: BankInfo) => void
    "character": (characterData: UICharacterData) => void
    "map": (mapData: MapData) => void
    "monster": (MonsterData: UIMonsterData) => void
    "newTab": (tabName: string) => void
    "remove": (entityID: string) => void
    "removeAll": () => void
}

export type ClientToServerEvents = {
    "switchTab": (tabName: string) => void
}