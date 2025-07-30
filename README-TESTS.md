# 🧪 TESTS CHATSSELLER WIDGET - GUIDE COMPLET

## 🚀 ÉTAPES DE TEST

### **1. Installation et Build**

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier que le build fonctionne
npm run build

# 3. Démarrer le serveur de développement
npm run dev
```

### **2. Test en Local**

1. **Ouvrir dans le navigateur :**
   ```
   http://localhost:3000/test-integration.html
   ```

2. **Vérifications automatiques :**
   - ✅ Widget se charge automatiquement
   - ✅ Bouton "Parler à un conseiller" apparaît
   - ✅ Position selon configuration (au-dessus du CTA)
   - ✅ Couleur selon configuration (#007AFF)

3. **Tests manuels :**
   - Cliquer sur "🔌 Tester Chargement"
   - Cliquer sur "💬 Parler à un conseiller"
   - Tester la conversation avec l'IA

### **3. Vérifier les Erreurs**

**Console du navigateur (F12) :**
```
✅ Chargement réussi : "Widget ChatSeller chargé"
❌ Erreurs possibles : Vérifier la console
```

**Debug intégré :**
- Utiliser les boutons de debug sur la page de test
- Vérifier le JSON de configuration
- Tester la connexion API

### **4. Test avec différentes configurations**

**Modifier dans `test-integration.html` :**

```javascript
window.ChatSellerConfig = {
  shopId: "12345678-1234-1234-1234-123456789abc",
  buttonText: "🤖 Test Assistant", // Changer le texte
  primaryColor: "#FF6B6B", // Changer la couleur
  position: "below-cta", // Changer la position
  theme: "classic", // Changer le thème
  language: "en" // Changer la langue
};
```

### **5. Tests de Performance**

```bash
# Build de production
npm run build:prod

# Analyser la taille du bundle
npm run analyze

# Tester avec serveur statique
npm run serve
# Puis ouvrir http://localhost:8080/test-integration.html
```

**Métriques à vérifier :**
- ✅ Bundle < 100KB
- ✅ Chargement < 3 secondes
- ✅ Pas d'erreurs console

---

## 🛠️ RÉSOLUTION DE PROBLÈMES

### **Widget ne se charge pas**

1. **Vérifier le serveur :**
   ```bash
   npm run dev
   # Doit afficher : "Local: http://localhost:3000/"
   ```

2. **Vérifier la console :**
   - F12 → Console
   - Rechercher erreurs en rouge

3. **Vérifier la configuration :**
   ```javascript
   console.log(window.ChatSellerConfig);
   // Doit afficher l'objet de configuration
   ```

### **API non accessible**

1. **Tester l'API :**
   ```bash
   curl https://chatseller-api-production.up.railway.app/health
   ```

2. **Vérifier les variables d'environnement :**
   ```bash
   cat .env
   # VITE_API_URL doit être défini
   ```

### **Widget mal positionné**

1. **Changer la position :**
   ```javascript
   // Dans test-integration.html
   position: "above-cta" // ou "below-cta" ou "beside-cta"
   ```

2. **Forcer rechargement :**
   ```javascript
   window.testChatSeller.reload()
   ```

---

## 📊 CHECKLIST DE VALIDATION

### **✅ Tests Fonctionnels**
- [ ] Widget se charge sans erreur
- [ ] Bouton apparaît avec bon texte et couleur
- [ ] Position correcte (au-dessus/en-dessous/à côté du CTA)
- [ ] Chat s'ouvre au clic
- [ ] Conversation fonctionne avec l'IA
- [ ] Responsive mobile/desktop

### **✅ Tests Techniques**
- [ ] Bundle < 100KB
- [ ] Pas d'erreurs console
- [ ] API accessible
- [ ] Configuration correctement lue
- [ ] Analytics/tracking fonctionnel

### **✅ Tests UX**
- [ ] Chargement fluide
- [ ] Animations fluides
- [ ] Chat moderne et attractif
- [ ] Pas de conflit CSS avec la page

---

## 🎯 PROCHAINES ÉTAPES

1. **Si tous les tests passent :**
   ```bash
   npm run deploy:prepare
   ```

2. **Déploiement sur CDN :**
   - Upload `dist/chatseller-widget.js` sur widget.chatseller.app
   - Tester avec l'URL de production

3. **Test sur vraie boutique Shopify :**
   - Intégrer le code dans un thème Shopify
   - Vérifier avec un agent IA réel du Dashboard

---

## 💡 COMMANDES UTILES

```bash
# Développement
npm run dev                 # Serveur de développement
npm run build              # Build de test
npm run build:prod         # Build de production
npm run test:widget        # Test complet (build + serve)

# Debug
npm run analyze            # Analyser la taille du bundle
npm run serve              # Serveur statique pour test build
npm run clean              # Nettoyer cache et dist

# Format et qualité
npm run lint               # Vérifier le code
npm run format             # Formater le code
npm run type-check         # Vérifier TypeScript
```

---

**🎯 Objectif :** Valider que le widget fonctionne parfaitement avant déploiement en production !