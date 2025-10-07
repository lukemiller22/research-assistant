#!/usr/bin/env python3
"""
Script to generate remaining concepts for the Syntopicon Taxonomy using Anthropic API.
This script will generate concepts 18-102 based on the instructions and existing patterns.
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

def get_next_concepts():
    """Get the list of remaining concepts to generate."""
    # Next 17 concepts from Syntopicon 1
    syntopicon_1_concepts = [
        "History", "Honor", "Hypothesis", "Idea", "Immortality", "Induction", 
        "Infinity", "Judgment", "Justice", "Knowledge", "Labor", "Language", 
        "Law", "Liberty", "Life and Death", "Logic", "Love"
    ]
    
    # Remaining 50 concepts from Syntopicon 2
    syntopicon_2_concepts = [
        "Man", "Mathematics", "Matter", "Mechanics", "Medicine", "Memory and Imagination",
        "Metaphysics", "Mind", "Monarchy", "Nature", "Necessity and Contingency", "Oligarchy",
        "One and Many", "Opinion", "Opposition", "Philosophy", "Physics", "Pleasure and Pain",
        "Poetry", "Principle", "Progress", "Prophecy", "Prudence", "Punishment", "Quality",
        "Quantity", "Reasoning", "Relation", "Religion", "Revolution", "Rhetoric", "Same and Other",
        "Science", "Sense", "Sign and Symbol", "Sin", "Slavery", "Soul", "Space", "State",
        "Temperance", "Theology", "Time", "Truth", "Tyranny", "Universal and Particular",
        "Virtue and Vice", "War and Peace", "Wealth", "Will", "Wisdom", "World"
    ]
    
    return syntopicon_1_concepts + syntopicon_2_concepts

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
    """Main function to generate remaining concepts."""
    
    print("Loading instructions and current taxonomy...")
    instructions = load_instructions()
    taxonomy = load_current_taxonomy()
    existing_concepts = taxonomy["syntopicon_taxonomy"]["concepts"]
    
    print(f"Current progress: {len(existing_concepts)}/102 concepts completed")
    
    # Get remaining concepts
    remaining_concepts = get_next_concepts()
    print(f"Remaining concepts to generate: {len(remaining_concepts)}")
    print(f"  - 17 from Syntopicon 1 (History → Love)")
    print(f"  - 52 from Syntopicon 2 (Man → World)")
    
    # Ask user which concepts to generate
    print("\nRemaining concepts:")
    for i, concept in enumerate(remaining_concepts, 1):
        print(f"{i:2d}. {concept}")
    
    print("\nOptions:")
    print("1. Generate all remaining concepts")
    print("2. Generate specific range (e.g., 1-5)")
    print("3. Generate specific concepts by name")
    print("4. Generate one concept at a time")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        concepts_to_generate = remaining_concepts
    elif choice == "2":
        start, end = map(int, input("Enter range (e.g., 1-5): ").split('-'))
        concepts_to_generate = remaining_concepts[start-1:end]
    elif choice == "3":
        concept_names = input("Enter concept names separated by commas: ").split(',')
        concepts_to_generate = [name.strip() for name in concept_names if name.strip() in remaining_concepts]
    elif choice == "4":
        concepts_to_generate = [remaining_concepts[0]]  # Just the first one
    else:
        print("Invalid choice. Exiting.")
        return
    
    print(f"\nGenerating {len(concepts_to_generate)} concepts...")
    
    # Generate concepts
    successful_generations = 0
    for i, concept_name in enumerate(concepts_to_generate, 1):
        print(f"\n[{i}/{len(concepts_to_generate)}] Generating: {concept_name}")
        
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
        if i < len(concepts_to_generate):
            print("Waiting 2 seconds before next request...")
            time.sleep(2)
    
    print(f"\nGeneration complete!")
    print(f"Successfully generated: {successful_generations}/{len(concepts_to_generate)} concepts")
    print(f"Total concepts in taxonomy: {taxonomy['syntopicon_taxonomy']['concepts_completed']}/102")
    print(f"Remaining: {102 - taxonomy['syntopicon_taxonomy']['concepts_completed']} concepts")

if __name__ == "__main__":
    main()
