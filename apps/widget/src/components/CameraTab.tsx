import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Camera, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { startTryOn } from '../utils/api';

interface CameraTabProps {
  productId: string;
  tenantId: string;
}

const CameraTab: React.FC<CameraTabProps> = ({ productId, tenantId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setStatus, setJobId, setUserImage, setError } = useStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Allow Enter key to capture
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !capturedImage) capture();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capturedImage, stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraError(null);
    } catch {
      setCameraError("Camera access was denied. Please allow camera access or use the Upload tab instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.87);
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        setCapturedImage(base64);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = async () => {
    if (capturedImage) {
      setUserImage(capturedImage);
      setStatus('uploading');
      try {
        const jobId = await startTryOn(tenantId, productId, capturedImage);
        setJobId(jobId);
        setStatus('queued');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div style={{
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      fontFamily: 'var(--vt-font, Inter, system-ui, sans-serif)',
      color: '#F5F5F5',
    }}>
      {/* Camera viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0a0c10',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: 220,
      }}>
        {cameraError ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}>
            <AlertCircle style={{ width: 36, height: 36, color: '#FF5A5F' }} />
            <p style={{ fontSize: 13, color: 'rgba(245,245,245,0.6)', lineHeight: 1.6 }}>{cameraError}</p>
          </div>
        ) : capturedImage ? (
          <motion.img
            key="captured"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={capturedImage}
            alt="Captured photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Camera viewfinder"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {/* Face guide overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
            }}>
              <div style={{ width: '100%', maxWidth: 180, aspectRatio: '3/4', position: 'relative' }}>
                {/* Corner guides */}
                {[
                  { top: 0, left: 0, borderTop: '3px solid rgba(255,90,95,0.8)', borderLeft: '3px solid rgba(255,90,95,0.8)', borderRadius: '10px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid rgba(255,90,95,0.8)', borderRight: '3px solid rgba(255,90,95,0.8)', borderRadius: '0 10px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid rgba(255,90,95,0.8)', borderLeft: '3px solid rgba(255,90,95,0.8)', borderRadius: '0 0 0 10px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid rgba(255,90,95,0.8)', borderRight: '3px solid rgba(255,90,95,0.8)', borderRadius: '0 0 10px 0' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
                ))}
                <p style={{
                  position: 'absolute',
                  bottom: -28,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.65)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}>
                  Face Guide
                </p>
              </div>
            </div>
          </>
        )}

        {/* Flash effect */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: 16 }}
            />
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, paddingBottom: 4 }}>
        {capturedImage ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={retake}
              aria-label="Retake photo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '11px 20px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(245,245,245,0.8)',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw style={{ width: 15, height: 15 }} />
              Retake
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(255,90,95,0.45)' }}
              whileTap={{ scale: 0.94 }}
              onClick={confirm}
              aria-label="Use this photo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '11px 24px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #FF5A5F, #7C3AED)',
                border: 'none',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255,90,95,0.35)',
              }}
            >
              <Check style={{ width: 15, height: 15 }} />
              Use Photo
            </motion.button>
          </>
        ) : (
          <motion.button
            animate={{ boxShadow: ['0 0 0 0 rgba(255,90,95,0.5)', '0 0 0 14px rgba(255,90,95,0)', '0 0 0 0 rgba(255,90,95,0.5)'] }}
            transition={{ repeat: Infinity, duration: 2.0 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.92 }}
            onClick={capture}
            aria-label="Capture photo (or press Enter)"
            disabled={!stream}
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '3px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: stream ? 'pointer' : 'not-allowed',
              opacity: stream ? 1 : 0.4,
            }}
          >
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: stream ? 'linear-gradient(135deg, #FF5A5F, #7C3AED)' : '#555',
              boxShadow: stream ? '0 0 16px rgba(255,90,95,0.5)' : 'none',
            }} />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default CameraTab;
