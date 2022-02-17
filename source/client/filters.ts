import * as PIXI from "pixi.js"
import { Container, Filter } from "pixi.js"

// A red filter to apply to entities and characters who are burned
export const BURNED_FILTER = new PIXI.filters.ColorMatrixFilter()
BURNED_FILTER.alpha = 0.5
BURNED_FILTER.matrix[0] = 255
BURNED_FILTER.matrix[6] = 0
BURNED_FILTER.matrix[12] = 0

export function addFilter(object: Container, filter: Filter) {
    if (object.filters && object.filters.includes(filter)) return // Filter is already applied

    if (!object.filters) {
        object.filters = [filter]
    } else {
        object.filters.push(filter)
    }
}

export function removeFilter(object: Container, filter: Filter) {
    if (!object.filters) return // No filters

    const i = object.filters.indexOf(filter)
    if (i !== -1) object.filters.splice(i, 1) // Remove the filter

    if (object.filters.length == 0) object.filters = null // No more filters
}