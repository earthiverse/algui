import { MapName } from "alclient"

/** Signal to change the map, and center it at the coordinates provided */
export type MapData = {
    map: MapName
    x: number
    y: number
}