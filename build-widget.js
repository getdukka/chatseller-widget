#!/usr/bin/env node

// build-widget.js - Script de build personnalisé pour le widget
const fs = require('fs');
const path = require('path');

console.log('🔧 Construction du widget ChatSeller...');

// ✅ LECTURE DU CSS
const cssPath = path.join(__dirname, 'src', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// ✅ LECTURE DU CODE VUE
const vuePath = path.join(__dirname, 'src', 'ChatSellerWidget.vue');
const vueContent = fs.readFileSync(vuePath, 'utf8');

// ✅ LECTURE DE EMBED.TS
const embedPath = path.join(__dirname, 'src', 'embed.ts');
let embedContent = fs.readFileSync(embedPath, 'utf8');

// ✅ TEMPLATE DU WIDGET FINAL
const widgetTemplate = `
// ChatSeller Widget - Version compilée
(function() {
    'use strict';
    
    // ✅ CSS INLINE
    const CSS = \`${cssContent.replace(/`/g, '\\`')}\`;
    
    // ✅ INJECTION CSS
    function injectCSS() {
        if (document.getElementById('chatseller-widget-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'chatseller-widget-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    
    // ✅ WIDGET CLASS
    ${embedContent
        .replace(/import.*from.*['"].*['"];?/g, '') // Supprime les imports
        .replace(/export.*$/m, '') // Supprime les exports
        .replace(/import.*['"].*style\.css['"];?/g, '') // Supprime l'import CSS
    }
    
    // ✅ AUTO-INIT
    document.addEventListener('DOMContentLoaded', () => {
        injectCSS();
        
        if (window.ChatSellerConfig && !window.ChatSeller.isReady) {
            window.ChatSeller.init(window.ChatSellerConfig);
        }
    });
    
    // ✅ FALLBACK
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            injectCSS();
            
            if (window.ChatSellerConfig && !window.ChatSeller.isReady) {
                window.ChatSeller.init(window.ChatSellerConfig);
            }
        }, 100);
    }
})();
`;

// ✅ CRÉATION DU DOSSIER DIST
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// ✅ ÉCRITURE DU FICHIER FINAL
const outputPath = path.join(distDir, 'embed.js');
fs.writeFileSync(outputPath, widgetTemplate, 'utf8');

console.log('✅ Widget construit avec succès:');
console.log(`   📁 ${outputPath}`);
console.log(`   📏 Taille: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

// ✅ CRÉATION DU FICHIER DE TEST
const testTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Widget Build</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
        .product-form__buttons { margin: 20px 0; }
        .btn { background: #1f2937; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin: 8px 0; width: 100%; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Widget ChatSeller</h1>
        <p>Produit test avec widget intégré</p>
        
        <div class="product-form__buttons">
            <!-- Le widget sera inséré ici -->
            <button class="btn">Ajouter au panier</button>
        </div>
    </div>

    <script>
        window.ChatSellerConfig = {
            shopId: 'demo',
            productName: 'Produit Test',
            productPrice: 29900,
            agentConfig: {
                name: 'Anna',
                title: 'Vendeuse IA'
            },
            primaryColor: '#EC4899',
            buttonText: 'Parler à la vendeuse'
        };
    </script>
    <script src="./embed.js"></script>
</body>
</html>
`;

const testPath = path.join(distDir, 'test.html');
fs.writeFileSync(testPath, testTemplate, 'utf8');

console.log(`   🧪 Test: ${testPath}`);
console.log('');
console.log('🚀 Pour tester: ouvrir dist/test.html dans le navigateur');