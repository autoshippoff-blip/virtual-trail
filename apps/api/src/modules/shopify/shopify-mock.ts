import { ShopifyService } from './shopify.service';
import { ShopifyWebhooks } from './shopify.webhooks';
import { prisma } from '@trail/db';
import { Redis } from 'ioredis';
import { config as appConfig } from '@trail/config';
import assert from 'assert';

console.log('Running Offline Shopify Integration Layer Mock Tests...\n');

async function runTests() {
  const service = new ShopifyService();
  const webhooks = new ShopifyWebhooks(service);
  const redis = new Redis(appConfig.redis.url, { maxRetriesPerRequest: null });

  const mockShop = 'vtrail-dev-store.myshopify.com';
  const tenantId = 'vtrail-dev-store';

  try {
    // -------------------------------------------------------------
    // Test Case 1: Tenant Auto-Onboarding & Config Setup
    // -------------------------------------------------------------
    console.log('Test Case 1: Onboarding Tenant...');
    const tenant = await service.onboardTenant(mockShop);
    assert.strictEqual(tenant.id, tenantId);
    assert.strictEqual(tenant.shopifyDomain, mockShop);
    assert.deepStrictEqual(tenant.features, ['tryon']);

    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId },
    });
    assert.ok(config);
    assert.strictEqual(config.primaryColor, '#000000');
    assert.strictEqual(config.complimentTone, 'friendly');
    console.log('-> [PASS] Onboarding completed and verified in database.');

    // -------------------------------------------------------------
    // Test Case 2: Access Token Storage
    // -------------------------------------------------------------
    console.log('\nTest Case 2: Saving Access Token to Redis...');
    const mockToken = 'shpat_test_token_998877';
    await service.saveAccessToken(mockShop, mockToken);

    const retrievedToken = await service.getAccessToken(mockShop);
    assert.strictEqual(retrievedToken, mockToken);
    console.log('-> [PASS] Access token successfully cached and retrieved from Redis.');

    // -------------------------------------------------------------
    // Test Case 3: Product Catalog Sync with Image Selection Heuristics
    // -------------------------------------------------------------
    console.log('\nTest Case 3: Syncing Product Catalog...');
    await service.syncProducts(tenantId, mockShop, mockToken);

    // Verify synced products in Neon PostgreSQL database
    const products = await prisma.product.findMany({
      where: { tenantId },
    });
    assert.strictEqual(products.length, 3);

    // Verify Denim Jacket selection: flatlay (position 2) is preferred over lifestyle (position 1)
    const denim = products.find((p) => p.shopifyProductId === '1001');
    assert.ok(denim);
    assert.strictEqual(denim.imageUrl, 'https://example.com/denim_flatlay.jpg');

    // Verify Tee selection: isolated (position 2) is preferred over model (position 1)
    const tee = products.find((p) => p.shopifyProductId === '1002');
    assert.ok(tee);
    assert.strictEqual(tee.imageUrl, 'https://example.com/tee_isolated.jpg');

    // Verify Dress selection: mannequin (position 2) is preferred over closeup detail (position 1)
    const dress = products.find((p) => p.shopifyProductId === '1003');
    assert.ok(dress);
    assert.strictEqual(dress.imageUrl, 'https://example.com/dress_mannequin.jpg');

    console.log('-> [PASS] Products synced and image heuristics selected best garment images successfully.');

    // -------------------------------------------------------------
    // Test Case 4: Webhook Products Create/Update Event
    // -------------------------------------------------------------
    console.log('\nTest Case 4: Testing Product Update Webhook...');
    const updatedPayload = {
      id: 1001,
      title: 'Mock Denim Jacket - Updated',
      images: [
        {
          id: 1101,
          position: 1,
          src: 'https://example.com/denim_lifestyle.jpg',
        },
        {
          id: 1102,
          position: 2,
          src: 'https://example.com/denim_flatlay.jpg',
        },
        {
          id: 1103,
          position: 3,
          src: 'https://example.com/denim_new_isolated.jpg',
          alt: 'Isolated denim jacket on plain white background',
        },
      ],
    };

    // Invoke update webhook
    await webhooks.handleWebhook('products/update', mockShop, updatedPayload);

    // Re-verify Denim Jacket has selected the new isolated image
    const updatedDenim = await prisma.product.findUnique({
      where: {
        tenantId_shopifyProductId: {
          tenantId,
          shopifyProductId: '1001',
        },
      },
    });
    assert.ok(updatedDenim);
    assert.strictEqual(updatedDenim.imageUrl, 'https://example.com/denim_new_isolated.jpg');
    console.log('-> [PASS] Webhook product update parsed and image heuristic updated database.');

    // -------------------------------------------------------------
    // Test Case 5: Webhook Product Delete Event
    // -------------------------------------------------------------
    console.log('\nTest Case 5: Testing Product Delete Webhook...');
    const deletePayload = { id: 1003 }; // Mock Ghost Mannequin Dress
    await webhooks.handleWebhook('products/delete', mockShop, deletePayload);

    const deletedDress = await prisma.product.findUnique({
      where: {
        tenantId_shopifyProductId: {
          tenantId,
          shopifyProductId: '1003',
        },
      },
    });
    assert.strictEqual(deletedDress, null);
    console.log('-> [PASS] Webhook product delete removed product from database.');

    // -------------------------------------------------------------
    // Test Case 6: Uninstall Webhook and Cleanup
    // -------------------------------------------------------------
    console.log('\nTest Case 6: Uninstall Webhook Execution...');
    await webhooks.handleWebhook('app/uninstalled', mockShop, {});

    // Verify tenant features are deactivated
    const deactivatedTenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: mockShop },
    });
    assert.ok(deactivatedTenant);
    assert.deepStrictEqual(deactivatedTenant.features, []);

    // Verify Redis access token is purged
    const deletedToken = await redis.get(`shopify:${mockShop}:token`);
    assert.strictEqual(deletedToken, null);
    console.log('-> [PASS] Webhook app/uninstalled successfully deactivated features and cleaned up Redis token cache.');

    // Clean up test records from database
    console.log('\nCleaning up database test entries...');
    await prisma.product.deleteMany({ where: { tenantId } });
    await prisma.tenantConfig.delete({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });

    console.log('\nAll Shopify integration tests completed successfully!');
  } catch (err: any) {
    console.error('\n[FAIL] Shopify mock test run failed:');
    console.error(err);
    // Cleanup on failure
    await prisma.product.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.tenantConfig.delete({ where: { tenantId } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

runTests();
