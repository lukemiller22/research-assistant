#!/usr/bin/env python3
"""
Generate embeddings for JSONL community source files.
Reads a JSONL file, generates OpenAI embeddings for each chunk, and saves to a new file.
"""

import json
import os
import sys
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_embeddings(input_file, output_file):
    """Generate embeddings for a JSONL file and save to a new file."""
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    if not client.api_key:
        print("Error: OPENAI_API_KEY not found in environment variables")
        sys.exit(1)
    
    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}")
    
    processed_count = 0
    error_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
                
            try:
                # Parse JSON line
                chunk = json.loads(line)
                
                # Check if embedding already exists
                if chunk.get('embedding') is not None:
                    print(f"Line {line_num}: Embedding already exists, skipping...")
                    json.dump(chunk, outfile, ensure_ascii=False)
                    outfile.write('\n')
                    processed_count += 1
                    continue
                
                # Generate embedding
                print(f"Line {line_num}: Generating embedding for chunk {chunk.get('chunk_index', 'unknown')}...")
                
                response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=chunk['content']
                )
                
                # Add embedding to chunk
                chunk['embedding'] = response.data[0].embedding
                
                # Write updated chunk to output file
                json.dump(chunk, outfile, ensure_ascii=False)
                outfile.write('\n')
                
                processed_count += 1
                
                # Small delay to avoid rate limiting
                import time
                time.sleep(0.1)
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON on line {line_num}: {e}")
                error_count += 1
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}")
                error_count += 1
                continue
    
    print(f"\nCompleted!")
    print(f"Processed: {processed_count} chunks")
    print(f"Errors: {error_count} chunks")
    print(f"Output saved to: {output_file}")

def main():
    """Main function to handle command line arguments."""
    
    if len(sys.argv) != 2:
        print("Usage: python generate_embeddings.py <input_file.jsonl>")
        print("Example: python generate_embeddings.py community_sources/reading_old_books_lewis.jsonl")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found")
        sys.exit(1)
    
    # Generate output filename
    input_path = Path(input_file)
    output_file = input_path.parent / f"{input_path.stem}_embeddings{input_path.suffix}"
    
    # Confirm before proceeding
    print(f"This will generate embeddings for: {input_file}")
    print(f"Output will be saved to: {output_file}")
    print(f"Make sure you have OPENAI_API_KEY set in your .env file")
    print("Proceeding automatically...")
    
    # Generate embeddings
    generate_embeddings(input_file, str(output_file))

if __name__ == "__main__":
    main()
