// Test script to convert EPUB to clean text first, then process with GPT-4o
const AdmZip = require('adm-zip');
const cheerio = require('cheerio');
const fs = require('fs');

async function convertEpubToText(epubPath) {
  try {
    console.log(`Converting EPUB to text: ${epubPath}`);
    
    // Read EPUB file
    const zip = new AdmZip(epubPath);
    const entries = zip.getEntries();
    
    // Find the main content files
    const contentFiles = entries.filter(entry => 
      entry.entryName.endsWith('.html') || 
      entry.entryName.endsWith('.xhtml') ||
      entry.entryName.endsWith('.htm')
    );
    
    console.log(`Found ${contentFiles.length} content files`);
    
    let fullText = '';
    
    // Process each content file
    for (const file of contentFiles) {
      try {
        const content = file.getData().toString('utf8');
        const $ = cheerio.load(content);
        
        // Remove script and style elements
        $('script, style, nav, header, footer').remove();
        
        // Extract text content
        const text = $('body').text() || $.text();
        
        // Clean up the text
        const cleanedText = text
          .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
          .replace(/\n\s*\n/g, '\n\n')  // Clean up paragraph breaks
          .trim();
        
        if (cleanedText.length > 100) {  // Only include substantial content
          fullText += cleanedText + '\n\n';
        }
      } catch (fileError) {
        console.warn(`Error processing file ${file.entryName}: ${fileError.message}`);
      }
    }
    
    // Final cleanup
    const finalText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    console.log(`Converted EPUB to text: ${finalText.length} characters`);
    
    return finalText;
    
  } catch (error) {
    console.error('Error converting EPUB to text:', error);
    throw error;
  }
}

// Test with a sample EPUB (you would need to provide the path)
async function testConversion() {
  try {
    // This would be the path to your EPUB file
    const epubPath = process.argv[2];
    
    if (!epubPath) {
      console.log('Usage: node test-epub-to-text.js <path-to-epub>');
      return;
    }
    
    const text = await convertEpubToText(epubPath);
    
    // Save to file for inspection
    fs.writeFileSync('converted-text.txt', text);
    console.log('Text saved to converted-text.txt');
    
    // Show first 500 characters
    console.log('\nFirst 500 characters:');
    console.log(text.substring(0, 500));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConversion();

