import fs from 'fs';
import path from 'path';

function readFile() {
  try {
    const filePath = path.join(__dirname, 'build', 'mToken.wasm');
    const fileData = fs.readFileSync(filePath);
    const wasmData = new Uint8Array(fileData);
    return wasmData;
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

module.exports = { readFile };