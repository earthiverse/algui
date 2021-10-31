import * as PIXI from "pixi.js";
import G from "../G.json";
const baseTexturesCache = new Map();
const getBaseTexture = (id, file) => {
    let baseTexture = baseTexturesCache.get(id);
    if (baseTexture)
        return baseTexture;
    baseTexture = PIXI.BaseTexture.from(file);
    baseTexturesCache.set(id, baseTexture);
    return baseTexture;
};
const cosmeticFaceTexturesCache = new Map();
export const getCosmeticFaceTextures = (skin) => {
    let textures = cosmeticFaceTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    try {
                        const width = G.images[file].width / sprites.columns;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            const animationFrame = 0;
                            const x = (col * width) + (animationFrame * width);
                            const y = (row * 4 * height) + (direction * height);
                            const frame = new PIXI.Rectangle(x, y, width, height);
                            const texture = new PIXI.Texture(baseTexture, frame);
                            textures[i].push(texture);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    cosmeticFaceTexturesCache.set(skin, textures);
    return textures;
};
const cosmeticHairTexturesCache = new Map();
export const getCosmeticHairTextures = (skin) => {
    let textures = cosmeticHairTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    try {
                        const width = G.images[file].width / sprites.columns;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            const animationFrame = 0;
                            const x = (col * width) + (animationFrame * width);
                            const y = (row * 4 * height) + (direction * height);
                            const frame = new PIXI.Rectangle(x, y, width, height);
                            const texture = new PIXI.Texture(baseTexture, frame);
                            textures[i].push(texture);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    cosmeticHairTexturesCache.set(skin, textures);
    return textures;
};
const cosmeticHatTexturesCache = new Map();
export const getCosmeticHatTextures = (skin) => {
    let textures = cosmeticHatTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    try {
                        const width = G.images[file].width / sprites.columns;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            const animationFrame = 0;
                            const x = (col * width) + (animationFrame * width);
                            const y = (row * 4 * height) + (direction * height);
                            const frame = new PIXI.Rectangle(x, y, width, height);
                            const texture = new PIXI.Texture(baseTexture, frame);
                            textures[i].push(texture);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    cosmeticHatTexturesCache.set(skin, textures);
    return textures;
};
const cosmeticHeadTexturesCache = new Map();
export const getCosmeticHeadTextures = (skin) => {
    let textures = cosmeticHeadTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    try {
                        const width = G.images[file].width / sprites.columns;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            const animationFrame = 0;
                            const x = (col * width) + (animationFrame * width);
                            const y = (row * 4 * height) + (direction * height);
                            const frame = new PIXI.Rectangle(x, y, width, height);
                            const texture = new PIXI.Texture(baseTexture, frame);
                            textures[i].push(texture);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    cosmeticHeadTexturesCache.set(skin, textures);
    return textures;
};
const cosmeticMakeupTexturesCache = new Map();
export const getCosmeticMakeupTextures = (skin) => {
    let textures = cosmeticMakeupTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    try {
                        const width = G.images[file].width / sprites.columns;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            const animationFrame = 0;
                            const x = (col * width) + (animationFrame * width);
                            const y = (row * 4 * height) + (direction * height);
                            const frame = new PIXI.Rectangle(x, y, width, height);
                            const texture = new PIXI.Texture(baseTexture, frame);
                            textures[i].push(texture);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    cosmeticMakeupTexturesCache.set(skin, textures);
    return textures;
};
const mapTexturesCache = new Map();
export const getMapTextures = (map, index) => {
    let mapTextures = mapTexturesCache.get(map);
    if (!mapTextures) {
        mapTextures = new Map();
        mapTexturesCache.set(map, mapTextures);
    }
    let textures = mapTextures.get(index);
    if (textures)
        return textures;
    const [tilesetName, x3, y3, width, height] = G.geometry[map].tiles[index];
    const gTileset = G.tilesets[tilesetName];
    const baseTexture = getBaseTexture(tilesetName, `.${gTileset.file}`);
    if (gTileset.frames) {
        textures = [];
        for (let i = 0; i < gTileset.frames; i++) {
            const frame = new PIXI.Rectangle(x3 + (i * gTileset.frame_width), y3, width, height != undefined ? height : width);
            textures.push(new PIXI.Texture(baseTexture, frame));
        }
        for (let i = gTileset.frames - 2; i > 0; i--) {
            textures.push(textures[i]);
        }
        mapTextures.set(index, textures);
        return textures;
    }
    else {
        const frame = new PIXI.Rectangle(x3, y3, width, height != undefined ? height : width);
        const texture = new PIXI.Texture(baseTexture, frame);
        mapTextures.set(index, [texture]);
        return [texture];
    }
};
const skinColorTexturesCache = new Map();
export const getSkinColorTextures = (headSkin) => {
    let textures = skinColorTexturesCache.get(headSkin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == headSkin) {
                    const size = sprites.size ?? "normal";
                    const options = G.cosmetics.head[headSkin] ?? ["sskin1a", "mskin1a", "lskin1a"];
                    if (size == "small")
                        textures = getSkinTextures(options[0]);
                    else if (size == "normal")
                        textures = getSkinTextures(options[1]);
                    else if (size == "large")
                        textures = getSkinTextures(options[2]);
                    found = true;
                    break;
                }
            }
        }
    }
    skinColorTexturesCache.set(headSkin, textures);
    return textures;
};
const skinTexturesCache = new Map();
export const getSkinTextures = (skin) => {
    let textures = skinTexturesCache.get(skin);
    if (textures)
        return textures;
    const gSprites = G.sprites;
    let found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    const file = sprites.file.split(/[?#]/)[0];
                    const baseTexture = getBaseTexture(spriteName, `.${file}`);
                    const dimensions = G.dimensions[skin] ?? [];
                    try {
                        const width = G.images[file].width / sprites.columns / 3;
                        const height = G.images[file].height / sprites.rows / 4;
                        textures = [[], [], [], []];
                        const directions = [0, 2, 3, 1];
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i];
                            for (let animationFrame = 0; animationFrame < 3; animationFrame++) {
                                const x = (col * 3 * width) + (animationFrame * width);
                                let dx = 0;
                                let dw = 0;
                                if (dimensions[2]) {
                                    dx += dimensions[2];
                                }
                                if (dimensions[0]) {
                                    const difference = (width - dimensions[0]);
                                    dx += difference / 2;
                                    dw -= difference;
                                }
                                const y = (row * 4 * height) + (direction * height);
                                let dy = 0;
                                let dh = 0;
                                if (dimensions[1]) {
                                    const difference = (height - dimensions[1]);
                                    dy += difference;
                                    dh -= difference;
                                }
                                const frame = new PIXI.Rectangle(x + dx, y + dy, width + dw, height + dh);
                                const texture = new PIXI.Texture(baseTexture, frame);
                                textures[i].push(texture);
                            }
                            textures[i].push(textures[i][1]);
                        }
                        found = true;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    break;
                }
            }
        }
    }
    skinTexturesCache.set(skin, textures);
    return textures;
};
export function getSkinType(skin) {
    const gSprites = G.sprites;
    const found = false;
    for (const spriteName in gSprites) {
        if (found)
            break;
        const sprites = gSprites[spriteName];
        for (let row = 0; row < sprites.rows; row++) {
            if (found)
                break;
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    return sprites.type ?? "full";
                }
            }
        }
    }
}
//# sourceMappingURL=texture.js.map