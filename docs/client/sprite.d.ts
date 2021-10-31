import * as PIXI from "pixi.js";
import { CharacterData, MonsterData } from "../definitions/client";
export declare type MonsterSpriteData = {
    data: MonsterData;
    lastDirection: number;
    sprite: PIXI.AnimatedSprite;
    textures: PIXI.Texture[][];
};
export declare type CharacterSpriteData = {
    data: CharacterData;
    lastDirection: number;
    sprite: PIXI.AnimatedSprite;
    textures: PIXI.Texture[][];
    texturesChildren: {
        [T in number]: PIXI.Texture[][];
    };
};
export declare function removeSprite(id: string): void;
export declare function removeAllSprites(): void;
export declare function renderCharacter(container: PIXI.Container, character: CharacterData, initialDirection?: number): PIXI.AnimatedSprite;
export declare function renderMonster(container: PIXI.Container, monster: MonsterData, initialDirection?: number): PIXI.AnimatedSprite;
