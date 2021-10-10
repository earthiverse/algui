import * as PIXI from "pixi.js";
export declare type MonsterData = {
    hp: number;
    id: string;
    going_x: number;
    going_y: number;
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
export declare function renderMonster(container: PIXI.Container, monster: MonsterData): void;
