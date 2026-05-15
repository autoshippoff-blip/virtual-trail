const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_RESULTS === 'true' || true;

const MOCK_STATE: Record<string, number> = {};

export async function startTryOn(tenantId: string, productId: string, userImage: string): Promise<string> {
  if (USE_MOCK) {
    console.log('Mock Mode: Starting try-on');
    const jobId = 'mock-job-' + Math.random().toString(36).substring(7);
    MOCK_STATE[jobId] = 0;
    return jobId;
  }

  const response = await fetch(`${API_URL}/v1/tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, productId, userImage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start try-on');
  }

  const data = await response.json();
  return data.jobId;
}

export async function getTryOnStatus(tenantId: string, jobId: string) {
  if (USE_MOCK && jobId.startsWith('mock-job')) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
    
    const count = MOCK_STATE[jobId] || 0;
    MOCK_STATE[jobId] = count + 1;

    console.log(`Mock Polling: ${jobId}, attempt: ${count}`);

    if (count < 4) { // Complete after 4 polls
      return { status: 'processing' };
    }

    return {
      status: 'completed',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
      compliment: "This outfit perfectly complements your style! The fit is impeccable and the color palette really makes the look pop.",
      styleScore: 9.2,
      complimentCached: false
    };
  }

  const response = await fetch(`${API_URL}/v1/tryon/${jobId}?tenantId=${tenantId}`);
  if (!response.ok) throw new Error('Failed to fetch status');
  return await response.json();
}
