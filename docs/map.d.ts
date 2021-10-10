import * as PIXI from "pixi.js";
import { SpatialHash } from "pixi-cull";
import { MapName } from "alclient";
export declare function renderMap(container: PIXI.Container, cull: SpatialHash, map: MapName): void;
