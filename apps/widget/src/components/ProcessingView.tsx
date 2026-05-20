import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import usePolling from '../hooks/usePolling';

const STATUS_MESSAGES = [
  'Analyzing your photo…',
  'Matching garment fit…',
  'Generating your look…',
  'Applying AI styling…',
  'Adding finishing touches…',
];

const ProcessingView: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const { userImage, jobId, tenantId } = useStore();

  // Initialize polling (unchanged)
  usePolling(tenantId!, jobId);

  // Realistic progress simulator
  useEffect(() => {
    let active = true;
    const simulateProgress = () => {
      if (!active) return;
      setProgress((prev) => {
        if (prev >= 99) return 99;
        let inc = 0;
        let delay = 500;
        if (prev < 45) { inc = Math.floor(Math.random() * 8) + 4; delay = Math.floor(Math.random() * 300) + 200; }
        else if (prev < 75) { inc = Math.floor(Math.random() * 3) + 1; delay = Math.floor(Math.random() * 600) + 400; }
        else if (prev < 92) { inc = Math.random() > 0.3 ? 1 : 0; delay = Math.floor(Math.random() * 1000) + 800; }
        else { inc = Math.random() > 0.8 ? 1 : 0; delay = Math.floor(Math.random() * 1500) + 1000; }
        setTimeout(simulateProgress, delay);
        return Math.min(prev + inc, 99);
      });
    };
    setTimeout(simulateProgress, 100);
    return () => { active = false; };
  }, []);

  // Status message carousel
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const barColor = `linear-gradient(90deg, #FF5A5F, #7C3AED)`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: 'var(--vt-font, Inter, system-ui, sans-serif)',
        color: '#F5F5F5',
        background: 'rgba(15,17,21,0.5)',
      }}
    >
      {/* Indeterminate top progress bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <motion.div
          animate={{ left: ['-35%', '120%'] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '40%',
            background: barColor,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Photo scan card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
        style={{
          position: 'relative',
          width: 168,
          height: 210,
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255,90,95,0.25)',
          boxShadow: '0 0 40px rgba(255,90,95,0.15), 0 8px 32px rgba(0,0,0,0.5)',
          marginBottom: 28,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        {userImage ? (
          <img
            src={userImage}
            alt="Your photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(0.4px)', opacity: 0.85 }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255,90,95,0.08), rgba(124,58,237,0.08))',
          }}>
            {/* Skeleton shimmer */}
            <div className="vt-skeleton" style={{ width: '100%', height: '100%' }} />
          </div>
        )}
        {/* Scan line */}
        <div className="vt-scan-line" />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,17,21,0.55) 0%, transparent 60%)',
        }} />
      </motion.div>

      {/* Animated status messages */}
      <div style={{ height: 24, overflow: 'hidden', marginBottom: 20, width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5', letterSpacing: '0.01em' }}
          >
            {STATUS_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Determinate progress bar */}
      <div style={{
        width: '100%',
        maxWidth: 260,
        height: 5,
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        marginBottom: 10,
      }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: barColor,
            borderRadius: 9999,
            boxShadow: '0 0 8px rgba(255,90,95,0.5)',
          }}
        />
      </div>

      {/* Percentage */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 260,
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(245,245,245,0.4)', fontWeight: 500 }}>AI Engine</span>
        <motion.span
          key={progress}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 11, fontWeight: 700, color: '#FF5A5F' }}
        >
          {progress}%
        </motion.span>
      </div>

      {/* Footer note */}
      <p style={{
        fontSize: 11,
        color: 'rgba(245,245,245,0.3)',
        maxWidth: 220,
        lineHeight: 1.7,
      }}>
        AI is tailoring your look. Usually takes 15–25 seconds.
      </p>
    </motion.div>
  );
};

export default ProcessingView;
