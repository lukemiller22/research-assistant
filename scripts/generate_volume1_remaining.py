#!/usr/bin/env python3
"""
Script to generate the remaining Volume 1 concepts for the Syntopicon Taxonomy.
"""

import json
import os
import time
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def load_instructions():
    """Load the instructions from the markdown file."""
    with open('Taxonomies/instructions.md', 'r', encoding='utf-8') as f:
        return f.read()

def load_current_taxonomy():
    """Load the current taxonomy to see what's already completed."""
    with open('Taxonomies/syntopicon_taxonomy.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_volume1_remaining_concepts():
    """Get the remaining Volume 1 concepts that need to be generated."""
    # All Volume 1 concepts
    volume1_all = [
        "History", "Honor", "Hypothesis", "Idea", "Immortality", "Induction", 
        "Infinity", "Judgment", "Justice", "Knowledge", "Labor", "Language", 
        "Law", "Liberty", "Life and Death", "Logic", "Love"
    ]
    
    # Load current taxonomy to see what's already done
    taxonomy = load_current_taxonomy()
    existing_concept_names = [concept["name"] for concept in taxonomy["syntopicon_taxonomy"]["concepts"]]
    
    # Find which Volume 1 concepts are missing
    remaining = [concept for concept in volume1_all if concept not in existing_concept_names]
    
    return remaining

def generate_concept_prompt(concept_name, instructions, existing_concepts):
    """Generate the prompt for creating a single concept."""
    
    # Get a few examples from existing concepts for context
    example_concepts = existing_concepts[:3]  # First 3 as examples
    
    prompt = f"""You are helping to build a comprehensive JSON taxonomy based on Mortimer Adler's Syntopicon. 

{instructions}

I need you to create a complete entry for the concept: "{concept_name}"

Here are some examples of completed concepts to follow the same pattern:

{json.dumps(example_concepts, indent=2)}

Please create a complete JSON entry for "{concept_name}" following the exact same structure and quality standards as the examples. 

Requirements:
1. Create 8-15 topics that outline theological/philosophical discussion areas
2. Create 15-20+ terms that are actual memorable phrases from the tradition with specific source attributions
3. Keep terms under 5-7 words maximum
4. Ensure terms are concept handles from discourse, not invented descriptions
5. Include appropriate domains for the concept
6. Write a brief but comprehensive description

Return ONLY the JSON object for this single concept, formatted exactly like the examples above."""

    return prompt

def generate_concept(concept_name, instructions, existing_concepts):
    """Generate a single concept using the Anthropic API."""
    
    prompt = generate_concept_prompt(concept_name, instructions, existing_concepts)
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        # Extract the JSON from the response
        content = response.content[0].text
        
        # Try to find JSON in the response
        start_idx = content.find('{')
        end_idx = content.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx]
            concept_data = json.loads(json_str)
            return concept_data
        else:
            print(f"Warning: Could not extract JSON from response for {concept_name}")
            return None
            
    except Exception as e:
        print(f"Error generating concept {concept_name}: {e}")
        return None

def update_taxonomy(taxonomy, new_concept):
    """Add a new concept to the taxonomy."""
    if new_concept:
        taxonomy["syntopicon_taxonomy"]["concepts"].append(new_concept)
        taxonomy["syntopicon_taxonomy"]["concepts_completed"] = len(taxonomy["syntopicon_taxonomy"]["concepts"])
    return taxonomy

def save_taxonomy(taxonomy, backup=True):
    """Save the updated taxonomy to file."""
    if backup:
        # Create backup
        backup_path = f"Taxonomies/syntopicon_taxonomy_backup_{int(time.time())}.json"
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(taxonomy, f, indent=2, ensure_ascii=False)
        print(f"Backup saved to: {backup_path}")
    
    # Save main file
    with open('Taxonomies/syntopicon_taxonomy.json', 'w', encoding='utf-8') as f:
        json.dump(taxonomy, f, indent=2, ensure_ascii=False)
    print("Taxonomy updated successfully!")

def main():
    """Main function to generate remaining Volume 1 concepts."""
    
    print("Loading instructions and current taxonomy...")
    instructions = load_instructions()
    taxonomy = load_current_taxonomy()
    existing_concepts = taxonomy["syntopicon_taxonomy"]["concepts"]
    
    print(f"Current progress: {len(existing_concepts)}/102 concepts completed")
    
    # Get remaining Volume 1 concepts
    remaining_concepts = get_volume1_remaining_concepts()
    print(f"Remaining Volume 1 concepts to generate: {len(remaining_concepts)}")
    
    if not remaining_concepts:
        print("All Volume 1 concepts are already completed!")
        return
    
    print("\nRemaining Volume 1 concepts:")
    for i, concept in enumerate(remaining_concepts, 1):
        print(f"{i:2d}. {concept}")
    
    print(f"\nGenerating {len(remaining_concepts)} Volume 1 concepts...")
    
    # Generate concepts
    successful_generations = 0
    for i, concept_name in enumerate(remaining_concepts, 1):
        print(f"\n[{i}/{len(remaining_concepts)}] Generating: {concept_name}")
        
        concept_data = generate_concept(concept_name, instructions, existing_concepts)
        
        if concept_data:
            taxonomy = update_taxonomy(taxonomy, concept_data)
            successful_generations += 1
            print(f"✓ Successfully generated: {concept_name}")
            
            # Save after each successful generation
            save_taxonomy(taxonomy, backup=False)
        else:
            print(f"✗ Failed to generate: {concept_name}")
        
        # Rate limiting - wait between requests
        if i < len(remaining_concepts):
            print("Waiting 2 seconds before next request...")
            time.sleep(2)
    
    print(f"\nVolume 1 generation complete!")
    print(f"Successfully generated: {successful_generations}/{len(remaining_concepts)} concepts")
    print(f"Total concepts in taxonomy: {taxonomy['syntopicon_taxonomy']['concepts_completed']}/102")
    print(f"Remaining: {102 - taxonomy['syntopicon_taxonomy']['concepts_completed']} concepts")

if __name__ == "__main__":
    main()
