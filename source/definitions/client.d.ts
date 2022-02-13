import { Viewport } from "pixi-viewport"
import { Container } from "pixi.js"

export type Layers = {
    background: Container
    foreground: Container
    hpBars: Container
    viewport: Viewport
}