import * as PIXI from "pixi.js";
import { MapName } from "alclient";
export declare const getMapTextures: (map: MapName, index: number) => PIXI.Texture[];
export declare const getMonsterTextures: (skin: string) => PIXI.Texture[][];
