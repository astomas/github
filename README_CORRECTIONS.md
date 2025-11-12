# Corrections OMS - Points aux Mêmes Coordonnées

## 🎯 Objectif

Corriger le spiderfier pour les marqueurs ayant **exactement** les mêmes coordonnées GPS (nearbyDistance: 1).

## 🐛 Les 3 Bugs Corrigés

1. **Pas de `oms.clearMarkers()`** → Marqueurs dupliqués
2. **Boucle ajoute plusieurs fois** → Chaque marqueur × nombre de couches
3. **Timing des événements** → Sync trop tôt, résultats erratiques

## 📁 Fichiers

- **`corrections_oms_minimales.js`** → Code corrigé, copier-coller dans votre HTML
- **`CORRECTIONS_EXPLIQUEES.md`** → Explications détaillées en français
- **`README_CORRECTIONS.md`** → Ce fichier

## ⚙️ Configuration

```javascript
nearbyDistance: 1  // ✅ Gardé à 1 (votre choix intentionnel)
```

Spiderfie **UNIQUEMENT** les points aux coordonnées GPS exactes.

## 🚀 Application Rapide

1. Ouvrir votre fichier HTML
2. Chercher : `oms = new OverlappingMarkerSpiderfier(`
3. Remplacer toute la section OMS par le code de `corrections_oms_minimales.js`
4. Tester sur COLLEGE DIDEROT ALES (3 chantiers aux mêmes coordonnées)

## ✅ Test Rapide

```
Clic sur marqueur COLLEGE DIDEROT ALES
→ 3 branches spider doivent apparaître
→ Chaque branche = 1 chantier différent
```

## 📊 Exemples de Sites avec Marqueurs Superposés

- COLLEGE ROMAIN ROLLAND : 2 chantiers
- COLLEGE LE MOURION : 2 chantiers
- COLLEGE DAUDET : 2 chantiers
- COLLEGE DIDEROT ALES : 3 chantiers
- COLLEGE JEAN MOULIN : 2 chantiers
- COLLEGE JEAN RACINE : 2 chantiers
- COLLEGE LA REVOLUTION : 4 chantiers

Tous ces sites doivent maintenant afficher correctement leurs multiples chantiers via spider legs.
