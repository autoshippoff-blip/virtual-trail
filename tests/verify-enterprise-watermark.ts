import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { applyWatermarkWithMetrics } from '@trail/ai';

async function verifyPushChecklist() {
  console.log('=====================================================');
  console.log('       AGENT_TASK_020 FINAL PUSH CHECKLIST           ');
  console.log('=====================================================\n');

  const sampleImagePath = path.join(__dirname, '../test-assets/good/person1.jpg');
  const cornerLogoPath = path.join(__dirname, '../MomzCradle_Water_mark.png');
  const outDir = path.join(__dirname, '../test-assets/outputs');
  const artifactDir = 'C:/Users/vishnusundar/.gemini/antigravity-ide/brain/b95612e1-3ae2-4179-97b8-abf77bb95c76';

  if (!fs.existsSync(sampleImagePath)) {
    throw new Error(`Sample image missing at: ${sampleImagePath}`);
  }

  const baseBuffer = fs.readFileSync(sampleImagePath);

  // Warm up daemon fontconfig cache
  await applyWatermarkWithMetrics(baseBuffer, { type: 'pattern-text', text: 'warmup' });

  // CHECKLIST ITEM 1 & 3: Verify both modes across multiple merchant names
  console.log('✅ 1 & 3. Testing Both Modes & Multiple Merchants (XML Escaping) ---');
  const merchants = [
    'Momzcradle',
    'Fashion Store',
    'ABC & Sons',
    'Kids < Fashion',
  ];

  for (const m of merchants) {
    const res = await applyWatermarkWithMetrics(baseBuffer, {
      type: 'pattern-text',
      text: m,
      tenantId: `tenant_${m}`,
    });
    if (!res.metrics.watermarkApplied) {
      throw new Error(`Failed pattern watermark for merchant: ${m}`);
    }
    console.log(`   [✓] Renders cleanly for: "${m}" (${res.metrics.durationMs}ms)`);
  }

  const cornerRes = await applyWatermarkWithMetrics(baseBuffer, {
    type: 'corner-logo',
    keyOrUrl: cornerLogoPath,
    scale: 0.21,
  });
  if (!cornerRes.metrics.watermarkApplied) {
    throw new Error('Corner logo failed!');
  }
  console.log('   [✓] Corner logo verified successfully.\n');

  // CHECKLIST ITEM 2: Multiple Image Sizes (Portrait 600x900, Square 1024x1024, Landscape 1200x800)
  console.log('✅ 2. Testing Multiple Aspect Ratios & Resolutions ---');
  const sizes = [
    { name: 'Portrait', w: 600, h: 900 },
    { name: 'Square', w: 1024, h: 1024 },
    { name: 'Landscape', w: 1200, h: 800 },
  ];

  for (const s of sizes) {
    const resizedBuffer = await sharp(baseBuffer).resize(s.w, s.h).toBuffer();
    const res = await applyWatermarkWithMetrics(resizedBuffer, {
      type: 'pattern-text',
      text: `Virtual-Trail ${s.name}`,
    });
    const meta = await sharp(res.buffer).metadata();
    if (meta.width !== s.w || meta.height !== s.h || !res.metrics.watermarkApplied) {
      throw new Error(`Size test failed for aspect: ${s.name}`);
    }
    console.log(`   [✓] ${s.name} (${s.w}x${s.h}) scaled & composited properly.`);
    fs.writeFileSync(path.join(outDir, `verify_push_${s.name.toLowerCase()}.jpg`), res.buffer);
    if (fs.existsSync(artifactDir)) {
      fs.writeFileSync(path.join(artifactDir, `verify_push_${s.name.toLowerCase()}.jpg`), res.buffer);
    }
  }
  console.log('');

  // CHECKLIST ITEM 4: Test Smart Auto-Fallback & Fault Tolerance
  console.log('✅ 4. Testing Smart Auto-Fallback (Simulating Missing/Broken Corner Logo) ---');
  const smartMissing = await applyWatermarkWithMetrics(baseBuffer, {
    type: 'corner-logo',
    keyOrUrl: null,
    text: 'Thottil Maternity Client',
  });
  if (!smartMissing.metrics.watermarkApplied || smartMissing.metrics.watermarkType !== 'pattern-text') {
    throw new Error('Smart fallback for missing logo failed!');
  }
  console.log('   [✓] Missing corner logo automatically fell back to pattern-text branding.');

  const smartBroken = await applyWatermarkWithMetrics(baseBuffer, {
    type: 'corner-logo',
    keyOrUrl: '/invalid/path/that/does/not/exist.png',
    text: 'Thottil Maternity Client',
  });
  if (!smartBroken.metrics.watermarkApplied || smartBroken.metrics.watermarkType !== 'pattern-text') {
    throw new Error('Smart fallback for broken logo URL failed!');
  }
  console.log('   [✓] Broken logo URL (404) automatically fell back to pattern-text branding.');
  fs.writeFileSync(path.join(outDir, 'verify_client_fix.jpg'), smartBroken.buffer);
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'verify_client_fix.jpg'), smartBroken.buffer);
  }
  console.log('✅ Fixed client website proof saved: verify_client_fix.jpg\n');

  console.log('=====================================================');
  console.log('       ALL CHECKLIST TESTS PASSED 100%!              ');
  console.log('=====================================================');
}

verifyPushChecklist().catch((err) => {
  console.error('❌ Push Checklist Failed:', err);
  process.exit(1);
});
