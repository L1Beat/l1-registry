const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, '..', 'data');
const CONCURRENCY = 5;
const TIMEOUT = 10000;
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';

function parseArgs(argv) {
  const args = { folders: null, outputJson: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--folders' && argv[i + 1]) {
      args.folders = argv[++i].split(',').filter(Boolean);
    } else if (argv[i] === '--output-json' && argv[i + 1]) {
      args.outputJson = argv[++i];
    }
  }
  return args;
}

async function checkUrl(url) {
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      validateStatus: (s) => s < 400,
    });
    return { ok: true, msg: `Status: ${res.status}` };
  } catch (e) {
    const msg = e.response ? `HTTP ${e.response.status}` : e.code || e.message;
    return { ok: false, msg };
  }
}

async function checkRpc(rpcUrl) {
  try {
    const res = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    }, {
      timeout: TIMEOUT,
      headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    });
    const data = res.data;
    if (data && ('result' in data || 'error' in data)) {
      return { ok: true, msg: 'RPC responding' };
    }
    return { ok: false, msg: 'Invalid response' };
  } catch (e) {
    const msg = e.response ? `HTTP ${e.response.status}` : e.code || e.message;
    return { ok: false, msg };
  }
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, next));
  return results;
}

async function main() {
  const args = parseArgs(process.argv);

  let dirs = fs.readdirSync(DATA_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'));

  if (args.folders) {
    const folderSet = new Set(args.folders);
    dirs = dirs.filter(d => folderSet.has(d.name));
  }

  const urlWarnings = [];
  const rpcWarnings = [];
  const tasks = [];

  for (const dir of dirs) {
    const chainJsonPath = path.join(DATA_PATH, dir.name, 'chain.json');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(chainJsonPath, 'utf8'));
    } catch (e) {
      continue;
    }

    const folder = dir.name;

    // URL checks
    if (data.website) {
      const url = data.website;
      tasks.push(async () => {
        const r = await checkUrl(url);
        if (!r.ok) urlWarnings.push(`${folder}: Website unreachable - ${url} (${r.msg})`);
      });
    }
    if (data.logo) {
      const url = data.logo;
      tasks.push(async () => {
        const r = await checkUrl(url);
        if (!r.ok) urlWarnings.push(`${folder}: Logo unreachable - ${url} (${r.msg})`);
      });
    }
    for (const social of (data.socials || [])) {
      if (social.url) {
        const url = social.url;
        const name = social.name || 'unknown';
        tasks.push(async () => {
          const r = await checkUrl(url);
          if (!r.ok) urlWarnings.push(`${folder}: Social URL unreachable (${name}) - ${url} (${r.msg})`);
        });
      }
    }

    // RPC checks
    for (const chain of (data.chains || [])) {
      for (const rpcUrl of (chain.rpcUrls || [])) {
        if (rpcUrl) {
          const chainName = chain.name || 'unknown';
          tasks.push(async () => {
            const r = await checkRpc(rpcUrl);
            if (!r.ok) rpcWarnings.push(`${folder}/${chainName}: RPC unreachable - ${rpcUrl} (${r.msg})`);
          });
        }
      }
    }
  }

  console.log(`Checking reachability for ${dirs.length} chain(s) (${tasks.length} URLs/RPCs)...\n`);
  await runWithConcurrency(tasks, CONCURRENCY);

  if (urlWarnings.length > 0) {
    console.log('URL warnings:');
    for (const w of urlWarnings) console.log(`  - ${w}`);
  }
  if (rpcWarnings.length > 0) {
    console.log('RPC warnings:');
    for (const w of rpcWarnings) console.log(`  - ${w}`);
  }
  if (urlWarnings.length === 0 && rpcWarnings.length === 0) {
    console.log('All URLs and RPC endpoints are reachable.');
  }

  console.log(`\nURL warnings: ${urlWarnings.length}`);
  console.log(`RPC warnings: ${rpcWarnings.length}`);

  if (args.outputJson) {
    fs.writeFileSync(args.outputJson, JSON.stringify({ urlWarnings, rpcWarnings }, null, 2));
  }
}

main().catch(e => {
  console.error('Reachability check failed:', e.message);
  process.exit(1);
});
