import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { startTryOn } from '../utils/api';

interface CameraTabProps {
  productId: string;
  tenantId: string;
}

const CameraTab: React.FC<CameraTabProps> = ({ productId, tenantId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setStatus, setJobId, setUserImage, setError, config } = useStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const theme = config?.widgetTheme || 'light';
  const btnStyle = config?.buttonStyle || 'rounded';
  const radius = btnStyle === 'square' ? '0px' : btnStyle === 'capsule' ? '9999px' : '16px';
  const primaryColor = config?.primaryColor || '#000000';

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } } 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error('Camera access failed', err);
      alert('Could not access camera. Please use upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
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
    <div className="tryon-p-6 tryon-h-full tryon-flex tryon-flex-col">
      <div className="tryon-flex-1 tryon-relative tryon-bg-black tryon-rounded-xl tryon-overflow-hidden">
        {capturedImage ? (
          <img src={capturedImage} className="tryon-w-full tryon-h-full tryon-object-cover" alt="Captured" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="tryon-w-full tryon-h-full tryon-object-cover tryon-scale-x-[-1]"
            />
            {/* Viewfinder Overlay */}
            <div className="tryon-absolute tryon-inset-0 tryon-pointer-events-none tryon-flex tryon-items-center tryon-justify-center tryon-p-8">
              <div className="tryon-w-full tryon-max-w-[220px] tryon-aspect-[3/4] tryon-relative">
                <div className="tryon-absolute tryon-top-0 tryon-left-0 tryon-w-8 tryon-h-8 tryon-border-t-[3px] tryon-border-l-[3px] tryon-border-white/70 tryon-rounded-tl-xl" />
                <div className="tryon-absolute tryon-top-0 tryon-right-0 tryon-w-8 tryon-h-8 tryon-border-t-[3px] tryon-border-r-[3px] tryon-border-white/70 tryon-rounded-tr-xl" />
                <div className="tryon-absolute tryon-bottom-0 tryon-left-0 tryon-w-8 tryon-h-8 tryon-border-b-[3px] tryon-border-l-[3px] tryon-border-white/70 tryon-rounded-bl-xl" />
                <div className="tryon-absolute tryon-bottom-0 tryon-right-0 tryon-w-8 tryon-h-8 tryon-border-b-[3px] tryon-border-r-[3px] tryon-border-white/70 tryon-rounded-br-xl" />
                <div className="tryon-absolute -tryon-bottom-8 tryon-left-0 tryon-w-full tryon-text-center">
                  <span className="tryon-text-white/80 tryon-text-[10px] tryon-font-bold tryon-uppercase tryon-tracking-[0.2em] tryon-drop-shadow-md">Face Guide</span>
                </div>
              </div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="tryon-hidden" />
      </div>

      <div className="tryon-mt-6 tryon-flex tryon-justify-center tryon-gap-4">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="tryon-flex tryon-items-center tryon-gap-2 tryon-px-6 tryon-py-3 tryon-font-medium tryon-transition-all tryon-active:scale-95"
              style={{
                backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                color: theme === 'dark' ? '#fff' : '#0f172a',
                borderRadius: radius,
              }}
            >
              <RotateCcw className="tryon-w-5 tryon-h-5" />
              Retake
            </button>
            <button
              onClick={confirm}
              className="tryon-flex tryon-items-center tryon-gap-2 tryon-px-6 tryon-py-3 tryon-text-white tryon-font-medium tryon-transition-all tryon-active:scale-95"
              style={{
                backgroundColor: primaryColor,
                borderRadius: radius,
              }}
            >
              <Check className="tryon-w-5 tryon-h-5" />
              Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={capture}
            className="tryon-group tryon-w-16 tryon-h-16 tryon-bg-white tryon-border-[3px] tryon-rounded-full tryon-flex tryon-items-center tryon-justify-center tryon-shadow-[0_0_20px_rgba(0,0,0,0.1)] tryon-transition-all tryon-hover:scale-105 tryon-active:scale-95"
            style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}
          >
            <div className="tryon-w-12 tryon-h-12 tryon-rounded-full tryon-transition-all tryon-duration-300 tryon-group-hover:scale-95 tryon-shadow-inner" style={{ backgroundColor: primaryColor }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraTab;
