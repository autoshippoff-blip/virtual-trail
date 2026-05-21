export interface ProductImage {
  url?: string;
  src?: string; // Support Shopify src key alias
  position: number;
  altText?: string;
  alt?: string; // Support Shopify alt key alias
  filename?: string;
  metadata?: {
    isPlainBackground?: boolean;
    hasHuman?: boolean;
    tags?: string[];
  };
}

export interface ImageScoreResult {
  image: ProductImage;
  score: number;
  strategy: string;
  reasons: string[];
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => {
    const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
    return regex.test(text);
  });
}

/**
 * Automatically evaluates a list of product images and returns the best candidate for AI Try-On.
 * Selection priority hierarchy:
 * 1. Isolated garment images (transparent or plain white background)
 * 2. Mannequin / ghost-mannequin images
 * 3. Flat lay / apparel lay flat images
 * 4. Clean model-worn front-facing images
 * 5. Fallback images (breaking ties using position-based fallback)
 */
export function selectBestGarmentImage(images: ProductImage[]): ImageScoreResult | null {
  if (!images || images.length === 0) {
    return null;
  }

  const positions = images.map(i => i.position).filter(p => typeof p === 'number');
  const minPos = positions.length > 0 ? Math.min(...positions) : 1;
  const maxPos = positions.length > 0 ? Math.max(...positions) : 1;

  const results: ImageScoreResult[] = images.map((img) => {
    let score = 0;
    const reasons: string[] = [];
    const resolvedUrl = img.url || img.src || '';
    const alt = (img.altText || img.alt || '').toLowerCase();
    
    // Extract filename from URL if not explicitly provided
    let filename = (img.filename || '').toLowerCase();
    if (!filename && resolvedUrl) {
      try {
        const urlParts = resolvedUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        filename = lastPart.split('?')[0].toLowerCase();
      } catch (err) {
        // Fallback
      }
    }

    const textToAnalyze = `${filename} ${alt}`;

    // 1. Plain Background Metadata Signals (+40 points)
    if (img.metadata?.isPlainBackground === true) {
      score += 40;
      reasons.push('Metadata: Explicit plain background (+40)');
    }

    // 2. Human Presence Metadata Signals (-50 points or +30 points)
    if (img.metadata?.hasHuman === true) {
      score -= 50;
      reasons.push('Metadata: Contains human model (-50)');
    } else if (img.metadata?.hasHuman === false) {
      score += 30;
      reasons.push('Metadata: Confirmed no human (+30)');
    }

    // 3. Filename & Alt Text Keyword Analysis
    
    // Highly preferred: Isolated / Cutout / Clean garment (+50 points)
    if (hasKeyword(textToAnalyze, ['isolated', 'cutout', 'white-background', 'white_background', 'clean-background'])) {
      score += 50;
      reasons.push('Keywords: Isolated or cutout garment (+50)');
    }

    // Highly preferred: Mannequin / Ghost / Hanger (+45 points)
    if (hasKeyword(textToAnalyze, ['mannequin', 'ghost', 'hanger', 'dummy'])) {
      score += 45;
      reasons.push('Keywords: Mannequin or hanger (+45)');
    }

    // Preferred: Flat lay (+40 points)
    if (hasKeyword(textToAnalyze, ['flatlay', 'flat-lay', 'flat', 'layflat'])) {
      score += 40;
      reasons.push('Keywords: Flat lay (+40)');
    }

    // Preferred: Product / Garment generic shots (+30 points)
    if (hasKeyword(textToAnalyze, ['garment', 'product', 'item', 'apparel', 'packshot'])) {
      score += 30;
      reasons.push('Keywords: Garment or product shot (+30)');
    }

    // Preferred: Front view (+20 points)
    if (hasKeyword(textToAnalyze, ['front', 'face'])) {
      score += 20;
      reasons.push('Keywords: Front view (+20)');
    }

    // Avoid: Back, side, detail or close-ups (-25 points)
    if (hasKeyword(textToAnalyze, ['back', 'rear', 'side', 'angle', 'detail', 'zoom', 'close-up', 'closeup', 'texture', 'inside', 'tag', 'label'])) {
      score -= 25;
      reasons.push('Keywords: Avoid details/back/side view (-25)');
    }

    // Avoid: Model/Lifestyle (-30 points)
    if (hasKeyword(textToAnalyze, ['model', 'wear', 'wearing', 'lifestyle', 'lookbook', 'street', 'editorial', 'outdoor', 'action', 'fit', 'body'])) {
      score -= 30;
      reasons.push('Keywords: Model-worn or lifestyle (-30)');
    }

    // 4. Position Preference (First/Last image scored gracefully)
    if (img.position === minPos) {
      score += 2;
      reasons.push('Position: First image preference (+2)');
    } else if (img.position === maxPos && maxPos !== minPos) {
      score += 1;
      reasons.push('Position: Last image preference (+1)');
    }

    return {
      image: img,
      score,
      strategy: reasons.length > 0 ? 'heuristic' : 'fallback',
      reasons
    };
  });

  // Sort results:
  // 1. Descending by score
  // 2. Ascending by position (preferring first-image fallback if scores are tied)
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.image.position - b.image.position;
  });

  return results[0];
}
