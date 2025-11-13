# Explication : Déclenchement Automatique du Spider

## 🎯 Le Problème

Mon premier code **supprimait** la fonctionnalité de déclenchement automatique du spider au zoom > 14.

### ❌ Code que j'avais donné (INCOMPLET)
```javascript
maCarte.on('zoomend', function() {
    const zoomActuel = maCarte.getZoom();

    if (zoomActuel >= 14) {
        // ❌ Vérifie juste que OMS a des marqueurs
        if (oms.getMarkers().length === 0) {
            syncOmsAvecEtatCouche();
        }
    } else {
        oms.unspiderfy();
    }
});
```

**Résultat** : Au zoom 14+, rien ne se passe automatiquement. Il faut cliquer sur les marqueurs.

---

## ✅ La Solution

### ✅ Code CORRIGÉ (avec auto-déclenchement)
```javascript
maCarte.on('zoomend', function() {
    const zoomActuel = maCarte.getZoom();

    if (zoomActuel >= 14) {
        // ✅ Déclenchement automatique du spider
        const markers = oms.getMarkers();
        const dejaTraites = new Set();
        const seuilDistanceSq = 1 * 1;

        markers.forEach(marker => {
            if (dejaTraites.has(marker) || !maCarte.hasLayer(marker)) return;

            const ptMarker = maCarte.latLngToLayerPoint(marker.getLatLng());
            let groupe = [];
            let autresMarkers = [];

            // Trouver les marqueurs superposés
            markers.forEach(m => {
                if (dejaTraites.has(m)) return;

                const ptM = maCarte.latLngToLayerPoint(m.getLatLng());
                const distSq = Math.pow(ptMarker.x - ptM.x, 2) +
                              Math.pow(ptMarker.y - ptM.y, 2);

                if (distSq <= seuilDistanceSq) {
                    groupe.push({ marker: m, markerPt: ptM });
                    dejaTraites.add(m);
                } else {
                    autresMarkers.push(m);
                }
            });

            // ✅ Cette ligne déclenche AUTOMATIQUEMENT le spider
            if (groupe.length > 1) {
                oms.spiderfy(groupe, autresMarkers);
            }
        });
    } else {
        oms.unspiderfy();
    }
});
```

**Résultat** : Au zoom 14+, le spider se déploie **automatiquement** sans clic.

---

## 📊 Comportement Attendu

### Zoom < 12
- Plugin désactivé (selon modification CD30 dans spiderfy.js)
- Clic sur marqueur = clic normal (pas de spider)

### Zoom 12-13
- Plugin actif
- Clic sur marqueur = spider se déploie
- **Pas de déclenchement automatique**

### Zoom >= 14
- Plugin actif
- **✅ DÉCLENCHEMENT AUTOMATIQUE** : dès qu'on zoome, tous les groupes de marqueurs superposés se spiderfient automatiquement
- Pas besoin de cliquer

---

## 🐛 Corrections Appliquées

Le code original avait 2 problèmes :

### Problème 1 : Pas de `clearMarkers()`
**Symptôme** : Au toggle de couche, les marqueurs se dupliquaient
**Fix** : Ajout de `oms.clearMarkers()` dans `syncOmsAvecEtatCouche()`

### Problème 2 : Boucle ajoutait plusieurs fois
**Symptôme** : Si 2 couches points, chaque marqueur × 2
**Fix** : Vérifier visibilité une fois, ajouter marqueurs une fois

### ✅ Gardé : Déclenchement automatique au zoom >= 14
**C'était voulu !** Le code automatique est gardé mais **corrigé** pour éviter les doublons.

---

## 🔄 Différence Entre les 2 Fichiers

| Fichier | Déclenchement Auto | Usage |
|---------|-------------------|-------|
| `corrections_oms_minimales.js` | ❌ NON | Si vous voulez que le spider se déclenche UNIQUEMENT au clic |
| `corrections_oms_avec_auto_spider.js` | ✅ OUI | Si vous voulez que le spider se déclenche automatiquement au zoom >= 14 |

---

## 🚀 Quel Fichier Utiliser ?

### Utilisez `corrections_oms_avec_auto_spider.js` si :
- ✅ Vous voulez que le spider se déploie automatiquement quand on zoome >= 14
- ✅ C'est le comportement de votre code original (modif CD30)
- ✅ **C'est probablement ce que vous voulez**

### Utilisez `corrections_oms_minimales.js` si :
- Vous voulez que le spider se déclenche UNIQUEMENT au clic
- Vous ne voulez PAS de déclenchement automatique

---

## 💡 Exemple Visuel

### Scénario : COLLEGE DIDEROT ALES (3 chantiers aux mêmes coordonnées)

#### Avec `corrections_oms_minimales.js` :
1. Zoom à 15 → Rien ne se passe
2. Clic sur marqueur → Spider se déploie en 3 branches
3. ✅ Fonctionne mais nécessite un clic

#### Avec `corrections_oms_avec_auto_spider.js` :
1. Zoom à 15 → **Spider se déploie automatiquement** en 3 branches
2. Pas besoin de cliquer
3. ✅ C'est automatique !

---

## 📝 À Retenir

- **nearbyDistance: 1** est gardé dans les 2 fichiers
- **Les 3 bugs** sont corrigés dans les 2 fichiers
- **La seule différence** : déclenchement automatique au zoom >= 14

**Utilisez `corrections_oms_avec_auto_spider.js` pour retrouver le comportement original !**
