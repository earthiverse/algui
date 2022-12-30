import AL from "alclient";
import axios from "axios";
import fs from "fs";
import sharp from "sharp";
import url from "url";

const BASE_URL = "https://adventure.land";
const G = await AL.Game.getGData(true, false);

/**
 * This function looks for the given skin name in the sprites and returns information about where we can find the sprite
 * @param {string} name
 */
const findSkin = (name) => {
  for (const spriteName in G.sprites) {
    const gSprite = G.sprites[spriteName];
    for (let row = 0; row < gSprite.matrix.length; row++) {
      const matrix = gSprite.matrix[row];
      const column = matrix.indexOf(name);
      if (column !== -1)
        return {
          column: column,
          columns: gSprite.columns,
          file: gSprite.file,
          name: spriteName,
          row: row,
          rows: gSprite.rows,
        };
    }
  }
  throw `Couldn't find skin for ${name}`;
};

const ensureFolderExists = (path) => {
  // Split the file path into an array of directories
  const dirs = path.split("/");

  // Remove the file name from the array
  dirs.pop();

  let currentDir = ".";

  // Create the directories if they don't exist
  for (const dir of dirs) {
    currentDir += "/" + dir;
    try {
      fs.mkdirSync(currentDir);
    } catch (err) {
      if (err.code !== "EEXIST") {
        console.debug(path);
        throw err;
      }
    }
  }
};

const downloadSkin = async (data, monsterName) => {
  const originalFilename = `./original${url.parse(data.file).pathname}`;
  const monsterFilename = `./fixed/${monsterName}.png`;

  ensureFolderExists(originalFilename);
  ensureFolderExists(monsterFilename);

  // Download the file if it doesn't exist
  if (!fs.existsSync(originalFilename)) {
    console.debug(`Downloading ${originalFilename}...`);
    const response = await axios({
      url: `${BASE_URL}${data.file}`,
      method: "GET",
      responseType: "arraybuffer",
    });
    fs.writeFileSync(originalFilename, response.data);
  }

  // Get metadata about the file
  const image = sharp(originalFilename);
  const metadata = await image.metadata();
  const spriteWidth = metadata.width / data.columns;
  const spriteHeight = metadata.height / data.rows;
  const left = data.column * spriteWidth;
  const top = data.row * spriteHeight;
  try {
    await image
      .extract({
        left: left,
        top: top,
        width: spriteWidth,
        height: spriteHeight,
      })
      .toFile(monsterFilename);
  } catch (error) {
    console.error(originalFilename);
    console.error(monsterFilename);
    console.error(error);
    throw error;
  }

  return monsterFilename;
};

