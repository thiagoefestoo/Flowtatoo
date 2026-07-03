const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['node_modules', 'uploads', 'dist', 'build', '.git']);

function collectJsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectJsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = collectJsFiles(rootDir);
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error('\nFalha na validação de sintaxe do backend.');
  process.exit(1);
}

console.log(`\nSintaxe validada com sucesso em ${files.length} arquivo(s) JS do backend.`);
