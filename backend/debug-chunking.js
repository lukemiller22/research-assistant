// Debug script to test GPT-4o chunking with the same content
const OpenAI = require('openai');
require('dotenv').config({ path: '../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function debugChunking() {
  console.log('🔍 Debugging GPT-4o Chunking Response');
  console.log('=' .repeat(50));
  
  // Sample content similar to the Free Will essay
  const testContent = `
Non-Christians and Christians alike often give the same answer to difficult questions like these: Why did God allow sin in the first place? Why does God save some people and not others? Why does God send people to hell? Why can living like a Christian be so frustrating? The immediate solution often suggested is simple: "free will." To many people, it's a satisfying answer: "Oh, that makes sense. Yeah, God does x because he has to preserve my free will. Yeah, OK. Next question." I'd like to suggest that we re-think this important issue. The title of this short essay is a question: "Do We Have a Free Will?" That question may be jarring to you because it asks if something exists that most people assume exists. My short answer to that question is that it depends on what you mean by "free." The longer answer is the rest of this essay. We should study "free will" because it is theologically significant and because many people assume a particular definition of "free will" that is incorrect. Studying "free will" is challenging because it is not defined in Scripture. Further, it is complex because it connects to many other larger theological issues; it intersects with philosophy, historical theology, and systematic theology.

The Bible teaches that God is sovereign over all things, including human decisions. This is evident in passages like Proverbs 16:9, which states that "the heart of man plans his way, but the Lord establishes his steps." This doesn't mean that humans are robots or puppets, but rather that God works through human choices to accomplish his purposes. The relationship between divine sovereignty and human responsibility is a mystery that we cannot fully comprehend, but both truths are clearly taught in Scripture.

There are different views on free will within Christian theology. The libertarian view holds that humans have the ability to choose between genuine alternatives, while the compatibilist view maintains that human freedom is compatible with divine determinism. The Reformed tradition has generally held to a compatibilist view, arguing that humans are free to act according to their nature and desires, but these are ultimately determined by God.

The practical implications of these different views are significant. If we believe in libertarian free will, we might be more inclined to blame people for their choices and less likely to trust in God's sovereignty. If we hold to compatibilism, we might be more likely to trust God's plan while still holding people responsible for their actions. The key is to maintain both truths in tension: God is sovereign, and humans are responsible.

In conclusion, the question of free will is complex and requires careful study of Scripture and theology. While we may not have all the answers, we can trust that God is both sovereign and just, and that his purposes will ultimately be accomplished.
`;

  try {
    const prompt = `You are an expert at cleaning and chunking text content for a research assistant system. 

TASK: Clean and chunk the following PDF content into semantic chunks.

CLEANING REQUIREMENTS:
- Remove headers, footers, page numbers, footnote markers
- Remove table of contents with page numbers
- Remove bibliography formatting artifacts
- Preserve chapter/section titles and detect hierarchy
- Clean up formatting artifacts while preserving meaning

CHUNKING REQUIREMENTS:
- Chunk by natural semantic units (paragraphs or coherent passages)
- Each chunk should be 200-800 words ideally
- Filter out chunks < 50 characters
- Preserve logical flow and context
- IMPORTANT: Split long essays into multiple chunks - do not create single large chunks
- Look for natural break points like topic changes, new arguments, or section transitions

OUTPUT FORMAT:
Return a JSON array of chunks with this exact structure:
[
  {
    "content": "cleaned paragraph text",
    "chapter_number": 1,
    "chapter_title": "Chapter Title"
  },
  {
    "content": "next chunk content",
    "chapter_number": null,
    "chapter_title": null
  }
]

CRITICAL: Always return an ARRAY of chunks, even if there's only one chunk. Do not return a single object.
If chapter information is not detectable, use null for chapter_number and chapter_title.

CONTENT TO PROCESS:
${testContent}

Return only the JSON array, no other text.`;

    console.log(`📄 Test content: ${testContent.length} characters`);
    console.log('');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at cleaning and chunking text content. Always return valid JSON arrays."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.1
    });
    
    const responseText = response.choices[0].message.content;
    console.log(`🤖 GPT-4o Response Length: ${responseText.length} characters`);
    console.log(`💰 Tokens Used: ${response.usage?.total_tokens || 0}`);
    console.log('');
    
    console.log('📝 Raw GPT-4o Response:');
    console.log('=' .repeat(50));
    console.log(responseText);
    console.log('=' .repeat(50));
    console.log('');
    
    // Parse the response
    let chunks;
    try {
      // First try direct JSON parsing
      const parsed = JSON.parse(responseText);
      chunks = Array.isArray(parsed) ? parsed : [parsed];
      console.log(`✅ Successfully parsed ${chunks.length} chunks`);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          chunks = Array.isArray(parsed) ? parsed : [parsed];
          console.log(`✅ Successfully parsed ${chunks.length} chunks from markdown`);
        } catch (markdownParseError) {
          console.error(`❌ Markdown JSON Parse Error: ${markdownParseError.message}`);
          return;
        }
      } else {
        // Try to extract JSON array from response
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            const parsed = JSON.parse(arrayMatch[0]);
            chunks = Array.isArray(parsed) ? parsed : [parsed];
            console.log(`✅ Successfully parsed ${chunks.length} chunks from array match`);
          } catch (arrayParseError) {
            console.error(`❌ Array Parse Error: ${arrayParseError.message}`);
            return;
          }
        } else {
          console.error(`❌ JSON Parse Error: ${parseError.message}`);
          return;
        }
      }
    }
    
    // Display each chunk
    chunks.forEach((chunk, index) => {
      console.log(`\n📄 Chunk ${index + 1}:`);
      console.log(`   Content: ${chunk.content?.substring(0, 150)}...`);
      console.log(`   Chapter: ${chunk.chapter_title || 'N/A'}`);
      console.log(`   Length: ${chunk.content?.length || 0} characters`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugChunking();
