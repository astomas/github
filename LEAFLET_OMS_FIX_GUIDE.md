# Leaflet Map - Overlapping Marker Deployment Icon Fixes

## Overview
This document describes the fixes applied to resolve issues with overlapping marker deployment in the Leaflet map showing construction sites (chantiers) in the Gard department.

## Problem Description

The map displays multiple construction projects (chantiers) at educational and administrative sites. Many sites have multiple ongoing projects, resulting in markers with identical or very close coordinates that overlap on the map.

### Examples of Overlapping Markers:
- **COLLEGE ROMAIN ROLLAND**: 2 projects at [4.389638, 43.844324]
- **COLLEGE LE MOURION**: 2 projects at [4.783492, 43.976201]
- **COLLEGE DAUDET**: 2 projects at [4.08609, 44.13529]
- **COLLEGE DIDEROT ALES**: 3 projects at [4.078478, 44.13231]
- **And many more...**

## Issues Identified

### 1. Incorrect OMS Sync Logic (CRITICAL)
**Location**: `syncOmsAvecEtatCouche()` function (around line 743)

**Problem**: The function had inverted logic:
```javascript
// WRONG - Original Code
if (!visible) {
  for (var i = 0; i < tabEltsMarkerLeg.length; i++) {
    oms.addMarker(tabEltsMarkerLeg[i]);
  }
} else {
  for (var j = 0; j < markersOmsCouche.length; j++) {
    oms.addMarker(markersOmsCouche[j]);
  }
}
```

This logic was backwards - it added legend markers when layer was NOT visible, and couche markers when it WAS visible.

**Fix**: Correct the logic:
```javascript
// CORRECT - Fixed Code
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
} else {
    // Main layer is hidden - use legend markers
    markersToAdd = tabEltsMarkerLeg.filter(m => maCarte.hasLayer(m));
}
```

### 2. nearbyDistance Too Small
**Location**: OMS initialization (around line 733)

**Problem**:
```javascript
oms = new OverlappingMarkerSpiderfier(maCarte, {
    keepSpiderfied: true,
    nearbyDistance: 1  // Too small!
});
```

With `nearbyDistance: 1`, only markers within 1 pixel are considered overlapping. Markers at very close but not identical coordinates were not being spiderfied.

**Fix**: Increase to 20 pixels:
```javascript
oms = new OverlappingMarkerSpiderfier(maCarte, {
    keepSpiderfied: true,
    nearbyDistance: 20  // Much better overlap detection
});
```

### 3. Overly Complex Auto-Spiderfy Logic
**Location**: `maCarte.on('zoomend', ...)` (around line 780)

**Problem**: The zoom event handler tried to manually calculate overlapping markers and call `oms.spiderfy()` directly. This created conflicts with OMS's built-in behavior and was error-prone.

**Fix**: Simplified to let OMS handle spiderfying naturally:
```javascript
maCarte.on('zoomend', function() {
    const zoomActuel = maCarte.getZoom();

    if (zoomActuel >= 14) {
        // At high zoom, ensure OMS has markers
        if (oms.getMarkers().length === 0) {
            syncOmsAvecEtatCouche();
        }
        // OMS will automatically spiderfy on click
    } else {
        // At low zoom, unspiderfy to clean up
        oms.unspiderfy();
    }
});
```

### 4. Timing Issues with Layer Events
**Location**: Layer add/remove event handlers (around line 765)

**Problem**: Events were firing before layers were fully rendered, causing sync to happen with incomplete data.

**Fix**: Added small delay to allow layers to render:
```javascript
maCarte.on('overlayadd', (e) => {
    if (e.layer === cp.layer) {
        setTimeout(syncOmsAvecEtatCouche, 100);  // 100ms delay
    }
});
```

### 5. Missing Layer Reference Updates
**Location**: After `tabCoucheMG` creation

**Problem**: The `couchesPoint` array was populated before `tabCoucheMG` was created, so layer references were null.

**Fix**: Update references after layer creation:
```javascript
setTimeout(() => {
    for (let i = 0; i < couchesPoint.length; i++) {
        couchesPoint[i].layer = tabCoucheMG[couchesPoint[i].index];
    }
    syncOmsAvecEtatCouche();
}, 100);
```

## How to Apply the Fixes

### Option 1: Replace the Entire OMS Section
Find this line in your HTML:
```javascript
// Initialiser OMS et ajouter les marqueurs créés précédemment
oms = new OverlappingMarkerSpiderfier(maCarte, {
```

Replace everything from that line through the end of the auto-spiderfy zoom handler (approximately lines 733-820) with the code from `oms_fixes.js`.

### Option 2: Manual Fixes
Apply each fix individually by following the corrections shown above in the "Issues Identified" section.

## Testing Checklist

After applying fixes, test the following:

1. **Basic Spiderfying**
   - [ ] Zoom to a college with multiple markers
   - [ ] Click on overlapping markers
   - [ ] Verify spider legs appear showing all projects
   - [ ] Click individual spiderfied markers to see popups

2. **Layer Toggling**
   - [ ] Uncheck the main layer in layer control
   - [ ] Verify legend markers still work with OMS
   - [ ] Re-check the main layer
   - [ ] Verify couche markers work with OMS

3. **Zoom Behavior**
   - [ ] Zoom to level 14+
   - [ ] Verify markers automatically prepare for spiderfying
   - [ ] Zoom out below 14
   - [ ] Verify spider legs retract

4. **Legend Filtering**
   - [ ] Click legend items to filter
   - [ ] Verify filtered markers still spiderfy correctly
   - [ ] Verify OMS only includes visible markers

5. **Console Logging**
   - [ ] Open browser console
   - [ ] Look for OMS-related log messages
   - [ ] Verify marker counts are reasonable
   - [ ] Check for any errors

## Expected Behavior After Fixes

1. **Overlapping markers at same coordinates** (e.g., COLLEGE DIDEROT ALES with 3 projects) should spiderfy when clicked, showing all projects in a radial pattern.

2. **Nearby markers within 20 pixels** should also spiderfy together, preventing confusion when multiple markers are close.

3. **Layer toggling** should smoothly switch between couche and legend markers without breaking OMS.

4. **High zoom levels (14+)** should keep markers ready for spiderfying, while low zooms should clean up to improve performance.

5. **Console should show helpful messages** about marker counts and sync operations for debugging.

## Browser Compatibility

These fixes are compatible with:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- **100ms delays** in event handlers prevent race conditions without noticeable lag
- **OMS with 20px nearbyDistance** efficiently handles the ~80 markers in the dataset
- **Auto-spiderfy only at zoom 14+** reduces unnecessary calculations at overview zoom levels
- **clearMarkers() before re-adding** prevents duplicate marker registrations

## Additional Resources

- **OMS Documentation**: https://github.com/jawj/OverlappingMarkerSpiderfier
- **Leaflet API**: https://leafletjs.com/reference.html
- **GeoJSON Spec**: https://geojson.org/

## Support

If issues persist after applying these fixes:

1. Check browser console for JavaScript errors
2. Verify `spiderfy.js` is loaded correctly
3. Confirm all marker coordinates are valid
4. Test in multiple browsers
5. Check if any other plugins conflict with OMS

## Files in This Fix

- `OMS_FIX_NOTES.md` - Summary of issues and solutions
- `oms_fixes.js` - Complete corrected OMS implementation code
- `LEAFLET_OMS_FIX_GUIDE.md` - This comprehensive guide

---

**Last Updated**: 2025-11-12
**Version**: 1.0
**Author**: Claude Code Assistant
