const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data');

const REQUIRED_FIELDS = ['subnetId', 'network', 'categories', 'name', 'description', 'logo', 'website', 'socials', 'chains'];
const REQUIRED_CHAIN_FIELDS = ['blockchainId', 'name', 'evmChainId', 'vmName', 'vmId', 'rpcUrls', 'nativeToken'];

const TEMPLATE_STRINGS = [
  'subnet-id-here', 'blockchain-id-here', 'chain-slug',
  'vm-id-here', 'rpc-url-here', 'Chain Name', 'My Chain',
  'Describe your', 'https://your-', 'TEMPLATE',
];

const URL_PATTERN = /^https?:\/\/[^\s/$?.#][^\s]*$/;

function parseArgs(argv) {
  const args = { changedFolders: null, outputJson: null, single: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--changed-folders' && argv[i + 1]) {
      args.changedFolders = new Set(argv[++i].split(',').filter(Boolean));
    } else if (argv[i] === '--output-json' && argv[i + 1]) {
      args.outputJson = argv[++i];
    } else if (argv[i] === '--single' && argv[i + 1]) {
      args.single = argv[++i];
    }
  }
  return args;
}

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

function validateChain(folder, data, isStrict) {
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

  // Empty categories
  if (!data.categories || data.categories.length === 0) {
    warnings.push('No categories defined');
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

  // Content quality checks
  const desc = (data.description || '').trim();
  if (desc.length > 0 && desc.length < 20) {
    warnings.push(`Description too short (${desc.length} chars, recommend >= 20)`);
  } else if (desc.length > 500) {
    warnings.push(`Description very long (${desc.length} chars, recommend <= 500)`);
  }

  const subnetId = data.subnetId || '';
  if (subnetId && subnetId.length < 20) {
    warnings.push('subnetId seems too short - might be invalid');
  }

  // Empty chains array
  if (!data.chains || data.chains.length === 0) {
    warnings.push('No blockchains defined in chains array');
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

      // nativeToken type check
      if ('nativeToken' in chain && chain.nativeToken && typeof chain.nativeToken !== 'object') {
        errors.push(`chains[${idx}] nativeToken must be an object`);
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
            if (isStrict) {
              errors.push(`chains[${idx}].nativeToken.${field} required and cannot be empty`);
            } else {
              warnings.push(`chains[${idx}].nativeToken.${field} is empty`);
            }
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
        if (isStrict) {
          errors.push(`chains[${idx}].evmChainId cannot be null - assign a chain ID before merging`);
        } else {
          warnings.push(`chains[${idx}].evmChainId is null`);
        }
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const args = parseArgs(process.argv);
  const allErrors = [];
  const allWarnings = [];

  let dirs = fs.readdirSync(DATA_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'));

  // --single mode: validate one folder only
  if (args.single) {
    dirs = dirs.filter(d => d.name === args.single);
    if (dirs.length === 0) {
      console.error(`Error: folder '${args.single}' not found in data/`);
      process.exit(1);
    }
  }

  const folderPattern = /^[a-z0-9-]+$/;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalChains = 0;

  // Uniqueness checks
  const seenSubnetIds = {};
  const seenEvmChainIds = {};

  // For uniqueness checks in --single mode, load all chains
  const allDirs = args.single
    ? fs.readdirSync(DATA_PATH, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
    : dirs;

  // Pre-populate uniqueness maps with all other chains (for --single mode)
  if (args.single) {
    for (const dir of allDirs) {
      if (dir.name === args.single) continue;
      const chainJsonPath = path.join(DATA_PATH, dir.name, 'chain.json');
      try {
        const data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
        const sid = data.subnetId || '';
        if (sid) seenSubnetIds[sid] = dir.name;
        for (const chain of (data.chains || [])) {
          const eid = chain.evmChainId;
          if (eid !== null && eid !== undefined) {
            seenEvmChainIds[String(eid)] = dir.name;
          }
        }
      } catch (e) { /* skip unreadable chains */ }
    }
  }

  console.log(`Validating ${dirs.length} chain(s)...\n`);

  for (const dir of dirs) {
    const folder = dir.name;
    const chainJsonPath = path.join(DATA_PATH, folder, 'chain.json');
    const readmePath = path.join(DATA_PATH, folder, 'README.md');

    const isStrict = args.single
      ? true
      : args.changedFolders ? args.changedFolders.has(folder) : false;

    // Folder naming
    if (!folderPattern.test(folder)) {
      const msg = `${folder}: folder name must be lowercase and hyphenated`;
      console.error(`  ERROR ${msg}`);
      allErrors.push(msg);
      totalErrors++;
      continue;
    }

    // File existence
    if (!fs.existsSync(chainJsonPath)) {
      const msg = `${folder}: Missing chain.json`;
      console.error(`  ERROR ${msg}`);
      allErrors.push(msg);
      totalErrors++;
      continue;
    }
    if (!fs.existsSync(readmePath)) {
      const msg = `${folder}: Missing README.md`;
      console.error(`  ERROR ${msg}`);
      allErrors.push(msg);
      totalErrors++;
    } else {
      const stat = fs.statSync(readmePath);
      if (stat.size === 0) {
        const msg = `${folder}: README.md is empty`;
        console.error(`  ERROR ${msg}`);
        allErrors.push(msg);
        totalErrors++;
      }
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
    } catch (e) {
      const msg = `${folder}: Invalid JSON - ${e.message}`;
      console.error(`  ERROR ${msg}`);
      allErrors.push(msg);
      totalErrors++;
      continue;
    }

    // Uniqueness: subnetId
    const sid = data.subnetId || '';
    if (sid) {
      if (seenSubnetIds[sid]) {
        const msg = `${folder}: duplicate subnetId '${sid}' already used by '${seenSubnetIds[sid]}'`;
        console.error(`  ERROR ${msg}`);
        allErrors.push(msg);
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
          const msg = `${folder}: evmChainId ${eid} already used by '${seenEvmChainIds[key]}'`;
          console.error(`  ERROR ${msg}`);
          allErrors.push(msg);
          totalErrors++;
        } else {
          seenEvmChainIds[key] = folder;
        }
      }
    }

    const { errors, warnings } = validateChain(folder, data, isStrict);

    for (const err of errors) {
      console.error(`  ERROR ${folder}: ${err}`);
      allErrors.push(`${folder}: ${err}`);
    }
    for (const warn of warnings) {
      console.warn(`  WARN  ${folder}: ${warn}`);
      allWarnings.push(`${folder}: ${warn}`);
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;
    totalChains++;
  }

  console.log(`\n${'━'.repeat(40)}`);
  console.log(`Validated ${totalChains} chain(s)`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  const passed = totalErrors === 0;

  if (args.outputJson) {
    const result = {
      totalChains,
      errors: allErrors,
      warnings: allWarnings,
      passed,
    };
    fs.writeFileSync(args.outputJson, JSON.stringify(result, null, 2));
  }

  if (!passed) {
    console.error(`\nValidation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nAll validations passed.');
  }
}

main();
