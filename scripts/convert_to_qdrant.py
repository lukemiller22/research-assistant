#!/usr/bin/env python3
"""
Convert application JSONL format to Qdrant-ready format.
Takes the embeddings JSONL and converts it to the format expected by Qdrant.
"""

import json
import sys
from pathlib import Path

def convert_to_qdrant_format(input_file, output_file):
    """Convert application JSONL to Qdrant-ready format."""
    
    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}")
    
    processed_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
                
            try:
                # Parse JSON line
                chunk = json.loads(line)
                
                # Convert to Qdrant format
                qdrant_chunk = {
                    "id": f"lewis_reading_old_books_{chunk['chunk_index']}",
                    "content": chunk['content'],
                    "source_title": chunk['source_title'],
                    "author": chunk['author'],
                    "year": chunk['year'],
                    "genre": chunk['genre'],
                    "structure_path": chunk['structure_path'],
                    "chunk_index": chunk['chunk_index'],
                    "embedding": chunk['embedding'],
                    "metadata": {
                        "source_type": chunk['metadata']['source_type'],
                        "syntopicon_tags": chunk['metadata']['syntopicon_tags'],
                        "rhetorical_function": chunk['metadata']['rhetorical_function'],
                        "scripture_refs": chunk['metadata']['scripture_refs'],
                        "topics": chunk['metadata']['topics'],
                        "entities": chunk['metadata']['entities']
                    }
                }
                
                # Write Qdrant-ready chunk
                json.dump(qdrant_chunk, outfile, ensure_ascii=False)
                outfile.write('\n')
                
                processed_count += 1
                print(f"Converted chunk {chunk['chunk_index']}")
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON on line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}")
                continue
    
    print(f"\nCompleted!")
    print(f"Processed: {processed_count} chunks")
    print(f"Output saved to: {output_file}")

def main():
    """Main function to handle command line arguments."""
    
    if len(sys.argv) != 2:
        print("Usage: python convert_to_qdrant.py <embeddings_file.jsonl>")
        print("Example: python convert_to_qdrant.py community_sources/reading_old_books_lewis_embeddings.jsonl")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Check if input file exists
    if not Path(input_file).exists():
        print(f"Error: Input file '{input_file}' not found")
        sys.exit(1)
    
    # Generate output filename
    input_path = Path(input_file)
    output_file = input_path.parent / f"{input_path.stem.replace('_embeddings', '')}_qdrant{input_path.suffix}"
    
    print(f"Converting: {input_file}")
    print(f"Output: {output_file}")
    
    # Convert to Qdrant format
    convert_to_qdrant_format(input_file, str(output_file))

if __name__ == "__main__":
    main()
