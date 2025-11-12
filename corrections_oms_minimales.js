// ============================================================================
// CORRECTIONS MINIMALES OMS - GARDE nearbyDistance: 1 (exact même coordonnées)
// ============================================================================
//
// Corrections appliquées :
// 1. Ajout de oms.clearMarkers() pour éviter les doublons
// 2. Logique simplifiée : vérifier visibilité une seule fois
// 3. Délai de 50ms pour les événements de couches
// 4. GARDE nearbyDistance: 1 (votre choix intentionnel)
//
// ============================================================================

// Initialisation OMS - GARDE nearbyDistance: 1
oms = new OverlappingMarkerSpiderfier(maCarte, {
	keepSpiderfied: true,
	nearbyDistance: 1  // ✅ Gardé à 1 pour spiderfier UNIQUEMENT les points aux coordonnées exactes
});

// Stocker les couches de points
const couchesPoint = [];
for (let i = 0; i < tabCoucheMetier.length; i++) {
	if (tabCoucheMetier[i] && tabCoucheMetier[i][0] && tabCoucheMetier[i][0].features) {
		const hasPoints = tabCoucheMetier[i][0].features.some(feature =>
			feature.geometry && feature.geometry.type === 'Point'
		);
		if (hasPoints) {
			couchesPoint.push({index: i, layer: null});
		}
	}
}

console.log("Couches de points trouvées:", couchesPoint.length);

// ============================================================================
// FONCTION CORRIGÉE : syncOmsAvecEtatCouche
// ============================================================================
function syncOmsAvecEtatCouche() {
	// ✅ CORRECTION 1 : Nettoyer AVANT d'ajouter (évite les doublons)
	oms.clearMarkers();

	let auMoinsUneCoucheVisible = false;

	// ✅ CORRECTION 2 : Vérifier la visibilité UNE SEULE FOIS
	for (let i = 0; i < couchesPoint.length; i++) {
		const layerIndex = couchesPoint[i].index;
		if (tabCoucheMG[layerIndex] && maCarte.hasLayer(tabCoucheMG[layerIndex])) {
			auMoinsUneCoucheVisible = true;
			break;
		}
	}

	// Ajouter les bons marqueurs (UNE SEULE FOIS)
	if (auMoinsUneCoucheVisible) {
		// Couche principale visible -> utiliser les marqueurs de la couche
		markersOmsCouche.forEach(marker => {
			if (maCarte.hasLayer(marker)) {
				try {
					oms.addMarker(marker);
				} catch(e) {
					console.warn("Impossible d'ajouter le marqueur:", e);
				}
			}
		});
		console.log("Marqueurs couche ajoutés:", oms.getMarkers().length);
	} else {
		// Couche principale cachée -> utiliser les marqueurs de légende
		tabEltsMarkerLeg.forEach(marker => {
			if (maCarte.hasLayer(marker)) {
				try {
					oms.addMarker(marker);
				} catch(e) {
					console.warn("Impossible d'ajouter le marqueur:", e);
				}
			}
		});
		console.log("Marqueurs légende ajoutés:", oms.getMarkers().length);
	}
}

// Mettre à jour les références aux couches après leur création
setTimeout(() => {
	for (let i = 0; i < couchesPoint.length; i++) {
		couchesPoint[i].layer = tabCoucheMG[couchesPoint[i].index];
	}

	// Sync initial
	syncOmsAvecEtatCouche();

	// ✅ CORRECTION 3 : Ajouter délai de 50ms pour les événements
	couchesPoint.forEach(cp => {
		maCarte.on('overlayadd', (e) => {
			if (e.layer === cp.layer) {
				setTimeout(syncOmsAvecEtatCouche, 50);
			}
		});

		maCarte.on('overlayremove', (e) => {
			if (e.layer === cp.layer) {
				setTimeout(syncOmsAvecEtatCouche, 50);
			}
		});
	});

	console.log("OMS configuré. Marqueurs:", oms.getMarkers().length);
}, 100);

// Gestion des popups
var popup = new L.Popup({
	closeButton: true,
	closeOnClick: true,
	offset: new L.Point(0.5, -24)
});

oms.addListener('click', function(marker) {
	maCarte.closePopup();
	popup.setContent(marker.getPopup().getContent());
	popup.setLatLng(marker.getLatLng());
	maCarte.openPopup(popup);
});

oms.addListener('spiderfy', function(markers) {
	maCarte.closePopup();
});

// Auto-spiderfy au zoom (optionnel, peut être enlevé si pas désiré)
maCarte.on('zoomend', function() {
	const zoomActuel = maCarte.getZoom();

	if (zoomActuel >= 14) {
		// À zoom élevé, s'assurer que OMS a des marqueurs
		if (oms.getMarkers().length === 0) {
			syncOmsAvecEtatCouche();
		}
	} else {
		// À zoom faible, retirer les spider legs
		oms.unspiderfy();
	}
});

console.log("OMS initialisé avec nearbyDistance: 1px (coordonnées exactes uniquement)");
