// EPUB to Text processor for better GPT-4o chunking
const AdmZip = require('adm-zip');
const cheerio = require('cheerio');

async function convertEpubToCleanText(buffer) {
  try {
    console.log('Converting EPUB to clean text...');
    
    // Read EPUB file
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    // Find the main content files (prioritize by common patterns)
    const contentFiles = entries
      .filter(entry => 
        entry.entryName.endsWith('.html') || 
        entry.entryName.endsWith('.xhtml') ||
        entry.entryName.endsWith('.htm')
      )
      .sort((a, b) => {
        // Prioritize main content files
        const aIsMain = a.entryName.includes('chapter') || a.entryName.includes('content') || a.entryName.includes('text');
        const bIsMain = b.entryName.includes('chapter') || b.entryName.includes('content') || b.entryName.includes('text');
        
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return a.entryName.localeCompare(b.entryName);
      });
    
    console.log(`Found ${contentFiles.length} content files`);
    
    let fullText = '';
    let processedFiles = 0;
    
    // Process each content file
    for (const file of contentFiles) {
      try {
        const content = file.getData().toString('utf8');
        const $ = cheerio.load(content);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, .nav, .navigation, .toc, .table-of-contents').remove();
        
        // Extract text content
        let text = '';
        
        // Try to get structured content first
        const mainContent = $('main, article, .content, .chapter, .text').first();
        if (mainContent.length > 0) {
          text = mainContent.text();
        } else {
          text = $('body').text() || $.text();
        }
        
        // Clean up the text
        const cleanedText = text
          .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
          .replace(/\n\s*\n/g, '\n\n')  // Clean up paragraph breaks
          .replace(/[^\x00-\x7F]/g, '')  // Remove non-ASCII characters that might cause issues
          .trim();
        
        if (cleanedText.length > 100) {  // Only include substantial content
          fullText += cleanedText + '\n\n';
          processedFiles++;
        }
      } catch (fileError) {
        console.warn(`Error processing file ${file.entryName}: ${fileError.message}`);
      }
    }
    
    // Final cleanup
    const finalText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .trim();
    
    console.log(`Converted EPUB to text: ${finalText.length} characters from ${processedFiles} files`);
    
    return finalText;
    
  } catch (error) {
    console.error('Error converting EPUB to text:', error);
    throw new Error(`EPUB to text conversion failed: ${error.message}`);
  }
}

// Convert EPUB to separate chapter files
async function convertEpubToChapterFiles(buffer) {
  try {
    console.log('Converting EPUB to separate chapter files...');
    
    // Read EPUB file
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    // Find the main content files (prioritize by common patterns)
    const contentFiles = entries
      .filter(entry => 
        entry.entryName.endsWith('.html') || 
        entry.entryName.endsWith('.xhtml') ||
        entry.entryName.endsWith('.htm')
      )
      .sort((a, b) => {
        // Prioritize main content files
        const aIsMain = a.entryName.includes('chapter') || a.entryName.includes('content') || a.entryName.includes('text');
        const bIsMain = b.entryName.includes('chapter') || b.entryName.includes('content') || b.entryName.includes('text');
        
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return a.entryName.localeCompare(b.entryName);
      });
    
    console.log(`Found ${contentFiles.length} content files`);
    
    const chapters = [];
    let processedFiles = 0;
    
    // Process each content file as a separate chapter
    for (let i = 0; i < contentFiles.length; i++) {
      const file = contentFiles[i];
      try {
        const content = file.getData().toString('utf8');
        const $ = cheerio.load(content);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, .nav, .navigation, .toc, .table-of-contents').remove();
        
        // Extract text content
        let text = '';
        
        // Try to get structured content first
        const mainContent = $('main, article, .content, .chapter, .text').first();
        if (mainContent.length > 0) {
          text = mainContent.text();
        } else {
          text = $('body').text() || $.text();
        }
        
        // Clean up the text
        const cleanedText = text
          .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
          .replace(/\n\s*\n/g, '\n\n')  // Clean up paragraph breaks
          .replace(/[^\x00-\x7F]/g, '')  // Remove non-ASCII characters that might cause issues
          .trim();
        
        if (cleanedText.length > 100) {  // Only include substantial content
          // Try to extract chapter title
          let chapterTitle = `Chapter ${i + 1}`;
          const titleElement = $('h1, h2, .chapter-title, .title').first();
          if (titleElement.length > 0) {
            chapterTitle = titleElement.text().trim();
          }
          
          chapters.push({
            chapterNumber: i + 1,
            chapterTitle: chapterTitle,
            content: cleanedText,
            fileName: file.entryName
          });
          
          processedFiles++;
        }
      } catch (fileError) {
        console.warn(`Error processing file ${file.entryName}: ${fileError.message}`);
      }
    }
    
    console.log(`Converted EPUB to ${chapters.length} chapter files from ${processedFiles} files`);
    
    return chapters;
    
  } catch (error) {
    console.error('Error converting EPUB to chapter files:', error);
    throw new Error(`EPUB to chapter files conversion failed: ${error.message}`);
  }
}

module.exports = { convertEpubToCleanText, convertEpubToChapterFiles };

