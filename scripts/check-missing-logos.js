const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const folders = fs.readdirSync(dataDir).filter(f =>
  !f.startsWith('.') && !f.startsWith('_') && fs.statSync(path.join(dataDir, f)).isDirectory()
);

let needsCopy = [];

for (const folder of folders) {
  const chainJsonPath = path.join(dataDir, folder, 'chain.json');
  if (!fs.existsSync(chainJsonPath)) continue;

  const data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));

  // Check if logo is empty but nativeToken has a logoUri
  const chainWithValidLogo = data.chains?.find(chain =>
    chain.nativeToken?.logoUri &&
    chain.nativeToken.logoUri.trim() !== '' &&
    !chain.nativeToken.logoUri.toLowerCase().includes('avacloud')
  );

  const mainLogoEmpty = !data.logo || data.logo.trim() === '';

  if (chainWithValidLogo && mainLogoEmpty) {
    console.log(`${folder}: ${chainWithValidLogo.nativeToken.logoUri}`);
    needsCopy.push({ folder, logo: chainWithValidLogo.nativeToken.logoUri });
  }
}

console.log(`\nTotal chains needing logo copy: ${needsCopy.length}`);

// Apply the fix
if (needsCopy.length > 0 && process.argv[2] === '--fix') {
  for (const { folder, logo } of needsCopy) {
    const chainJsonPath = path.join(dataDir, folder, 'chain.json');
    const data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
    data.logo = logo;
    fs.writeFileSync(chainJsonPath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ Fixed ${folder}`);
  }
  console.log(`\n✅ Applied logo fix to ${needsCopy.length} chains`);
}
