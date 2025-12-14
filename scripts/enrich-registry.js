const fs = require('fs');
const path = require('path');
const axios = require('axios');

const REGISTRY_PATH = path.join(__dirname, '../data');
const GLACIER_API_BASE = process.env.GLACIER_API_BASE || 'https://glacier-api.avax.network/v1';
const GLACIER_API_KEY = process.env.GLACIER_API_KEY;
const RATE_LIMIT_DELAY = 6000;

const SYBIL_RESISTANCE_MAP = {
  '11111111111111111111111111111111LpoYY': 'Proof of Stake',
  'eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC': 'Proof of Stake',
  '5moznRzaAEhzWkNTQVdT1U4Kb9EU7dbsKZQNmHwtN5MGVQRyT': 'Proof of Stake'
};

const DEFAULT_SYBIL_RESISTANCE = 'Proof of Authority';

const results = {
  success: [],
  errors: [],
  skipped: [],
  statistics: {
    totalChains: 0,
    chainsWithIsL1: 0,
    chainsWithLogoUri: 0,
    chainsWithSybilType: 0,
    l1Count: 0,
    subnetCount: 0,
    proofOfStakeCount: 0,
    proofOfAuthorityCount: 0,
    apiErrors: {
      isL1Failures: 0,
      logoUriFailures: 0
    }
  }
};

