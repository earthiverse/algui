/**
 * This function looks for the given skin name in the sprites and returns information about where we can find the sprite
 * @param {string} name
 */
export const findSkin = (G, name) => {
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
