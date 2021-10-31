import * as PIXI from "pixi.js";
import { getCosmeticFaceTextures, getCosmeticHairTextures, getCosmeticHatTextures, getCosmeticMakeupTextures, getSkinColorTextures, getSkinTextures, getSkinType } from "./texture";
import G from "../G.json";
const monsters = new Map();
const characters = new Map();
function animate() {
    for (const key of [...monsters.keys()]) {
        const datum = monsters.get(key);
        if (datum.monster.hp <= 0) {
            datum.sprite.gotoAndStop(1);
            datum.sprite.interactive = false;
            for (const child of datum.sprite.children) {
                child.visible = false;
            }
            datum.sprite.alpha = datum.sprite.alpha - 0.1;
            if (datum.sprite.alpha <= 0) {
                datum.sprite.destroy();
                monsters.delete(key);
            }
            continue;
        }
        const angle = Math.atan2(datum.monster.going_y - datum.monster.y, datum.monster.going_x - datum.monster.x);
        const distanceTravelled = datum.monster.speed * PIXI.Ticker.shared.elapsedMS / 1000;
        const distanceToGoal = Math.hypot(datum.monster.going_x - datum.monster.x, datum.monster.going_y - datum.monster.y);
        if (distanceTravelled > distanceToGoal) {
            datum.monster.moving = false;
            datum.monster.x = datum.monster.going_x;
            datum.monster.y = datum.monster.going_y;
        }
        else {
            datum.monster.x = datum.monster.x + Math.cos(angle) * distanceTravelled;
            datum.monster.y = datum.monster.y + Math.sin(angle) * distanceTravelled;
        }
        datum.sprite.x = datum.monster.x - datum.sprite.width / 2;
        datum.sprite.y = datum.monster.y - datum.sprite.height;
        let direction = datum.lastDirection;
        if (datum.monster.moving)
            direction = radsToDirection(angle);
        if (datum.lastDirection !== direction) {
            datum.sprite.textures = datum.textures[direction];
            datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)));
            datum.lastDirection = direction;
        }
        if (!datum.monster.moving && !datum.monster.aa) {
            datum.sprite.gotoAndStop(1);
        }
        else if (datum.monster.moving && !datum.sprite.playing) {
            datum.sprite.play();
        }
        const hpBar = datum.sprite.children[0];
        if (hpBar.visible) {
            hpBar.clear();
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.monster.hp / datum.monster.max_hp, 2);
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y);
        }
    }
    for (const key of [...characters.keys()]) {
        const datum = characters.get(key);
        const angle = Math.atan2(datum.character.going_y - datum.character.y, datum.character.going_x - datum.character.x);
        const distanceTravelled = datum.character.speed * PIXI.Ticker.shared.elapsedMS / 1000;
        const distanceToGoal = Math.hypot(datum.character.going_x - datum.character.x, datum.character.going_y - datum.character.y);
        if (distanceTravelled > distanceToGoal) {
            datum.character.moving = false;
            datum.character.x = datum.character.going_x;
            datum.character.y = datum.character.going_y;
        }
        else {
            datum.character.x = datum.character.x + Math.cos(angle) * distanceTravelled;
            datum.character.y = datum.character.y + Math.sin(angle) * distanceTravelled;
        }
        datum.sprite.x = datum.character.x - datum.sprite.width / 2;
        datum.sprite.y = datum.character.y - datum.sprite.height;
        let direction = datum.lastDirection;
        if (datum.character.moving)
            direction = radsToDirection(angle);
        if (datum.lastDirection !== direction) {
            const randomFrame = Math.floor(Math.random() * (datum.sprite.totalFrames + 1));
            datum.sprite.textures = datum.textures[direction];
            datum.sprite.gotoAndPlay(randomFrame);
            for (let i = 1; i < datum.sprite.children.length; i++) {
                const child = datum.sprite.children[i];
                child.textures = datum.texturesChildren[i][direction];
                child.gotoAndPlay(Math.min(child.totalFrames, randomFrame));
            }
            datum.lastDirection = direction;
        }
        if (!datum.character.moving) {
            datum.sprite.gotoAndStop(1);
            for (let i = 1; i < datum.sprite.children.length; i++) {
                const child = datum.sprite.children[i];
                child.gotoAndStop(Math.min(child.totalFrames, 1));
            }
        }
        else if (datum.character.moving && !datum.sprite.playing) {
            datum.sprite.play();
        }
        const hpBar = datum.sprite.children[0];
        if (hpBar.visible) {
            hpBar.clear();
            hpBar.beginFill(0x000000).lineStyle(0).drawRect(0, -4, datum.sprite.width, 4)
                .beginFill(0xFF0000).lineStyle(0).drawRect(1, -3, (datum.sprite.width - 2) * datum.character.hp / datum.character.max_hp, 2);
            hpBar.scale.set(1 / datum.sprite.scale.x, 1 / datum.sprite.scale.y);
        }
    }
}
PIXI.Ticker.shared.add(animate);
function radsToDirection(angle) {
    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
        return 1;
    }
    else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
        return 0;
    }
    else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
        return 3;
    }
    else {
        return 2;
    }
}
export function removeCharacter(id) {
    const character = characters.get(id);
    if (character) {
        character.sprite.destroy();
        characters.delete(id);
    }
}
export function removeMonster(id) {
    const monster = monsters.get(id);
    if (monster) {
        monster.sprite.destroy();
        monsters.delete(id);
    }
}
export function removeAllSprites() {
    characters.clear();
    monsters.clear();
}
export function renderCharacter(container, character, initialDirection = 0) {
    if (characters.has(character.id)) {
        const oldCharacter = characters.get(character.id);
        for (const datum in character)
            oldCharacter[datum] = character[datum];
        return;
    }
    const type = getSkinType(character.skin);
    if (!character.cx)
        character.cx = {};
    let textures;
    if (type == "full") {
        textures = getSkinTextures(character.skin);
    }
    else {
        if (!character.cx.head)
            character.cx.head = "makeup117";
        textures = getSkinColorTextures(character.cx.head);
    }
    const sprite = new PIXI.AnimatedSprite(textures[initialDirection]);
    sprite.interactive = true;
    sprite.interactiveChildren = false;
    const datum = {
        character: character,
        lastDirection: initialDirection,
        sprite: sprite,
        textures: textures,
        texturesChildren: {}
    };
    const hpBar = new PIXI.Graphics();
    hpBar.visible = false;
    sprite.addChild(hpBar);
    sprite.on("mouseover", () => { sprite.children[0].visible = true; });
    sprite.on("mouseout", () => { sprite.children[0].visible = false; });
    if (type !== "full") {
        const baseTextures = getSkinTextures(character.skin);
        const baseSkin = new PIXI.AnimatedSprite(baseTextures[initialDirection]);
        if (sprite.width !== baseSkin.width)
            baseSkin.x += (sprite.width - baseSkin.width);
        sprite.addChild(baseSkin);
        datum.texturesChildren[sprite.children.length - 1] = baseTextures;
        if (character.cx.head) {
            const headTextures = getCosmeticMakeupTextures(character.cx.head);
            const head = new PIXI.AnimatedSprite(headTextures[initialDirection]);
            if (sprite.width !== head.width)
                head.x += (sprite.width - head.width);
            head.y -= 1;
            sprite.addChild(head);
            datum.texturesChildren[sprite.children.length - 1];
        }
        if (character.cx.makeup) {
            const makeupTextures = getCosmeticMakeupTextures(character.cx.makeup);
            const makeup = new PIXI.AnimatedSprite(makeupTextures[initialDirection]);
            if (sprite.width !== makeup.width)
                makeup.x += (sprite.width - makeup.width);
            makeup.y -= 1 + G.cosmetics.default_makeup_position;
            sprite.addChild(makeup);
            datum.texturesChildren[sprite.children.length - 1];
        }
        if (character.cx.face) {
            const faceTextures = getCosmeticFaceTextures(character.cx.face);
            const face = new PIXI.AnimatedSprite(faceTextures[initialDirection]);
            if (sprite.width !== face.width)
                face.x += (sprite.width - face.width);
            face.y -= 1 + G.cosmetics.default_face_position;
            sprite.addChild(face);
            datum.texturesChildren[sprite.children.length - 1];
        }
        if (character.cx.hair) {
            const hairTextures = getCosmeticHairTextures(character.cx.hair);
            const hair = new PIXI.AnimatedSprite(hairTextures[initialDirection]);
            if (sprite.width !== hair.width)
                hair.x += (sprite.width - hair.width);
            hair.y -= 1;
            sprite.addChild(hair);
            datum.texturesChildren[sprite.children.length - 1];
        }
        if (character.cx.hat) {
            const hatTextures = getCosmeticHatTextures(character.cx.hat);
            const hat = new PIXI.AnimatedSprite(hatTextures[initialDirection]);
            if (sprite.width !== hat.width)
                hat.x += (sprite.width - hat.width);
            hat.y -= 1;
            sprite.addChild(hat);
            datum.texturesChildren[sprite.children.length - 1];
        }
    }
    datum.sprite.x = character.x - datum.sprite.width / 2;
    datum.sprite.y = character.y - datum.sprite.height;
    const randomFrame = Math.floor(Math.random() * (datum.sprite.totalFrames + 1));
    datum.sprite.gotoAndPlay(randomFrame);
    for (let i = 1; i < datum.sprite.children.length; i++) {
        const child = datum.sprite.children[i];
        child.gotoAndPlay(Math.min(child.totalFrames, randomFrame));
    }
    datum.sprite.animationSpeed = 1 / 10;
    characters.set(character.id, datum);
    container.addChild(sprite);
    return sprite;
}
export function renderMonster(container, monster, initialDirection = 0) {
    if (monsters.has(monster.id)) {
        const oldMonster = monsters.get(monster.id);
        for (const datum in monster)
            oldMonster[datum] = monster[datum];
        return;
    }
    const textures = getSkinTextures(monster.skin);
    const sprite = new PIXI.AnimatedSprite(textures[initialDirection]);
    sprite.interactive = true;
    sprite.interactiveChildren = false;
    const datum = {
        lastDirection: initialDirection,
        monster: monster,
        sprite: sprite,
        textures: textures
    };
    const hpBar = new PIXI.Graphics();
    hpBar.visible = false;
    sprite.addChild(hpBar);
    sprite.on("mouseover", () => { sprite.children[0].visible = true; });
    sprite.on("mouseout", () => { sprite.children[0].visible = false; });
    if (monster.size && monster.size !== 1)
        datum.sprite.scale.set(monster.size);
    datum.sprite.x = monster.x - datum.sprite.width / 2;
    datum.sprite.y = monster.y - datum.sprite.height;
    datum.sprite.gotoAndPlay(Math.floor(Math.random() * (datum.sprite.totalFrames + 1)));
    datum.sprite.animationSpeed = 1 / 10;
    monsters.set(monster.id, datum);
    container.addChild(sprite);
    return sprite;
}
//# sourceMappingURL=sprite.js.map