let glacierChainData = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGlacierChainData() {
  try {
    console.log('Fetching all chain data from Glacier API...');
    const response = await axios.get(`${GLACIER_API_BASE}/chains`, {
      headers: {
        'x-glacier-api-key': GLACIER_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (!response.data || !response.data.chains) {
      throw new Error('Invalid response from Glacier API');
    }

    glacierChainData = response.data.chains;
    console.log(`Fetched ${glacierChainData.length} chains from Glacier API`);
    return glacierChainData;
  } catch (error) {
    console.error('Error fetching Glacier chain data:', error.message);
    return null;
  }
}

async function fetchIsL1(subnetId) {
  try {
    const response = await axios.get(
      `${GLACIER_API_BASE}/networks/mainnet/subnets/${subnetId}`,
      {
        headers: { 'x-glacier-api-key': GLACIER_API_KEY },
        timeout: 30000
      }
    );
    return response.data.isL1 || false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`  Subnet ${subnetId} not found in API (might be testnet or private)`);
    } else {
      console.warn(`  Failed to fetch isL1 for ${subnetId}: ${error.message}`);
    }
    results.statistics.apiErrors.isL1Failures++;
    return false;
  }
}

function findLogoUriForBlockchain(blockchainId) {
  if (!glacierChainData) return null;

  const chain = glacierChainData.find(c => c.platformChainId === blockchainId);
  if (chain && chain.networkToken && chain.networkToken.logoUri) {
    return chain.networkToken.logoUri;
  }
  return null;
}

function determineSybilResistance(subnetId, isL1) {
  if (SYBIL_RESISTANCE_MAP[subnetId]) {
    return SYBIL_RESISTANCE_MAP[subnetId];
  }
  return DEFAULT_SYBIL_RESISTANCE;
}

function getChainFolders() {
  return fs.readdirSync(REGISTRY_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => !dirent.name.startsWith('.') && !dirent.name.startsWith('_'))
    .map(dirent => dirent.name);
}

async function enrichChain(folder) {
  try {
    const chainJsonPath = path.join(REGISTRY_PATH, folder, 'chain.json');

    if (!fs.existsSync(chainJsonPath)) {
      console.log(`  Skipping ${folder}: chain.json not found`);
      results.skipped.push({ folder, reason: 'chain.json not found' });
      return;
    }

    const chainData = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
    let modified = false;

    if (chainData.isL1 === undefined) {
      const isL1 = await fetchIsL1(chainData.subnetId);
      chainData.isL1 = isL1;
      modified = true;
      results.statistics.chainsWithIsL1++;

      if (isL1) {
        results.statistics.l1Count++;
      } else {
        results.statistics.subnetCount++;
      }
    }

    if (chainData.chains && chainData.chains.length > 0) {
      for (const chain of chainData.chains) {
        if (!chain.nativeToken) {
          chain.nativeToken = {};
        }

        if (!chain.nativeToken.logoUri) {
          const logoUri = findLogoUriForBlockchain(chain.blockchainId);
          if (logoUri) {
            chain.nativeToken.logoUri = logoUri;
            modified = true;
            results.statistics.chainsWithLogoUri++;
          } else {
            chain.nativeToken.logoUri = '';
            results.statistics.apiErrors.logoUriFailures++;
          }
        }

        if (!chain.sybilResistanceType) {
          const sybilType = determineSybilResistance(chainData.subnetId, chainData.isL1);
          chain.sybilResistanceType = sybilType;
          modified = true;
          results.statistics.chainsWithSybilType++;

          if (sybilType === 'Proof of Stake') {
            results.statistics.proofOfStakeCount++;
          } else if (sybilType === 'Proof of Authority') {
            results.statistics.proofOfAuthorityCount++;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(chainJsonPath, JSON.stringify(chainData, null, 2) + '\n');
      console.log(`  ✓ Updated ${folder}`);
      results.success.push({
        folder,
        isL1: chainData.isL1,
        sybilType: chainData.chains[0]?.sybilResistanceType,
        hasLogoUri: !!chainData.chains[0]?.nativeToken?.logoUri
      });
    } else {
      console.log(`  - ${folder} (no changes needed)`);
      results.skipped.push({ folder, reason: 'already enriched' });
    }

    results.statistics.totalChains++;
  } catch (error) {
    console.error(`  ✗ Error processing ${folder}:`, error.message);
    results.errors.push({ folder, error: error.message });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const singleMode = args.includes('--single');
  const targetFolder = singleMode ? args[args.length - 1] : null;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  L1-Registry Enrichment Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  if (!GLACIER_API_KEY) {
    console.error('ERROR: GLACIER_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Registry Path: ${REGISTRY_PATH}`);
  console.log(`  Glacier API: ${GLACIER_API_BASE}`);
  console.log(`  API Key: ${GLACIER_API_KEY.substring(0, 4)}...`);
  console.log(`  Rate Limit: ${RATE_LIMIT_DELAY / 1000}s between requests`);
  console.log();

  await fetchGlacierChainData();
  console.log();

  const folders = singleMode ? [targetFolder] : getChainFolders();
  console.log(`Processing ${folders.length} chain(s)...\n`);

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    console.log(`[${i + 1}/${folders.length}] Processing: ${folder}`);
    await enrichChain(folder);

    if (i < folders.length - 1 && !singleMode) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Enrichment Complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  console.log('Summary:');
  console.log(`  Total Chains Processed: ${results.statistics.totalChains}`);
  console.log(`  Successfully Updated: ${results.success.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);
  console.log(`  Errors: ${results.errors.length}`);
  console.log();
  console.log('Statistics:');
  console.log(`  L1 Chains: ${results.statistics.l1Count}`);
  console.log(`  Subnet Chains: ${results.statistics.subnetCount}`);
  console.log(`  Proof of Stake: ${results.statistics.proofOfStakeCount}`);
  console.log(`  Proof of Authority: ${results.statistics.proofOfAuthorityCount}`);
  console.log(`  Chains with Logo URI: ${results.statistics.chainsWithLogoUri}`);
  console.log();
  console.log('API Errors:');
  console.log(`  isL1 Fetch Failures: ${results.statistics.apiErrors.isL1Failures}`);
  console.log(`  Logo URI Missing: ${results.statistics.apiErrors.logoUriFailures}`);
  console.log();

  const reportPath = path.join(__dirname, '../enrichment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);

  if (results.errors.length > 0) {
    const errorLogPath = path.join(__dirname, '../enrichment-errors.log');
    const errorLog = results.errors.map(e => `${e.folder}: ${e.error}`).join('\n');
    fs.writeFileSync(errorLogPath, errorLog);
    console.log(`Error log saved to: ${errorLogPath}`);
  }

  console.log();
  console.log('Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
