import crypto from "crypto";
import fs from "fs";
import sharp from "sharp";
import Spritesmith from "spritesmith";

export const generateSpriteSheet = async (monsterName) => {
  const dir = `./fixed/${monsterName}`;

  Spritesmith.run(
    {
      src: [
        `${dir}/1.png`,
        `${dir}/2.png`,
        `${dir}/3.png`,
        `${dir}/4.png`,
        `${dir}/5.png`,
        `${dir}/6.png`,
        `${dir}/7.png`,
        `${dir}/8.png`,
        `${dir}/9.png`,
        `${dir}/10.png`,
        `${dir}/11.png`,
        `${dir}/12.png`,
      ],
    },
    (error, result) => {
      if (error) throw error;
      fs.writeFileSync(`${dir}/base_fixed.png`, result.image);
      console.log(result.coordinates);
      console.log(result.properties);
    }
  );
};

export const generateSpriteSheet2 = async (monsterNames) => {
  const images = [];

  for (const monsterName of monsterNames) {
    const dir = `./fixed/${monsterName}`;
    images.push(
      `${dir}/1.png`,
      `${dir}/2.png`,
      `${dir}/3.png`,
      `${dir}/4.png`,
      `${dir}/5.png`,
      `${dir}/6.png`,
      `${dir}/7.png`,
      `${dir}/8.png`,
      `${dir}/9.png`,
      `${dir}/10.png`,
      `${dir}/11.png`,
      `${dir}/12.png`
    );
  }

  Spritesmith.run(
    {
      algorithm: "binary-tree",
      src: images,
    },
    (error, result) => {
      if (error) throw error;
      fs.writeFileSync(`./spritesheet.png`, result.image);
      console.log(result.coordinates);
      console.log(result.properties);
    }
  );
};

export const generateSpriteSheet3 = async (monsterNames) => {
  // Create the hashmap
  const anchors = new Map();
  const duplicates = new Map();
  const hashes = new Map();
  const images = [];
  for (const monsterName of monsterNames) {
    const dir = `./fixed/${monsterName}`;

    for (const path of [
      `${dir}/1.png`,
      `${dir}/2.png`,
      `${dir}/3.png`,
      `${dir}/4.png`,
      `${dir}/5.png`,
      `${dir}/6.png`,
      `${dir}/7.png`,
      `${dir}/8.png`,
      `${dir}/9.png`,
      `${dir}/10.png`,
      `${dir}/11.png`,
      `${dir}/12.png`,
    ]) {
      const sha256 = crypto.createHash("sha256");
      const image = await sharp(path);
      const metadata = await image.metadata();
      const data = await image.toBuffer();

      // Get the hash
      sha256.update(data);
      const hash = sha256.digest("hex");

      // Find the anchor point based on the bottom row of pixels
      const bottom = await sharp(path)
        .extract({
          left: 0,
          top: metadata.height - 1,
          width: metadata.width,
          height: 1,
        })
        .raw()
        .toBuffer();
      let start;
      for (let i = 3; i < bottom.length; i += 4) {
        if (bottom[i] !== 0) {
          start = Math.floor(i / 4);
          break;
        }
      }
      let end;
      for (let i = start * 4 + 7; i < bottom.length; i += 4) {
        if (bottom[i] === 0) {
          end = Math.floor(i / 4);
          break;
        }
      }
      anchors.set(path, (start + (end - start) / 2) / metadata.width);

      if (hashes.has(hash)) {
        // Set it as a duplicate
        const duplicate = hashes.get(hash);
        console.debug(`${path} is the same as ${duplicate}`);
        duplicates.set(path, duplicate);
      } else {
        images.push(path);
        hashes.set(hash, path);
      }
    }
  }

  Spritesmith.run(
    {
      algorithm: "binary-tree",
      src: images,
    },
    (error, result) => {
      if (error) throw error;

      const output = `./spritesheet.png`;

      fs.writeFileSync(output, result.image);
      const coordinates = result.coordinates;

      // Add references
      for (const [duplicate, reference] of duplicates) {
        coordinates[duplicate] = coordinates[reference];
      }

      const spritesheet = {
        frames: {},
        meta: {
          format: "RGBA8888",
          image: "spritesheet.png",
          scale: 1,
          size: {
            w: result.properties.width,
            h: result.properties.height,
          },
        },
        animations: {},
      };

      // Add the frames to the spritesheet
      for (const key of Object.keys(coordinates).sort()) {
        const fixedKey = key
          .replace("./fixed/", "")
          .replace("/", "_")
          .replace(".png", "");

        spritesheet.frames[fixedKey] = {
          // TODO: Figure out anchor point based on the shadow
          anchor: {
            x: anchors.get(key),
            y: 1,
          },
          frame: {
            x: coordinates[key].x,
            y: coordinates[key].y,
            w: coordinates[key].width,
            h: coordinates[key].height,
          },
        };
      }

      // Add the animations to the spritesheet
      for (const monsterName of monsterNames) {
        spritesheet.animations[`${monsterName}_N`] = [
          `${monsterName}_10`,
          `${monsterName}_11`,
          `${monsterName}_12`,
          `${monsterName}_11`,
        ];
        spritesheet.animations[`${monsterName}_E`] = [
          `${monsterName}_7`,
          `${monsterName}_8`,
          `${monsterName}_9`,
          `${monsterName}_8`,
        ];
        spritesheet.animations[`${monsterName}_S`] = [
          `${monsterName}_1`,
          `${monsterName}_2`,
          `${monsterName}_3`,
          `${monsterName}_2`,
        ];
        spritesheet.animations[`${monsterName}_W`] = [
          `${monsterName}_4`,
          `${monsterName}_5`,
          `${monsterName}_6`,
          `${monsterName}_5`,
        ];
      }

      fs.writeFileSync(
        `./spritesheet.json`,
        JSON.stringify(spritesheet, null, 2)
      );

      console.debug("  Created spritesheet & json!");
    }
  );
};
