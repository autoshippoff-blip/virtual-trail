import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorToastProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const FRIENDLY_MESSAGES: Record<string, { title: string; body: string }> = {
  face: {
    title: 'No Face Detected',
    body: "We couldn't see a clear face in your photo. Try a well-lit, front-facing selfie with your full head visible.",
  },
  selfie: {
    title: 'No Face Detected',
    body: "We couldn't see a clear face in your photo. Try a well-lit, front-facing selfie with your full head visible.",
  },
  format: {
    title: 'Unsupported Photo Format',
    body: 'Please upload a standard portrait photo (JPEG or PNG, under 5 MB) for the best results.',
  },
  size: {
    title: 'Photo Too Large',
    body: 'Please use a photo under 5 MB for the smoothest try-on experience.',
  },
  timeout: {
    title: 'Still Working…',
    body: 'Our AI is taking a little longer than usual. Tap "Try Again" to resubmit your look.',
  },
  busy: {
    title: 'Engine Busy',
    body: 'All styling instances are currently active. Please try again in a moment.',
  },
};

function getFriendlyMessage(raw: string): { title: string; body: string } {
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(FRIENDLY_MESSAGES)) {
    if (lower.includes(key)) return val;
  }
  return {
    title: 'Something Went Wrong',
    body: "We couldn't process this image. Please try another photo with better lighting.",
  };
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message = '', onRetry, onDismiss }) => {
  const { title, body } = getFriendlyMessage(message);

  return (
    <AnimatePresence>
      <motion.div
        key="error-toast"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '32px 24px',
          textAlign: 'center',
          fontFamily: 'var(--vt-font, Inter, system-ui, sans-serif)',
          color: 'var(--vt-text, #F5F5F5)',
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,90,95,0.15)',
            border: '1px solid rgba(255,90,95,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <AlertCircle style={{ width: 28, height: 28, color: '#FF5A5F' }} />
        </motion.div>

        {/* Text */}
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#F5F5F5' }}>{title}</h3>
        <p style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: 'rgba(245,245,245,0.60)',
          maxWidth: 260,
          marginBottom: 28,
        }}>
          {body}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              aria-label="Try again"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 24px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #FF5A5F, #7C3AED)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255,90,95,0.4)',
              }}
            >
              <RefreshCcw style={{ width: 15, height: 15 }} />
              Try Again
            </motion.button>
          )}
          {onDismiss && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              aria-label="Dismiss"
              style={{
                padding: '11px 20px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(245,245,245,0.7)',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorToast;
