#!/usr/bin/env python3
"""
Setup script to create .env file for the project.
"""

import os

def create_env_file():
    """Create .env file with Anthropic API key."""
    env_content = """# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("Created .env file. Please edit it and add your Anthropic API key.")
    print("You can get your API key from: https://console.anthropic.com/")

if __name__ == "__main__":
    create_env_file()
