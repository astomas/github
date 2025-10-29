#!/usr/bin/env python3
import json
import sys

def round_coordinates(coords, decimals=6):
    """Recursively round coordinates in a GeoJSON coordinate array"""
    if isinstance(coords[0], (int, float)):
        return [round(coord, decimals) for coord in coords]
    else:
        return [round_coordinates(item, decimals) for item in coords]

def simplify_coordinates(coords, tolerance=0.0001):
    """
    Simplify coordinate array using Douglas-Peucker algorithm
    Tolerance in degrees (~0.0001 = ~11m at equator)
    """
    try:
        from shapely.geometry import shape, mapping
        from shapely import simplify

        # Create a temporary GeoJSON feature
        temp_geom = {
            "type": "MultiPolygon",
            "coordinates": coords
        }

        # Convert to shapely geometry
        geom = shape(temp_geom)

        # Simplify
        simplified = simplify(geom, tolerance=tolerance, preserve_topology=True)

        # Convert back to coordinates
        return mapping(simplified)['coordinates']
    except ImportError:
        print("Warning: shapely not available, skipping simplification")
        return coords

def process_geojson(input_file, output_file, tolerance=0.0001, decimals=6):
    """
    Process a GeoJSON file to simplify geometry and limit decimal places
    """
    # Read the original file
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    original_size = len(json.dumps(data))

    # Process coordinates
    if 'geometry' in data and 'coordinates' in data['geometry']:
        # Simplify geometry
        data['geometry']['coordinates'] = simplify_coordinates(
            data['geometry']['coordinates'],
            tolerance
        )

        # Round decimals
        data['geometry']['coordinates'] = round_coordinates(
            data['geometry']['coordinates'],
            decimals
        )

    # Write the processed file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

    new_size = len(json.dumps(data))
    reduction = ((original_size - new_size) / original_size) * 100

    print(f"Original size: {original_size / 1024:.1f} KB")
    print(f"New size: {new_size / 1024:.1f} KB")
    print(f"Reduction: {reduction:.1f}%")

if __name__ == '__main__':
    tolerance = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0001
    input_file = 'gard-6decimals.geojson'
    output_file = f'gard-simplified-{tolerance}.geojson'

    print(f"Simplifying with tolerance={tolerance}...")
    process_geojson(input_file, output_file, tolerance=tolerance, decimals=6)
    print(f"Saved to: {output_file}")
