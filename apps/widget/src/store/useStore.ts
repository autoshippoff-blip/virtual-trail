import { create } from 'zustand';

export type WidgetStatus = 'idle' | 'uploading' | 'queued' | 'polling' | 'completed' | 'failed' | 'timeout';

interface WidgetState {
  status: WidgetStatus;
  jobId: string | null;
  userImage: string | null;
  resultImage: string | null;
  compliment: string | null;
  styleScore: number | null;
  error: string | null;
  config: {
    primaryColor: string;
    complimentTone: string;
    features: string[];
  } | null;

  // Actions
  setStatus: (status: WidgetStatus) => void;
  setJobId: (id: string | null) => void;
  setUserImage: (image: string | null) => void;
  setResult: (data: { image: string; compliment: string; score: number }) => void;
  setError: (error: string | null) => void;
  setConfig: (config: WidgetState['config']) => void;
  reset: () => void;
}

export const useStore = create<WidgetState>((set) => ({
  status: 'idle',
  jobId: null,
  userImage: null,
  resultImage: null,
  compliment: null,
  styleScore: null,
  error: null,
  config: null,

  setStatus: (status) => set({ status }),
  setJobId: (jobId) => set({ jobId }),
  setUserImage: (userImage) => set({ userImage }),
  setResult: (data) => set({
    resultImage: data.image,
    compliment: data.compliment,
    styleScore: data.score,
    status: 'completed',
  }),
  setError: (error) => set({ error, status: 'failed' }),
  setConfig: (config) => set({ config }),
  reset: () => set({
    status: 'idle',
    jobId: null,
    userImage: null,
    resultImage: null,
    compliment: null,
    styleScore: null,
    error: null,
  }),
}));
