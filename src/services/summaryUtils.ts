
/**
 * Provides a brief summary of the transcript by extracting the first few sentences
 * @param transcript - The full transcript text
 * @param maxLength - Maximum number of characters for the summary (default: 150)
 * @returns A brief summary of the transcript
 */
export const generateBriefSummary = (transcript: string, maxLength: number = 150): string => {
  if (!transcript || transcript.trim() === '') {
    return 'No transcript available to summarize.';
  }

  // Split the transcript into sentences
  const sentences = transcript.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  // Start with the first sentence
  let summary = sentences[0].trim();
  
  // Add more sentences until we reach the desired length
  let i = 1;
  while (i < sentences.length && summary.length < maxLength) {
    summary += '. ' + sentences[i].trim();
    i++;
  }
  
  // Add ellipsis if we've truncated the transcript
  if (i < sentences.length || transcript.length > summary.length + 3) {
    summary += '...';
  }
  
  return summary;
};

/**
 * Extracts key points from the transcript based on sentence importance
 * @param transcript - The full transcript text
 * @param numPoints - Number of key points to extract (default: 3)
 * @returns Array of key points extracted from the transcript
 */
export const extractKeyPoints = (transcript: string, numPoints: number = 3): string[] => {
  if (!transcript || transcript.trim() === '') {
    return ['No transcript available to extract key points.'];
  }

  // Split the transcript into sentences
  const sentences = transcript.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  // For now, use a simple approach of taking sentences evenly distributed throughout the transcript
  const keyPoints: string[] = [];
  
  if (sentences.length <= numPoints) {
    // If we have fewer sentences than requested points, return all sentences
    return sentences.map(s => s.trim());
  } else {
    // Take sentences at regular intervals
    const interval = Math.floor(sentences.length / numPoints);
    
    for (let i = 0; i < numPoints; i++) {
      const index = i * interval;
      if (index < sentences.length) {
        keyPoints.push(sentences[index].trim());
      }
    }
    
    return keyPoints;
  }
};
