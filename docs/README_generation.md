# Syntopicon Taxonomy Generation Script

This script uses the Anthropic API to generate the remaining concepts for your Syntopicon taxonomy.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up your API key:**
   ```bash
   python setup_env.py
   ```
   Then edit the `.env` file and add your Anthropic API key.

3. **Run the generation script:**
   ```bash
   python generate_remaining_concepts.py
   ```

## Features

- **Interactive menu** to choose which concepts to generate
- **Automatic backups** before each generation
- **Rate limiting** to respect API limits
- **Progress tracking** with success/failure reporting
- **Incremental saving** after each successful generation

## Options

1. **Generate all remaining concepts** - Processes all 69 remaining concepts
2. **Generate specific range** - Choose a range like 1-5 concepts
3. **Generate specific concepts** - Enter specific concept names
4. **Generate one at a time** - Interactive single concept generation

## Current Status

- **Completed:** 33/102 concepts
- **Remaining:** 69 concepts
  - 17 from Syntopicon 1 (History through Love)
  - 52 from Syntopicon 2 (Man through World)

## Safety Features

- Creates timestamped backups before each generation
- Saves progress after each successful concept
- Continues processing even if individual concepts fail
- Preserves existing work if script is interrupted

## API Usage

The script uses Claude 3.5 Sonnet and includes:
- Proper rate limiting (2 seconds between requests)
- Error handling for API failures
- JSON extraction and validation
- Progress reporting

## Troubleshooting

- **API Key Issues:** Make sure your `.env` file contains a valid Anthropic API key
- **JSON Parsing Errors:** The script will skip failed generations and continue
- **Rate Limiting:** The script includes built-in delays between requests
- **Backup Files:** Check the `Taxonomies/` directory for timestamped backups
