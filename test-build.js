// test-build.js - VALIDATION BUILD WIDGET
const fs = require('fs')
const path = require('path')

console.log('🧪 Test de validation du build ChatSeller Widget\n')

// ✅ VÉRIFICATION FICHIERS GÉNÉRÉS
const distDir = path.join(__dirname, 'dist')
const embedFile = path.join(distDir, 'embed.js')

console.log('📂 Vérification fichiers build...')

if (!fs.existsSync(distDir)) {
  console.error('❌ Dossier dist/ manquant')
  process.exit(1)
}

if (!fs.existsSync(embedFile)) {
  console.error('❌ Fichier embed.js manquant')
  process.exit(1)
}

console.log('✅ Fichier embed.js trouvé')

// ✅ VÉRIFICATION QU'IL N'Y A PAS DE CSS SÉPARÉ
const cssFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.css'))
const styleFiles = fs.readdirSync(distDir).filter(file => file.includes('style.') && file.endsWith('.js'))

if (cssFiles.length > 0) {
  console.log('❌ Fichiers CSS séparés détectés:', cssFiles)
  console.log('   Le CSS doit être inline dans embed.js')
  allPassed = false
} else {
  console.log('✅ Pas de CSS séparé (correct)')
}

if (styleFiles.length > 0) {
  console.log('❌ Fichiers style.js détectés:', styleFiles)
  console.log('   Tout doit être dans embed.js uniquement')
  allPassed = false
} else {
  console.log('✅ Pas de style.js séparé (correct)')
}

// ✅ VÉRIFICATION CONTENU
const embedContent = fs.readFileSync(embedFile, 'utf8')

const checks = [
  { name: 'Vue inclus', pattern: /(Vue|createApp|vue)/i, required: true },
  { name: 'ChatSeller classe', pattern: /(class ChatSeller|function ChatSeller|ChatSeller.*class)/i, required: true },
  { name: 'CSS injecté', pattern: /(cs-chatseller-widget|getCompleteCSS)/i, required: true },
  { name: 'IIFE auto-exécution', pattern: /(\(\(\)=>\{|\(function\(\)\{)/i, required: true },
  { name: 'Code minifié/transpilé', pattern: /([a-z]\.[a-z]{2,}|[a-z]{1,2}=[a-z]{1,2}\+|var [a-z]+=[a-z]+)/i, required: true },
  { name: 'Window.ChatSeller', pattern: /(window.*ChatSeller|ChatSeller.*window)/i, required: true },
  { name: 'Auto-init DOM', pattern: /(DOMContentLoaded|readyState)/i, required: true }
]

console.log('\n🔍 Vérification contenu build...')

let checksAllPassed = true

checks.forEach(check => {
  const found = check.pattern.test(embedContent)
  const status = found ? '✅' : (check.required ? '❌' : '⚠️')
  console.log(`${status} ${check.name}: ${found ? 'OK' : 'MANQUANT'}`)
  
  if (check.required && !found) {
    checksAllPassed = false
  }
})

// ✅ VÉRIFICATION SUPPLÉMENTAIRE - PAS D'EXPORTS ES6 PROBLÉMATIQUES
const hasProblematicExports = /export \{|module\.exports/i.test(embedContent)
if (hasProblematicExports) {
  console.log('❌ Exports ES6 détectés (problématique pour IIFE)')
  checksAllPassed = false
} else {
  console.log('✅ Pas d\'exports ES6 (correct pour widget embeddable)')
}

// ✅ MISE À JOUR DE LA VARIABLE GLOBALE
if (!checksAllPassed) {
  allPassed = false
}

// ✅ TAILLE FICHIER
const fileSize = fs.statSync(embedFile).size
const fileSizeKB = Math.round(fileSize / 1024)
console.log(`\n📊 Taille fichier: ${fileSizeKB} KB`)

if (fileSizeKB > 800) {
  console.log('⚠️ Fichier volumineux (>800KB), optimisation recommandée')
} else if (fileSizeKB < 100) {
  console.log('❌ Fichier trop petit, build incomplet possible')
  allPassed = false
} else {
  console.log('✅ Taille acceptable')
}

// ✅ STRUCTURE HTML TEST
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Widget ChatSeller</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .product-form__buttons {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 32px;
        }
        .btn-primary {
            background: #1f2937;
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        .product__title {
            font-size: 2.5rem;
            margin: 0 0 16px 0;
            color: #1f2937;
        }
        .price__current .money {
            font-size: 2rem;
            font-weight: 700;
            color: #16a34a;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Test Widget ChatSeller - Build</h1>
        <p>Widget généré automatiquement pour tester le build</p>
        
        <h2 class="product__title">Produit de Test Build</h2>
        <div class="price__current">
            <span class="money">99,99 €</span>
        </div>
        
        <div class="product-form__buttons">
            <!-- ✅ Widget sera inséré ici -->
            <button class="btn-primary">Ajouter au panier - 99,99 €</button>
        </div>
    </div>

    <script>
        window.ChatSellerConfig = {
            shopId: 'test-build',
            productName: 'Produit de Test Build',
            productPrice: 9999,
            agentConfig: {
                name: 'TestBot',
                title: 'Assistant Test Build'
            }
        };
    </script>
    <script src="./embed.js"></script>
</body>
</html>
`

const testFile = path.join(distDir, 'test.html')
fs.writeFileSync(testFile, testHTML)
console.log('✅ Fichier test.html généré dans dist/')

// ✅ COPIER LES FICHIERS DE TEST EXISTANTS
const testFiles = [
  'test-local-shopify.html',
  'test-direct.html',
  'index.html'
]

testFiles.forEach(fileName => {
  const sourceFile = path.join(__dirname, fileName)
  const destFile = path.join(distDir, fileName)
  
  if (fs.existsSync(sourceFile)) {
    let content = fs.readFileSync(sourceFile, 'utf8')
    
    // ✅ CORRIGER LES CHEMINS VERS LE SCRIPT WIDGET
    content = content.replace(/src=".*embed\.js"/g, 'src="./embed.js"')
    content = content.replace(/http:\/\/localhost:3000\/src\/embed\.ts/g, './embed.js')
    content = content.replace(/\.\/dist\/embed\.js/g, './embed.js')
    
    fs.writeFileSync(destFile, content)
    console.log(`✅ ${fileName} copié et corrigé dans dist/`)
  } else {
    console.log(`⚠️ ${fileName} non trouvé (normal si inexistant)`)
  }
})

// ✅ RÉSULTAT FINAL - UTILISATION DE LA BONNE VARIABLE  
const finalResult = allPassed && checksAllPassed

console.log(`\n${finalResult ? '✅' : '❌'} Build ${finalResult ? 'VALIDE' : 'INVALIDE'}`)

if (finalResult) {
  console.log('\n🎉 Le widget est prêt pour la production !')
  console.log('\n📝 Instructions de test:')
  console.log('   1. npm run preview')
  console.log('   2. Ouvrir dans le navigateur:')
  console.log('      • http://localhost:3000/test.html')
  console.log('      • http://localhost:3000/test-local-shopify.html')
  console.log('      • http://localhost:3000/index.html')
  console.log('   3. Vérifier que le bouton widget apparaît')
  console.log('   4. Tester l\'ouverture du modal')
  console.log('\n🚀 Widget prêt pour la production: dist/embed.js')
} else {
  console.log('\n❌ Erreurs détectées - vérifiez la configuration')
  process.exit(1)
}