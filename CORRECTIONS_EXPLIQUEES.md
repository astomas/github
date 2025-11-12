# Corrections OMS - Explications en Français

## 🎯 Votre Configuration Intentionnelle

**nearbyDistance: 1** → Vous voulez spiderfier UNIQUEMENT les points ayant **exactement** les mêmes coordonnées GPS.

✅ **Cette configuration est respectée dans les corrections.**

---

## 🐛 Les 3 Vrais Bugs Identifiés

### Bug #1 : Pas de nettoyage avant réajout

**Code original :**
```javascript
function syncOmsAvecEtatCouche() {
  // ❌ Manque : oms.clearMarkers()

  for (let i = 0; i < couchesPoint.length; i++) {
    const visible = maCarte.hasLayer(couchesPoint[i][0]);

    if (!visible) {
      for (var i = 0; i < tabEltsMarkerLeg.length; i++) {
        oms.addMarker(tabEltsMarkerLeg[i]);
      }
    } else {
      for (var j = 0; j < markersOmsCouche.length; j++) {
        oms.addMarker(markersOmsCouche[j]);
      }
    }
  }
}
```

**Problème :**
- Chaque appel à `syncOmsAvecEtatCouche()` **AJOUTE** des marqueurs
- Les anciens marqueurs ne sont jamais enlevés
- Résultat : **doublons, triplons, etc.** dans OMS

**Solution :**
```javascript
function syncOmsAvecEtatCouche() {
  oms.clearMarkers(); // ✅ Nettoyer AVANT d'ajouter

  // ... reste du code
}
```

---

### Bug #2 : Boucle qui ajoute les marqueurs plusieurs fois

**Code original :**
```javascript
for (let i = 0; i < couchesPoint.length; i++) {  // Boucle sur couches
  const visible = maCarte.hasLayer(couchesPoint[i][0]);

  if (!visible) {
    // ❌ Ajoute TOUS les marqueurs de légende à chaque itération !
    for (var i = 0; i < tabEltsMarkerLeg.length; i++) {
      oms.addMarker(tabEltsMarkerLeg[i]);
    }
  } else {
    // ❌ Ajoute TOUS les marqueurs de couche à chaque itération !
    for (var j = 0; j < markersOmsCouche.length; j++) {
      oms.addMarker(markersOmsCouche[j]);
    }
  }
}
```

**Problème :**
- Si vous avez 2 couches de points, la boucle tourne 2 fois
- À chaque tour, on ajoute **TOUS** les marqueurs
- Résultat : chaque marqueur est ajouté 2 fois (ou plus)

**Solution :**
```javascript
function syncOmsAvecEtatCouche() {
  oms.clearMarkers();

  let auMoinsUneCoucheVisible = false;

  // ✅ Étape 1 : Vérifier la visibilité UNE FOIS
  for (let i = 0; i < couchesPoint.length; i++) {
    if (maCarte.hasLayer(couchesPoint[i].layer)) {
      auMoinsUneCoucheVisible = true;
      break; // On arrête dès qu'on trouve une couche visible
    }
  }

  // ✅ Étape 2 : Ajouter les marqueurs UNE SEULE FOIS
  if (auMoinsUneCoucheVisible) {
    markersOmsCouche.forEach(m => oms.addMarker(m));
  } else {
    tabEltsMarkerLeg.forEach(m => oms.addMarker(m));
  }
}
```

---

### Bug #3 : Problème de timing avec les événements

**Code original :**
```javascript
maCarte.on('overlayadd', (e) => {
  if (e.layer === couchesPoint[i][0]) {
    syncOmsAvecEtatCouche(); // ❌ Appelé TROP TÔT
  }
});
```

**Problème :**
- L'événement `overlayadd` se déclenche **pendant** l'ajout de la couche
- La couche n'est pas encore complètement rendue sur la carte
- `maCarte.hasLayer(...)` peut retourner des résultats incorrects

**Solution :**
```javascript
maCarte.on('overlayadd', (e) => {
  if (e.layer === couchesPoint[i][0]) {
    setTimeout(syncOmsAvecEtatCouche, 50); // ✅ Attendre 50ms
  }
});
```

---

## 📋 Exemple Concret : COLLEGE DIDEROT ALES

