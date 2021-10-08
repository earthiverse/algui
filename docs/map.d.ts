import { SpatialHash } from "pixi-cull";
import { Viewport } from 'pixi-viewport';
import { MapName } from 'alclient';
export declare function renderMap(viewport: Viewport, cull: SpatialHash, map: MapName): void;
