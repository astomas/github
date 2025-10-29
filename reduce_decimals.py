#!/usr/bin/env python3
import json
import sys

def round_coordinates(coords, decimals=6):
    """
    Recursively round coordinates in a GeoJSON coordinate array
    """
    if isinstance(coords[0], (int, float)):
        # Base case: this is a coordinate pair [lon, lat]
        return [round(coord, decimals) for coord in coords]
    else:
        # Recursive case: this is a nested array
        return [round_coordinates(item, decimals) for item in coords]

def process_geojson(input_file, output_file, decimals=6):
    """
    Process a GeoJSON file to limit decimal places
    """
    # Read the original file
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    # Process coordinates
    if 'geometry' in data and 'coordinates' in data['geometry']:
        data['geometry']['coordinates'] = round_coordinates(
            data['geometry']['coordinates'],
            decimals
        )

    # Write the processed file with minimal formatting to reduce size
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

    print(f"Processing complete!")

if __name__ == '__main__':
    input_file = 'gard.geojson'
    output_file = 'gard.geojson'

    print(f"Processing {input_file}...")
    process_geojson(input_file, output_file, decimals=6)
