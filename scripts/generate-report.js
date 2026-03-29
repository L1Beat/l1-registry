const fs = require('fs');

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function main() {
  const validationPath = process.argv[2] || 'validation-results.json';
  const reachabilityPath = process.argv[3] || 'reachability-results.json';
  const outputPath = process.argv[4]; // optional: write to file instead of stdout

  const validation = loadJson(validationPath) || { totalChains: 0, errors: [], warnings: [], passed: true };
  const reachability = loadJson(reachabilityPath) || { urlWarnings: [], rpcWarnings: [] };

  const passed = validation.passed;
  const status = passed ? 'All required validations passed' : 'Validation failed';

  let report = `## Validation Report\n\n`;
  report += `Status: ${status}\n\n`;
  report += `### Summary\n`;
  report += `- Total chains in registry: ${validation.totalChains}\n`;
  report += `- Structural errors: ${validation.errors.length}\n`;
  report += `- Structural warnings: ${validation.warnings.length}\n`;
  report += `- URL warnings: ${reachability.urlWarnings.length}\n`;
  report += `- RPC warnings: ${reachability.rpcWarnings.length}\n\n`;

  if (validation.errors.length > 0) {
    report += `### Errors (blocking)\n\n`;
    for (const e of validation.errors.slice(0, 10)) {
      report += `- ${e}\n`;
    }
    if (validation.errors.length > 10) {
      report += `- ... and ${validation.errors.length - 10} more\n`;
    }
    report += '\n';
  }

  const hasWarnings = validation.warnings.length > 0 ||
    reachability.urlWarnings.length > 0 || reachability.rpcWarnings.length > 0;

  if (hasWarnings) {
    report += `### Warnings (non-blocking)\n\n`;

    if (reachability.urlWarnings.length > 0) {
      report += `URL Issues:\n`;
      for (const w of reachability.urlWarnings.slice(0, 5)) {
        report += `- ${w}\n`;
      }
      if (reachability.urlWarnings.length > 5) {
        report += `- ... and ${reachability.urlWarnings.length - 5} more\n`;
      }
      report += '\n';
    }

    if (reachability.rpcWarnings.length > 0) {
      report += `RPC Issues:\n`;
      for (const w of reachability.rpcWarnings.slice(0, 5)) {
        report += `- ${w}\n`;
      }
      if (reachability.rpcWarnings.length > 5) {
        report += `- ... and ${reachability.rpcWarnings.length - 5} more\n`;
      }
      report += '\n';
    }

    if (validation.warnings.length > 0) {
      report += `Structural:\n`;
      for (const w of validation.warnings.slice(0, 5)) {
        report += `- ${w}\n`;
      }
      if (validation.warnings.length > 5) {
        report += `- ... and ${validation.warnings.length - 5} more\n`;
      }
      report += '\n';
    }

    report += `Note: Warnings are informational and do not block this PR.\n`;
  } else {
    report += `No warnings found.\n`;
  }

  if (outputPath) {
    fs.writeFileSync(outputPath, report);
  } else {
    process.stdout.write(report);
  }
}

main();