### Données :
```javascript
// 3 chantiers aux MÊMES coordonnées [4.078478, 44.13231]
{"Id chantier": "CHT25-027-LOG", ...}
{"Id chantier": "CHT25-028-PIN", ...}
{"Id chantier": "CHT25-030-TOI", ...}
```

### Avec les bugs :
1. ❌ Clic sur le marqueur → Rien ne se passe OU popup d'un seul chantier
2. ❌ OMS contient 6 ou 9 marqueurs au lieu de 3 (doublons)
3. ❌ Toggle de la couche → comportement erratique

### Avec les corrections :
1. ✅ Clic sur le marqueur → Spider legs apparaissent
2. ✅ 3 branches visibles, une pour chaque chantier
3. ✅ Clic sur chaque branche → popup du bon chantier
4. ✅ Toggle de la couche → fonctionne correctement

---

## 🔧 Comment Appliquer les Corrections

### Option 1 : Remplacement complet (recommandé)

1. Ouvrez votre fichier HTML
2. Trouvez cette ligne (vers ligne 733) :
   ```javascript
   oms = new OverlappingMarkerSpiderfier(maCarte, {
   ```
3. Remplacez tout le code OMS jusqu'à la fin du `maCarte.on('zoomend', ...)` par le contenu de **`corrections_oms_minimales.js`**

### Option 2 : Corrections manuelles

Si vous préférez corriger manuellement, appliquez ces 3 changements :

**1. Dans `syncOmsAvecEtatCouche()` :**
```javascript
function syncOmsAvecEtatCouche() {
  oms.clearMarkers(); // ← AJOUTER CETTE LIGNE

  // ... reste du code original
}
```

**2. Simplifier la boucle :**
Remplacer toute la fonction par la version dans `corrections_oms_minimales.js`

**3. Dans les événements :**
```javascript
// REMPLACER :
syncOmsAvecEtatCouche();

// PAR :
setTimeout(syncOmsAvecEtatCouche, 50);
```

---

## ✅ Tests à Faire Après Correction

### Test 1 : Marqueurs aux mêmes coordonnées
1. Ouvrir la carte
2. Zoomer sur COLLEGE DIDEROT ALES (3 chantiers)
3. Cliquer sur le marqueur
4. **Résultat attendu** : 3 branches spider apparaissent

### Test 2 : Toggle couche
1. Décocher la couche principale
2. Les marqueurs de légende apparaissent
3. Cliquer sur un marqueur avec plusieurs chantiers
4. **Résultat attendu** : Spider fonctionne toujours

### Test 3 : Console
1. Ouvrir la console développeur (F12)
2. Vérifier les messages :
   - "Couches de points trouvées: X"
   - "Marqueurs couche ajoutés: Y" OU "Marqueurs légende ajoutés: Y"
3. **Résultat attendu** : Pas d'erreurs JavaScript

### Test 4 : Pas de doublons
1. Console ouverte
2. Toggle la couche plusieurs fois (cocher/décocher)
3. Vérifier que le nombre de marqueurs reste constant
4. **Résultat attendu** : Pas d'augmentation du nombre de marqueurs

---

## 📊 Résumé des Corrections

| Bug | Impact | Correction | Difficulté |
|-----|--------|------------|------------|
| Pas de `clearMarkers()` | Doublons de marqueurs | Ajouter 1 ligne | ⭐ Facile |
| Boucle ajoute en double | Marqueurs × nombre de couches | Refactoriser fonction | ⭐⭐ Moyen |
| Timing événements | Comportement erratique | Ajouter `setTimeout` | ⭐ Facile |

---

## 🎯 Configuration Finale

```javascript
oms = new OverlappingMarkerSpiderfier(maCarte, {
    keepSpiderfied: true,
    nearbyDistance: 1  // ✅ Gardé à 1 comme vous le voulez
});
```

**Cette configuration spiderfie uniquement les marqueurs ayant EXACTEMENT les mêmes coordonnées GPS.**

---

## 📞 Besoin d'Aide ?

Si vous avez des questions ou des problèmes après avoir appliqué les corrections :

1. Ouvrez la console développeur (F12)
2. Copiez les messages d'erreur
3. Vérifiez que `spiderfy.js` est bien chargé
4. Testez dans un autre navigateur (Chrome, Firefox)

---

**Fichiers créés :**
- ✅ `corrections_oms_minimales.js` - Code corrigé prêt à l'emploi
- ✅ `CORRECTIONS_EXPLIQUEES.md` - Ce document d'explication
