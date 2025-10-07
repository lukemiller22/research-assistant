#!/usr/bin/env python3
"""
Script to generate the next 10 concepts for the Syntopicon taxonomy using Anthropic's API.
"""

import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Initialize Anthropic client
    client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    # Read the current JSON file to get the completed concepts count
    with open('Taxonomies/syntopicon_taxonomy.json', 'r') as f:
        taxonomy_data = json.load(f)
    
    completed_count = taxonomy_data['syntopicon_taxonomy']['concepts_completed']
    print(f"Current completed concepts: {completed_count}")
    
    # Prepare the request message
    message = f"""I need to continue building a JSON taxonomy based on Mortimer Adler's Syntopicon. I have completed {completed_count} concepts and need to continue with the next 10 concepts (concepts {completed_count + 1}-{completed_count + 10}). 

Please analyze the attached PDF documents to find the next 10 concepts from Adler's Syntopicon outline and create JSON entries for them following these specific instructions:

**Three-Tier Structure:**
1. **Ideas** (FIXED - 102 Total) - Adler's 102 Great Ideas
2. **Topics** (8-15 per Idea) - Structural outline points for theological/philosophical discussion
3. **Terms** (15-20+ per Idea) - Actual memorable phrases from specific thinkers with source attribution

**Key Requirements for Terms:**
- Must be tied to SPECIFIC sources/people (not general periods)
- 5-7 words maximum (ideally shorter)
- Book titles and essay titles are excellent examples
- Must be phrases actually used in intellectual discourse
- Format: "Term", // Specific Source

**JSON Structure:**
```json
{{
  "id": "lowercase_idea_name",
  "name": "Proper Case Idea Name", 
  "domains": ["relevant_domain1", "relevant_domain2"],
  "description": "Brief description of the idea",
  "topics": [
    "Topic Name 1",
    "Topic Name 2"
    // ... 8-15 topics
  ],
  "terms": [
    "Concept Handle 1", // Specific Source
    "Concept Handle 2", // Specific Thinker
    // ... 15-20+ terms with inline source comments
  ],
  "note": "Topics outline [domain] discussion areas; Terms are actual phrases used in discourse"
}}
```

**Completed Concepts (1-{completed_count}):**
{', '.join([concept['name'] for concept in taxonomy_data['syntopicon_taxonomy']['concepts']])}

Please find the next 10 concepts from Adler's Syntopicon (concepts 18-27) and create complete JSON entries for each one, following the exact format and quality standards shown above. 

The next 10 concepts should be: Duty, Education, Emotion, Equality, Evolution, Experience, Family, Fate, Form, and God.

Return only the JSON array of the 10 new concept objects, ready to be inserted into the existing concepts array."""

    try:
        # Send the request to Anthropic
        print("Sending request to Anthropic...")
        
        # Create the message without PDF attachments (they're too large)
        messages = [
            {
                "role": "user",
                "content": message
            }
        ]
        
        # Make the API call
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4000,
            messages=messages
        )
        
        print("Response received from Anthropic:")
        print("=" * 50)
        print(response.content[0].text)
        print("=" * 50)
        
        # Save the response to a file
        with open('Taxonomies/generated_concepts.json', 'w') as f:
            f.write(response.content[0].text)
        
        print("\nResponse saved to: Taxonomies/generated_concepts.json")
        
    except Exception as e:
        print(f"Error calling Anthropic API: {e}")

if __name__ == "__main__":
    main()
