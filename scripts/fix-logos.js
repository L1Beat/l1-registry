const fs = require('fs');
const path = require('path');

const AVACLOUD_URLS = [
  'https://images.ctfassets.net/gcj8jwzm6086/62KzIedYATHGgRODAP5Py9/e290f4d8598ac8d30d80975a560cca8f/AvaCloud-512x512.png',
  'https://cdn.snowpeer.io/avacloud.png'
];

const dataDir = path.join(__dirname, '../data');
const folders = fs.readdirSync(dataDir).filter(f =>
  !f.startsWith('.') && !f.startsWith('_') && fs.statSync(path.join(dataDir, f)).isDirectory()
);

let fixedCount = 0;
let logosCopied = 0;

for (const folder of folders) {
  const chainJsonPath = path.join(dataDir, folder, 'chain.json');

  if (!fs.existsSync(chainJsonPath)) continue;

  const data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
  let modified = false;

  // Fix main logo if it's AvaCloud
  if (AVACLOUD_URLS.includes(data.logo)) {
    // Check if any chain has a valid nativeToken.logoUri
    const validTokenLogo = data.chains?.find(chain =>
      chain.nativeToken?.logoUri && !AVACLOUD_URLS.includes(chain.nativeToken.logoUri)
    )?.nativeToken?.logoUri;

    if (validTokenLogo) {
      data.logo = validTokenLogo;
      logosCopied++;
      console.log(`✓ ${folder}: Copied token logo to main logo`);
    } else {
      data.logo = '';
      console.log(`✓ ${folder}: Removed AvaCloud logo (will use fallback)`);
    }
    modified = true;
  }

  // Fix nativeToken logoUri in chains array
  if (data.chains) {
    for (const chain of data.chains) {
      if (chain.nativeToken?.logoUri && AVACLOUD_URLS.includes(chain.nativeToken.logoUri)) {
        chain.nativeToken.logoUri = '';
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(chainJsonPath, JSON.stringify(data, null, 2) + '\n');
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} chains`);
console.log(`✅ Copied ${logosCopied} token logos to main logo`);
