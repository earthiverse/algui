import AL from "alclient";
import { findSkin } from "./al.mjs";
import { downloadSkin } from "./file.mjs";
import { getMonsterSprites } from "./image.mjs";
import { generateSpriteSheet, generateSpriteSheet3 } from "./spritesheet.mjs";

const G = await AL.Game.getGData(true, false);

// for (const monsterName in G.monsters) {
//   console.debug(`${monsterName}...`);
//   const gMonster = G.monsters[monsterName];

//   // Find the image with the skin
//   console.debug(`  Finding skin...`);
//   const skinData = findSkin(G, gMonster.skin);

//   // Download the skin
//   console.debug(`  Downloading skin...`);
//   await downloadSkin(skinData);

//   // Get the sprites
//   console.debug(`  Extracting sprites...`);
//   await getMonsterSprites(skinData, monsterName);

//   // Convert to sprite sheet
//   await generateSpriteSheet(monsterName);
// }

await generateSpriteSheet3(Object.keys(G.monsters).sort());