const optimizeSkin = async (monsterSkin) => {
  let image = await sharp(monsterSkin);
  let metadata = await image.metadata();

  const isRowTransparent = async (row) => {
    // Load the image and read the pixel data for the specified row
    const data = await sharp(monsterSkin)
      .extract({ left: 0, top: row, width: metadata.width, height: 1 })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Check if any of the pixels in the row isn't transparent
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        // We found a non-transparent pixel
        return false;
      }
    }

    // It's fully transparent
    return true;
  };

  const isColTransparent = async (col) => {
    // Load the image and read the pixel data for the specified row
    const data = await sharp(monsterSkin)
      .extract({ left: col, top: 0, width: 1, height: metadata.height })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Check if any of the pixels in the column isn't transparent
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        // We found a non-transparent pixel
        return false;
      }
    }

    // It's fully transparent
    return true;
  };

  const trimTop = async (numRows) => {
    // Create a new image with the same width and adjusted height
    const trimmedImage = sharp({
      create: {
        width: metadata.width,
        height: metadata.height - numRows * 4,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const rowHeight = metadata.height / 4;
    let row = 0;
    let composites = [];
    // Iterate over all rows of the original image
    for (let y = 0; y < metadata.height; y++) {
      // Remove the tops
      if (y % rowHeight <= numRows - 1) continue;

      // Otherwise, copy the row to the new image
      const data = await sharp(monsterSkin)
        .extract({ left: 0, top: y, width: metadata.width, height: 1 })
        .toBuffer();
      composites.push({ input: data, left: 0, top: row });
      row += 1;
    }

    // Save the new image to the output file
    await trimmedImage.composite(composites).toFile(monsterSkin);
    image = sharp(monsterSkin);
    metadata = await image.metadata();
  };

  // Trim top
  let canTrim = true;
  let numTrim = 0;
  while (canTrim) {
    const rowHeight = metadata.height / 4;
    for (let rowNum = 0; rowNum < 4; rowNum++) {
      const row = rowNum * rowHeight + numTrim;
      canTrim = await isRowTransparent(row);
      if (!canTrim) break;
    }
    if (canTrim) {
      numTrim += 1;
    }
  }
  if (numTrim > 0) {
    console.debug("Trimming top of", monsterSkin, "for", numTrim, "pixels!");
    await trimTop(numTrim);
  }

  const trimBottom = async (numRows) => {
    // Create a new image with the same width and adjusted height
    const trimmedImage = sharp({
      create: {
        width: metadata.width,
        height: metadata.height - numRows * 4,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const rowHeight = metadata.height / 4;
    let row = 0;
    let composites = [];
    // Iterate over all rows of the original image
    for (let y = 0; y < metadata.height; y++) {
      // Remove the bottoms
      if (y % rowHeight >= rowHeight - numRows) continue;

      // Otherwise, copy the row to the new image
      const data = await sharp(monsterSkin)
        .extract({ left: 0, top: y, width: metadata.width, height: 1 })
        .toBuffer();
      composites.push({ input: data, left: 0, top: row });
      row += 1;
    }

    // Save the new image to the output file
    await trimmedImage.composite(composites).toFile(monsterSkin);
    image = sharp(monsterSkin);
    metadata = await image.metadata();
  };

  // Trim bottom
  canTrim = true;
  numTrim = 0;
  while (canTrim) {
    const rowHeight = metadata.height / 4;
    for (let rowNum = 0; rowNum < 4; rowNum++) {
      const row = (rowNum + 1) * rowHeight - numTrim - 1;
      canTrim = await isRowTransparent(row);
      if (!canTrim) break;
    }
    if (canTrim) {
      numTrim += 1;
    }
  }
  if (numTrim > 0) {
    console.debug("Trimming bottom of", monsterSkin, "for", numTrim, "pixels!");
    await trimBottom(numTrim);
  }

  const trimLeft = async (numCols) => {
    // Create a new image with the same width and adjusted height
    const trimmedImage = sharp({
      create: {
        width: metadata.width - numCols * 3,
        height: metadata.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const colWidth = metadata.width / 3;
    let col = 0;
    let composites = [];
    // Iterate over all rows of the original image
    for (let x = 0; x < metadata.width; x++) {
      // Remove the lefts
      if (x % colWidth <= numCols - 1) continue;

      // Otherwise, copy the column to the new image
      const data = await sharp(monsterSkin)
        .extract({ left: x, top: 0, width: 1, height: metadata.height })
        .toBuffer();
      composites.push({ input: data, left: col, top: 0 });
      col += 1;
    }

    // Save the new image to the output file
    await trimmedImage.composite(composites).toFile(monsterSkin);
    image = sharp(monsterSkin);
    metadata = await image.metadata();
  };

  // Trim left
  canTrim = true;
  numTrim = 0;
  while (canTrim) {
    const colWidth = metadata.width / 3;
    for (let colNum = 0; colNum < 3; colNum++) {
      const col = colNum * colWidth + numTrim;
      canTrim = await isColTransparent(col);
      if (!canTrim) break;
    }
    if (canTrim) {
      numTrim += 1;
    }
  }
  if (numTrim > 0) {
    console.debug("Trimming left of", monsterSkin, "for", numTrim, "pixels!");
    await trimLeft(numTrim);
  }

  const trimRight = async (numCols) => {
    // Create a new image with the same width and adjusted height
    const trimmedImage = sharp({
      create: {
        width: metadata.width - numCols * 3,
        height: metadata.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const colWidth = metadata.width / 3;
    let col = 0;
    let composites = [];
    // Iterate over all rows of the original image
    for (let x = 0; x < metadata.width; x++) {
      // Remove the rights
      if (x % colWidth >= colWidth - numCols) continue;

      // Otherwise, copy the column to the new image
      const data = await sharp(monsterSkin)
        .extract({ left: x, top: 0, width: 1, height: metadata.height })
        .toBuffer();
      composites.push({ input: data, left: col, top: 0 });
      col += 1;
    }

    // Save the new image to the output file
    await trimmedImage.composite(composites).toFile(monsterSkin);
    image = sharp(monsterSkin);
    metadata = await image.metadata();
  };

  // Trim right
  canTrim = true;
  numTrim = 0;
  while (canTrim) {
    const colWidth = metadata.width / 3;
    for (let colNum = 0; colNum < 3; colNum++) {
      const col = (colNum + 1) * colWidth - numTrim - 1;
      canTrim = await isColTransparent(col);
      if (!canTrim) break;
    }
    if (canTrim) {
      numTrim += 1;
    }
  }
  if (numTrim > 0) {
    console.debug("Trimming right of", monsterSkin, "for", numTrim, "pixels!");
    await trimRight(numTrim);
  }
};

for (const monsterName in G.monsters) {
  const gMonster = G.monsters[monsterName];
  const skinData = findSkin(gMonster.skin);
  const monsterSkin = await downloadSkin(skinData, monsterName);
  await optimizeSkin(monsterSkin);
}
