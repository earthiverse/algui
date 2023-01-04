import fs from "fs";
import sharp from "sharp";
import url from "url";
import { ensureFolderExists } from "./file.mjs";

export const getMonsterSprites = async (data, monsterName) => {
  const originalFilename = `./original${url.parse(data.file).pathname}`;
  const monsterFolder = `./fixed/${monsterName}`;
  const monsterFilename = `${monsterFolder}/base.png`;
  ensureFolderExists(monsterFilename);

  const image = sharp(originalFilename);
  const metadata = await image.metadata();
  // const spriteWidth = metadata.width / data.columns;
  const spriteWidth = Math.trunc(metadata.width / data.columns);
  // const spriteHeight = metadata.height / data.rows;
  const spriteHeight = Math.trunc(metadata.height / data.rows);
  const left = data.column * spriteWidth;
  const top = data.row * spriteHeight;

  // Save the image
  if (!fs.existsSync(monsterFilename)) {
    await image
      .extract({
        left: left,
        top: top,
        width: spriteWidth,
        height: spriteHeight,
      })
      .toFile(monsterFilename);
  }

  const monsterWidth = Math.ceil(spriteWidth / 3);
  const monsterHeight = Math.ceil(spriteHeight / 4);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 4; row++) {
      const index = row * 3 + col + 1;
      const left = col * monsterWidth;
      const top = row * monsterHeight;
      console.debug(
        `    Cropping ${left},${top} for ${monsterWidth}x${monsterHeight} from ${monsterFilename}`
      );

      // NOTE: This has to be done in two steps because of some bug with sharp.
      const extracted = await sharp(monsterFilename)
        .extract({
          left: left,
          top: top,
          width: Math.min(spriteWidth - left, monsterWidth),
          height: Math.min(spriteHeight - top, monsterHeight),
        })
        .toBuffer();

      await sharp(extracted)
        .trim({
          background: "rgba(0, 0, 0, 0)",
        })
        .toFile(`${monsterFolder}/${index}.png`);
    }
  }
};
