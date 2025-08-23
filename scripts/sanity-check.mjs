#!/usr/bin/env node

import { existsSync } from 'fs';
import { resolve } from 'path';

const requiredFiles = [
  'index.html',
  'book.html', 
  'shop.html',
  'bots.html',
  'server.js',
  'sw.js',
  'assets/favicon.svg',
  'static/style.css',
  'static/app.js'
];

const requiredDirs = [
  'assets',
  'static',
  'scripts',
  'tests/e2e'
];

console.log('🔍 SmartFlow SocialScale Sanity Check');
console.log('=====================================');

let allGood = true;

// Check files
console.log('\nChecking required files:');
for (const file of requiredFiles) {
  const exists = existsSync(resolve(file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
}

// Check directories
console.log('\nChecking required directories:');
for (const dir of requiredDirs) {
  const exists = existsSync(resolve(dir));
  console.log(`${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists) allGood = false;
}

// Check Node modules
console.log('\nChecking dependencies:');
const hasNodeModules = existsSync('node_modules');
const hasPackageJson = existsSync('package.json');
console.log(`${hasNodeModules ? '✅' : '❌'} node_modules/`);
console.log(`${hasPackageJson ? '✅' : '❌'} package.json`);

if (!hasNodeModules || !hasPackageJson) allGood = false;

console.log('\n=====================================');
if (allGood) {
  console.log('🎉 All checks passed! Project structure is healthy.');
  process.exit(0);
} else {
  console.log('⚠️  Some issues found. Please review the missing items above.');
  process.exit(1);
}