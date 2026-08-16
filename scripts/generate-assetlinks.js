#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generuje SHA-256 fingerprint z Android keystore a aktualizuje public/.well-known/assetlinks.json
 */
const keystorePath = process.argv[2] || process.env.KEYSTORE_PATH || 'android/app/forenzdetectiv.keystore';
const alias = process.argv[3] || process.env.KEY_ALIAS || 'upload';
const storePass = process.argv[4] || process.env.KEYSTORE_PASSWORD;
const keyPass = process.argv[5] || process.env.KEY_PASSWORD || storePass;

console.log('🔍 ForenzDetektív: Generovanie Digital Asset Links SHA-256...');

if (!storePass) {
  console.log('ℹ️ Použitie:');
  console.log('   KEYSTORE_PASSWORD="moje_heslo" node scripts/generate-assetlinks.js [keystorePath] [alias]');
  console.log('   alebo: node scripts/generate-assetlinks.js <cesta_k_keystore> <alias> <store_pass> [key_pass]\n');
  process.exit(0);
}

try {
  const command = `keytool -list -v -keystore "${keystorePath}" -alias "${alias}" -storepass "${storePass}" -keypass "${keyPass}"`;
  const output = execSync(command, { encoding: 'utf8' });
  const match = output.match(/SHA256:\s*([A-F0-9:]+)/i);

  if (!match) {
    throw new Error('SHA-256 fingerprint nebol nájdený vo výstupe keytool.');
  }

  const fingerprint = match[1].trim().toUpperCase();
  const assetlinksPath = path.resolve(__dirname, '../public/.well-known/assetlinks.json');

  const assetlinksData = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'sk.forenzdetectiv.twa',
        sha256_cert_fingerprints: [fingerprint]
      }
    }
  ];

  fs.writeFileSync(assetlinksPath, JSON.stringify(assetlinksData, null, 2) + '\n', 'utf8');
  console.log(`✅ assetlinks.json bol úspešne aktualizovaný s fingerprintom:\n   ${fingerprint}`);
} catch (error) {
  console.error('❌ Chyba pri generovaní fingerprintu:', error.message);
  process.exit(1);
}
