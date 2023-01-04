import axios from "axios";
import fs from "fs";
import url from "url";

const BASE_URL = "https://adventure.land";

export const ensureFolderExists = (path) => {
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

export const downloadSkin = async (data) => {
  const originalFilename = `./original${url.parse(data.file).pathname}`;

  ensureFolderExists(originalFilename);

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

  return originalFilename;
};
