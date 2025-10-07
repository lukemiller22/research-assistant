# Syntopicon Taxonomy Project Instructions

## Project Overview
You are helping build a comprehensive JSON taxonomy based on Mortimer Adler's Syntopicon, which indexes 102 Great Ideas from the Western intellectual tradition. The goal is to create a three-tier structure for each of the 102 ideas.

## Three-Tier Structure

### Tier 1: Ideas (FIXED - 102 Total)
- These are Adler's 102 Great Ideas from the Syntopicon
- This list is constrained and cannot be modified
- Examples: Angel, Animal, Aristocracy, Art, Astronomy, etc.

### Tier 2: Topics (8-15 per Idea)
- **Purpose**: Neutral meeting places for theological/philosophical discussion
- **Source**: Based on Adler's outline structure BUT reframed through a theological lens
- **Character**: Structural outline points, organizational frameworks
- **NOT**: Concept handles or specific phrases - just subject areas
- **Question to ask**: "How would a brilliant theologian outline this idea?"
- Examples for Angel: "Angelic Nature and Essence", "Orders of Angels", "Ministry of Angels"

### Tier 3: Terms (Variable, 15-20+ per Idea)
- **Purpose**: Actual memorable phrases/expressions used by specific thinkers
- **Character**: Sticky "concept handles" from discourse - the kind of phrases people cite
- **Key criteria**: 
  - Must be tied to a SPECIFIC source/person (not general periods or traditions)
  - Should be 5-7 words maximum (ideally shorter)
  - Book titles and essay titles are excellent examples of good concept handles
  - Must be phrases actually used in intellectual discourse, not invented descriptions
- **What to AVOID**:
  - Generic descriptive phrases ("Art and Morality")
  - Topic outline restatements ("Useful Arts" when already in topics)
  - Vague attributions ("Romantic tradition", "Modern usage")
  - Anything over 7 words
- **Good examples**: "Mimesis" (Aristotle), "Willing Suspension of Disbelief" (Coleridge), "Saving the Appearances" (Simplicius)
- **Format**: Each term should have an inline comment showing its source
  ```json
  "Mimesis", // Aristotle
  "Music of the Spheres", // Pythagorean tradition
  ```

## JSON Structure

```json
{
  "syntopicon_taxonomy": {
    "version": "3.0",
    "structure": "three_tier",
    "description": "Ideas (102 fixed) → Topics (theological outline) → Terms (concept handles from discourse)",
    "concepts_completed": [NUMBER],
    "concepts_total": 102,
    "concepts": [
      {
        "id": "lowercase_idea_name",
        "name": "Proper Case Idea Name",
        "domains": ["relevant_domain1", "relevant_domain2"],
        "description": "Brief description of the idea",
        "topics": [
          "Topic Name 1",
          "Topic Name 2",
          // ... 8-15 topics
        ],
        "terms": [
          "Concept Handle 1", // Specific Source
          "Concept Handle 2", // Specific Thinker
          // ... 15-20+ terms with inline source comments
        ],
        "note": "Topics outline [domain] discussion areas; Terms are actual phrases used in discourse"
      }
    ]
  }
}
```

## Working Process

1. **Search project knowledge** for the next chapter outline from Adler's Syntopicon in "Syntopicon 1 - Outlines - Complete" and "Syntopicon 2 - Outlines - Complete"
2. **Create Topics** by:
   - Reviewing the outline of topics from that chapter
   - Synthesizing them into 8-15 clear discussion areas
   - Framing them theologically/philosophically where appropriate
   - Keeping them as structural organizational points (NOT concept handles)

3. **Create Terms** by:
   - Identifying sticky, memorable phrases from the tradition
   - Ensuring each has a specific source attribution
   - Keeping them under 5-7 words
   - Verifying they're actually used in discourse (not invented descriptions)
   - Adding inline source comments in the format: `"Term", // Source`

4. **Quality check**:
   - Are Topics distinct from Terms? (Topics = organization, Terms = memorable phrases)
   - Are all Terms tied to specific sources, not vague traditions?
   - Are Terms short enough (5-7 words max)?
   - Would these Terms appear as book/essay titles or famous phrases?
   - Are you avoiding redundancy between Topics and Terms?

## Critical Reminders

- **Terms are concept handles from the tradition, not invented by you**
- Source attribution matters: "Aristotle" not "Greek philosophy"
- Topics outline structure; Terms are sticky phrases people actually use
- Keep Terms concise - book title length is ideal
- When in doubt about a Term, ask: "Would this appear as a book or essay title?"

## Current Status
Track completed concepts and maintain consistent quality across all entries. Each new concept should match the standards established in previous entries.