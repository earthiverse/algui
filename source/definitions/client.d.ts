
import { CXData, StatusInfo } from "alclient"
import { Viewport } from "pixi-viewport"
import { Container } from "pixi.js"

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

export type Layers = {
    background: Container
    foreground: Container
    hpBars: Container
    viewport: Viewport
}