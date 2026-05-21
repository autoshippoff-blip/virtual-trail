import { selectBestGarmentImage, ProductImage } from './image-selection';
import assert from 'assert';

console.log('Running Smart Garment Image Selection Tests...\n');

// Helper to print test result
function runTestCase(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err: any) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Scenario 1: Isolated garment image (high score expected)
runTestCase('Scenario 1: Isolated garment image preferred over model photo', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/model_wearing.jpg',
      altText: 'Model wearing red t-shirt in street style'
    },
    {
      position: 2,
      url: 'https://example.com/product_isolated.jpg',
      altText: 'Isolated red t-shirt on white background'
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  assert.strictEqual(result.image.url, 'https://example.com/product_isolated.jpg');
  assert.ok(result.score > 0);
  assert.ok(result.reasons.some(r => r.includes('Isolated')));
});

// Scenario 2: Product with mannequin image
runTestCase('Scenario 2: Mannequin image preferred over back view details', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/back_view.jpg',
      altText: 'Back detail closeup'
    },
    {
      position: 2,
      url: 'https://example.com/front_mannequin.jpg',
      altText: 'Ghost mannequin display front'
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  assert.strictEqual(result.image.url, 'https://example.com/front_mannequin.jpg');
  assert.ok(result.reasons.some(r => r.includes('Mannequin')));
});

// Scenario 3: Product with only model photos
runTestCase('Scenario 3: Front view model photo preferred over back view model photo', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/model_back.jpg',
      altText: 'Model back view'
    },
    {
      position: 2,
      url: 'https://example.com/model_front.jpg',
      altText: 'Model front view'
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  assert.strictEqual(result.image.url, 'https://example.com/model_front.jpg');
});

// Scenario 4: Mixed ecommerce gallery
runTestCase('Scenario 4: Flat lay selected from mixed ecommerce gallery', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/lifestyle.jpg',
      altText: 'Lifestyle shot'
    },
    {
      position: 2,
      url: 'https://example.com/flatlay.jpg',
      altText: 'Flat lay shirt'
    },
    {
      position: 3,
      url: 'https://example.com/closeup.jpg',
      altText: 'Closeup of stitches'
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  assert.strictEqual(result.image.url, 'https://example.com/flatlay.jpg');
  assert.ok(result.reasons.some(r => r.includes('Flat lay')));
});

// Scenario 5: Tie breaking / Fallback to first image
runTestCase('Scenario 5: Falls back to first image when scores are equal', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/img1.jpg',
      altText: 'No keywords'
    },
    {
      position: 2,
      url: 'https://example.com/img2.jpg',
      altText: 'No keywords'
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  // Both images have no keywords. Position 1 gets +2 bonus, Position 2 gets +1 bonus.
  // Thus Position 1 has higher score. Even if they had exactly equal scores, sorting falls back to first.
  assert.strictEqual(result.image.url, 'https://example.com/img1.jpg');
});

// Scenario 6: Metadata override
runTestCase('Scenario 6: Metadata overrides keyword checks', () => {
  const images: ProductImage[] = [
    {
      position: 1,
      url: 'https://example.com/isolated_on_model.jpg',
      altText: 'Isolated cutout look',
      metadata: { hasHuman: true } // -50 penalty outweighs +50 isolated keyword
    },
    {
      position: 2,
      url: 'https://example.com/img2.jpg',
      metadata: { isPlainBackground: true } // +40
    }
  ];

  const result = selectBestGarmentImage(images);
  assert.ok(result);
  assert.strictEqual(result.image.url, 'https://example.com/img2.jpg');
});

console.log('\nAll tests completed successfully!');
