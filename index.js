const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(__dirname, 'data');

/**
 * Get the data directory path for l1-registry
 * @returns {string} Absolute path to the data directory
 */
function getDataPath() {
  return DATA_PATH;
}

/**
 * Load a single chain by folder name
 * @param {string} chainFolder - Chain folder name (e.g., 'avalanche-primary-network')
 * @returns {Object|null} Chain metadata object or null if not found
 */
function loadChain(chainFolder) {
  try {
    const chainPath = path.join(DATA_PATH, chainFolder, 'chain.json');
    if (fs.existsSync(chainPath)) {
      const data = fs.readFileSync(chainPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Error loading chain ${chainFolder}:`, error.message);
    return null;
  }
}

/**
 * Load all available chains
 * @returns {Array<Object>} Array of chain metadata objects
 */
function getAllChains() {
  const chains = [];
  try {
    const dirs = fs.readdirSync(DATA_PATH, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory() && !dir.name.startsWith('_') && !dir.name.startsWith('.')) {
        const chainPath = path.join(DATA_PATH, dir.name, 'chain.json');
        if (fs.existsSync(chainPath)) {
          try {
            const data = fs.readFileSync(chainPath, 'utf8');
            chains.push(JSON.parse(data));
          } catch (error) {
            console.error(`Error parsing ${dir.name}/chain.json:`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading chains directory:', error.message);
  }

  return chains;
}

/**
 * Get list of all chain folder names
 * @returns {Array<string>} Array of chain folder names
 */
function getChainNames() {
  try {
    const dirs = fs.readdirSync(DATA_PATH, { withFileTypes: true });
    return dirs
      .filter(dir => dir.isDirectory() && !dir.name.startsWith('_') && !dir.name.startsWith('.'))
      .map(dir => dir.name);
  } catch (error) {
    console.error('Error reading chains directory:', error.message);
    return [];
  }
}

module.exports = {
  dataPath: DATA_PATH,
  getDataPath,
  loadChain,
  getAllChains,
  getChainNames
};
