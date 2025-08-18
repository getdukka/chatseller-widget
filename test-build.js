#!/usr/bin/env node

// test-build.js - SCRIPT DE VÉRIFICATION DU BUILD
const fs = require('fs');
const path = require('path');

console.log('🔧 ChatSeller Widget - Vérification du build...\n');

const distDir = path.join(__dirname, 'dist');
const requiredFiles = [
  'embed.js',
  'index.html'
];

// Vérifier que le dossier dist existe
if (!fs.existsSync(distDir)) {
  console.log('❌ Dossier dist/ introuvable');
  console.log('   Exécutez: npm run build');
  process.exit(1);
}

console.log('✅ Dossier dist/ trouvé');

// Vérifier les fichiers requis
let allFilesOk = true;

requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${file} (${sizeKB} KB)`);
  } else {
    console.log(`❌ ${file} manquant`);
    allFilesOk = false;
  }
});

// Vérifier le contenu d'embed.js
const embedPath = path.join(distDir, 'embed.js');
if (fs.existsSync(embedPath)) {
  const content = fs.readFileSync(embedPath, 'utf8');
  
  const checks = [
    { name: 'ChatSeller global', test: content.includes('ChatSeller') },
    { name: 'init function', test: content.includes('init') },
    { name: 'IIFE format', test: content.startsWith('(function()') || content.includes('!function') },
    { name: 'Minified', test: content.length > 10000 }
  ];
  
  console.log('\n📋 Vérification contenu embed.js:');
  checks.forEach(check => {
    console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
    if (!check.test) allFilesOk = false;
  });
}

// Lister tous les fichiers générés
console.log('\n📁 Fichiers dans dist/:');
const listFiles = (dir, prefix = '') => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`${prefix}📁 ${file}/`);
      listFiles(filePath, prefix + '  ');
    } else {
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`${prefix}📄 ${file} (${sizeKB} KB)`);
    }
  });
};

listFiles(distDir);

// Test de chargement basique
console.log('\n🧪 Test de chargement:');
if (fs.existsSync(embedPath)) {
  try {
    const embedContent = fs.readFileSync(embedPath, 'utf8');
    console.log('✅ embed.js peut être lu');
    console.log(`📊 Taille: ${Math.round(embedContent.length / 1024)} KB`);
  } catch (error) {
    console.log('❌ Erreur lecture embed.js:', error.message);
    allFilesOk = false;
  }
}

// Résultat final
console.log('\n' + '='.repeat(50));
if (allFilesOk) {
  console.log('🎉 BUILD VALIDE - Prêt pour le déploiement!');
  console.log('🚀 Vous pouvez déployer sur Vercel');
  console.log('🔗 URL: https://widget.chatseller.app/embed.js');
} else {
  console.log('❌ BUILD INVALIDE - Problèmes détectés');
  console.log('🔧 Corrigez les erreurs ci-dessus');
}
console.log('='.repeat(50));

process.exit(allFilesOk ? 0 : 1);