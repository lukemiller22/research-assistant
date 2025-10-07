#!/usr/bin/env python3
"""
Test script to verify the setup is working correctly.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

def test_environment():
    """Test if the environment is set up correctly."""
    print("Testing environment setup...")
    
    # Load environment variables
    load_dotenv()
    
    # Check if API key is set
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key or api_key == 'your_anthropic_api_key_here':
        print("❌ ANTHROPIC_API_KEY not set in .env file")
        return False
    else:
        print("✅ ANTHROPIC_API_KEY is set")
    
    # Check if required files exist
    required_files = [
        'Taxonomies/syntopicon_taxonomy.json',
        'Taxonomies/instructions.md',
        'requirements.txt'
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} missing")
            return False
    
    # Check if taxonomy is valid JSON
    try:
        with open('Taxonomies/syntopicon_taxonomy.json', 'r') as f:
            taxonomy = json.load(f)
        print(f"✅ Taxonomy JSON is valid ({taxonomy['syntopicon_taxonomy']['concepts_completed']}/102 concepts)")
    except Exception as e:
        print(f"❌ Taxonomy JSON is invalid: {e}")
        return False
    
    # Check if instructions file is readable
    try:
        with open('Taxonomies/instructions.md', 'r') as f:
            instructions = f.read()
        print(f"✅ Instructions file is readable ({len(instructions)} characters)")
    except Exception as e:
        print(f"❌ Instructions file error: {e}")
        return False
    
    print("\n🎉 All tests passed! You're ready to run the generation script.")
    return True

if __name__ == "__main__":
    test_environment()
