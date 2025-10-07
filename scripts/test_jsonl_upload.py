#!/usr/bin/env python3
"""
Test script to upload JSONL file to the backend.
"""

import json
import requests
import sys
from pathlib import Path

def upload_jsonl(file_path, server_url="http://localhost:3001"):
    """Upload JSONL file to the backend."""
    
    print(f"Reading JSONL file: {file_path}")
    
    # Read the JSONL file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"File size: {len(content)} characters")
    print(f"Number of lines: {len(content.splitlines())}")
    
    # Prepare the request
    data = {
        "content": content
    }
    
    print(f"Uploading to: {server_url}/upload-jsonl")
    
    try:
        response = requests.post(
            f"{server_url}/upload-jsonl",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload successful!")
            print(f"Source ID: {result.get('source_id')}")
            print(f"Chunks created: {result.get('chunks_created')}")
            print(f"Qdrant uploaded: {result.get('qdrant_uploaded')}")
            print(f"Source title: {result.get('source_title')}")
            print(f"Author: {result.get('author')}")
        else:
            print("❌ Upload failed!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_jsonl_upload.py <jsonl_file>")
        print("Example: python test_jsonl_upload.py community_sources/reading_old_books_lewis_qdrant.jsonl")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"Error: File '{file_path}' not found")
        sys.exit(1)
    
    upload_jsonl(file_path)

if __name__ == "__main__":
    main()
