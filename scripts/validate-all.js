const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data');

const REQUIRED_FIELDS = ['subnetId', 'network', 'categories', 'name', 'description', 'logo', 'website', 'socials', 'chains'];
const REQUIRED_CHAIN_FIELDS = ['blockchainId', 'name', 'evmChainId', 'vmName', 'vmId', 'rpcUrls'];

const TEMPLATE_STRINGS = [
  'subnet-id-here', 'blockchain-id-here', 'chain-slug',
  'vm-id-here', 'rpc-url-here', 'Chain Name', 'My Chain',
  'Describe your', 'https://your-', 'TEMPLATE',
];

const URL_PATTERN = /^https?:\/\/[^\s/$?.#][^\s]*$/;

function hasTemplateValue(obj, objPath) {
  if (typeof obj === 'string') {
    for (const t of TEMPLATE_STRINGS) {
      if (obj.toLowerCase().includes(t.toLowerCase())) {
        return `template placeholder at '${objPath}': '${obj}'`;
      }
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const r = hasTemplateValue(obj[i], `${objPath}[${i}]`);
      if (r) return r;
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const r = hasTemplateValue(v, `${objPath}.${k}`);
      if (r) return r;
    }
  }
  return null;
}

function validateChain(folder, data) {
  const errors = [];
  const warnings = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Network value
  if (data.network && !['mainnet', 'fuji'].includes(data.network)) {
    errors.push("network must be 'mainnet' or 'fuji'");
  }

  // Category casing
  for (const cat of (data.categories || [])) {
    if (typeof cat === 'string' && cat !== cat.toUpperCase()) {
      errors.push(`category '${cat}' must be uppercase - use '${cat.toUpperCase()}'`);
    }
  }

  // Template values
  const templateResult = hasTemplateValue(data, folder);
  if (templateResult) {
    errors.push(templateResult);
  }

  // URL format validation
  for (const field of ['logo', 'website']) {
    const url = data[field] || '';
    if (url && !URL_PATTERN.test(url)) {
      errors.push(`'${field}' is not a valid URL: '${url}'`);
    }
  }
  for (const social of (data.socials || [])) {
    const url = social.url || '';
    if (url && !URL_PATTERN.test(url)) {
      errors.push(`social url is not a valid URL: '${url}'`);
    }
  }

  // Chain-level validation
  if (data.chains && Array.isArray(data.chains)) {
    for (let idx = 0; idx < data.chains.length; idx++) {
      const chain = data.chains[idx];

      for (const field of REQUIRED_CHAIN_FIELDS) {
        if (!(field in chain)) {
          errors.push(`chains[${idx}] missing field: ${field}`);
        }
      }

      for (const rpc of (chain.rpcUrls || [])) {
        if (rpc && !URL_PATTERN.test(rpc)) {
          errors.push(`rpcUrl is not a valid URL: '${rpc}'`);
        }
      }

      const nt = chain.nativeToken;
      if (nt && typeof nt === 'object') {
        for (const field of ['symbol', 'name', 'decimals']) {
          if (nt[field] === undefined || nt[field] === null || nt[field] === '') {
            warnings.push(`chains[${idx}].nativeToken.${field} is empty`);
          }
        }
        const logoUri = nt.logoUri || '';
        if (logoUri && !URL_PATTERN.test(logoUri)) {
          errors.push(`nativeToken.logoUri is not a valid URL: '${logoUri}'`);
        }
        if (!logoUri) {
          warnings.push(`chains[${idx}].nativeToken.logoUri is empty`);
        }
      }

      if (chain.evmChainId === null || chain.evmChainId === undefined) {
        warnings.push(`chains[${idx}].evmChainId is null`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const dirs = fs.readdirSync(DATA_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'));

  const folderPattern = /^[a-z0-9-]+$/;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalChains = 0;

  // Uniqueness checks
  const seenSubnetIds = {};
  const seenEvmChainIds = {};

  console.log(`Validating ${dirs.length} chains...\n`);

  for (const dir of dirs) {
    const folder = dir.name;
    const chainJsonPath = path.join(DATA_PATH, folder, 'chain.json');
    const readmePath = path.join(DATA_PATH, folder, 'README.md');

    // Folder naming
    if (!folderPattern.test(folder)) {
      console.error(`  ERROR ${folder}: folder name must be lowercase and hyphenated`);
      totalErrors++;
      continue;
    }

    // File existence
    if (!fs.existsSync(chainJsonPath)) {
      console.error(`  ERROR ${folder}: Missing chain.json`);
      totalErrors++;
      continue;
    }
    if (!fs.existsSync(readmePath)) {
      console.error(`  ERROR ${folder}: Missing README.md`);
      totalErrors++;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
    } catch (e) {
      console.error(`  ERROR ${folder}: Invalid JSON - ${e.message}`);
      totalErrors++;
      continue;
    }

    // Uniqueness: subnetId
    const sid = data.subnetId || '';
    if (sid) {
      if (seenSubnetIds[sid]) {
        console.error(`  ERROR ${folder}: duplicate subnetId '${sid}' already used by '${seenSubnetIds[sid]}'`);
        totalErrors++;
      } else {
        seenSubnetIds[sid] = folder;
      }
    }

    // Uniqueness: evmChainId
    for (const chain of (data.chains || [])) {
      const eid = chain.evmChainId;
      if (eid !== null && eid !== undefined) {
        const key = String(eid);
        if (seenEvmChainIds[key]) {
          console.error(`  ERROR ${folder}: evmChainId ${eid} already used by '${seenEvmChainIds[key]}'`);
          totalErrors++;
        } else {
          seenEvmChainIds[key] = folder;
        }
      }
    }

    const { errors, warnings } = validateChain(folder, data);

    for (const err of errors) {
      console.error(`  ERROR ${folder}: ${err}`);
    }
    for (const warn of warnings) {
      console.warn(`  WARN  ${folder}: ${warn}`);
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;
    totalChains++;
  }

  console.log(`\n${'='.join ? '=' : '━'.repeat(40)}`);
  console.log(`Validated ${totalChains} chains`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.error(`\nValidation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nAll validations passed.');
  }
}

main();
