import { CXData } from "alclient"

export type MonsterData = {
    aa?: number,
    hp: number,
    id: string,
    going_x: number,
    going_y: number,
    max_hp: number,
    moving: boolean,
    size?: number,
    skin: string,
    speed: number,
    target?: string,
    x: number,
    y: number
}
export type CharacterData = {
    cx?: CXData,
    hp: number,
    id: string,
    going_x: number,
    going_y: number,
    max_hp: number,
    moving: boolean,
    skin: string,
    speed: number,
    target?: string,
    x: number,
    y: number
}