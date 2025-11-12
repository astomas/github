// ============================================================================
// CORRECTED OMS (OverlappingMarkerSpiderfier) IMPLEMENTATION
// Replace the section from "// Initialiser OMS" to the end of syncOmsAvecEtatCouche
// ============================================================================

// 1) Initialize OMS with better settings - INCREASED nearbyDistance from 1 to 20
oms = new OverlappingMarkerSpiderfier(maCarte, {
	keepSpiderfied: true,
	nearbyDistance: 20  // Changed from 1 to 20 pixels for better overlap detection
});

// Store point layers for later reference
const couchesPoint = [];
for (let i = 0; i < tabCoucheMetier.length; i++) {
	if (tabCoucheMetier[i] && tabCoucheMetier[i][0] && tabCoucheMetier[i][0].features) {
		const hasPoints = tabCoucheMetier[i][0].features.some(feature =>
			feature.geometry && feature.geometry.type === 'Point'
		);
		if (hasPoints) {
			couchesPoint.push({index: i, layer: null});  // Will be set after tabCoucheMG is populated
		}
	}
}

console.log("Point layers found:", couchesPoint.length);

// FIXED syncOmsAvecEtatCouche function with correct logic
function syncOmsAvecEtatCouche() {
	// Always clear first
	oms.clearMarkers();

	let markersToAdd = [];
	let hasVisiblePointLayer = false;

	// Check if any point layer is visible
	for (let i = 0; i < couchesPoint.length; i++) {
		const layerIndex = couchesPoint[i].index;
		if (tabCoucheMG[layerIndex] && maCarte.hasLayer(tabCoucheMG[layerIndex])) {
			hasVisiblePointLayer = true;
			break;
		}
	}

	if (hasVisiblePointLayer) {
		// Main layer is visible - use couche markers
		markersToAdd = markersOmsCouche.filter(m => maCarte.hasLayer(m));
		console.log("Using couche markers:", markersToAdd.length);
	} else {
		// Main layer is hidden - use legend markers
		markersToAdd = tabEltsMarkerLeg.filter(m => maCarte.hasLayer(m));
		console.log("Using legend markers:", markersToAdd.length);
	}

	// Add markers to OMS
	markersToAdd.forEach(marker => {
		try {
			oms.addMarker(marker);
		} catch(e) {
			console.warn("Could not add marker to OMS:", e);
		}
	});

	console.log("Total markers in OMS:", oms.getMarkers().length);
}

// Update couchesPoint references after tabCoucheMG is created
setTimeout(() => {
	for (let i = 0; i < couchesPoint.length; i++) {
		couchesPoint[i].layer = tabCoucheMG[couchesPoint[i].index];
	}

	// Initial sync
	syncOmsAvecEtatCouche();

	// Setup event listeners for layer changes
	couchesPoint.forEach(cp => {
		maCarte.on('overlayadd', (e) => {
			if (e.layer === cp.layer) {
				setTimeout(syncOmsAvecEtatCouche, 100);
			}
		});

		maCarte.on('overlayremove', (e) => {
			if (e.layer === cp.layer) {
				setTimeout(syncOmsAvecEtatCouche, 100);
			}
		});
	});

	console.log("OMS setup complete. Markers:", oms.getMarkers().length);
}, 100);

// Setup popup handling
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

// SIMPLIFIED auto-spiderfy on zoom - let OMS handle it naturally
maCarte.on('zoomend', function() {
	const zoomActuel = maCarte.getZoom();

	if (zoomActuel >= 14) {
		// At high zoom, ensure OMS has markers
		if (oms.getMarkers().length === 0) {
			console.log("Re-syncing OMS at zoom", zoomActuel);
			syncOmsAvecEtatCouche();
		}
		// OMS will automatically spiderfy on click when markers overlap
	} else {
		// At low zoom, unspiderfy to clean up
		oms.unspiderfy();
	}
});

console.log("OMS initialized with nearbyDistance: 20px");
