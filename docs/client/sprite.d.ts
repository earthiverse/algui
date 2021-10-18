import * as PIXI from "pixi.js";
import { CXData } from "alclient";
export declare type MonsterData = {
    aa?: number;
    hp: number;
    id: string;
    going_x: number;
    going_y: number;
    max_hp: number;
    moving: boolean;
    size?: number;
    skin: string;
    speed: number;
    x: number;
    y: number;
};
export declare type CharacterData = {
    cx?: CXData;
    hp: number;
    id: string;
    going_x: number;
    going_y: number;
    max_hp: number;
    moving: boolean;
    skin: string;
    speed: number;
    x: number;
    y: number;
};
export declare type MonsterSpriteData = {
    monster: MonsterData;
    lastDirection: number;
    sprite: PIXI.AnimatedSprite;
    textures: PIXI.Texture[][];
};
export declare type CharacterSpriteData = {
    character: CharacterData;
    lastDirection: number;
    sprite: PIXI.AnimatedSprite;
    textures: PIXI.Texture[][];
    texturesChildren: {
        [T in number]: PIXI.Texture[][];
    };
};
export declare function renderCharacter(container: PIXI.Container, character: CharacterData, initialDirection?: number): PIXI.AnimatedSprite;
export declare function renderMonster(container: PIXI.Container, monster: MonsterData, initialDirection?: number): PIXI.AnimatedSprite;
