#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('🔍 SmartFlow SocialScale Route Audit');
console.log('====================================');

try {
  const serverCode = readFileSync('server.js', 'utf-8');
  
  // Extract routes using basic regex
  const routeMatches = serverCode.match(/app\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
  
  if (!routeMatches) {
    console.log('❌ No routes found in server.js');
    process.exit(1);
  }
  
  console.log('\nDiscovered routes:');
  const routes = [];
  
  for (const match of routeMatches) {
    const [, method, path] = match.match(/app\.(\w+)\(['"`]([^'"`]+)['"`]/);
    routes.push({ method: method.toUpperCase(), path });
    console.log(`${method.toUpperCase().padEnd(6)} ${path}`);
  }
  
  // Check for expected SocialScale routes
  const expectedRoutes = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/book' },
    { method: 'GET', path: '/shop' },
    { method: 'GET', path: '/bots' },
    { method: 'GET', path: '/api/health' }
  ];
  
  console.log('\nChecking expected SocialScale routes:');
  for (const expected of expectedRoutes) {
    const found = routes.some(r => r.method === expected.method && r.path === expected.path);
    console.log(`${found ? '✅' : '❌'} ${expected.method} ${expected.path}`);
  }
  
  console.log(`\n📊 Total routes: ${routes.length}`);
  console.log('✅ Route audit complete');
  
} catch (error) {
  console.error('❌ Error reading server.js:', error.message);
  process.exit(1);
}