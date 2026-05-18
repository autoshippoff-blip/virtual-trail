import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Camera, Upload, Loader2, UserX, FileX, Clock, AlertTriangle } from 'lucide-react';
import UploadTab from './UploadTab';
import CameraTab from './CameraTab';
import ProcessingView from './ProcessingView';
import ResultView from './ResultView';

interface ModalProps {
  onClose: () => void;
  productId: string;
  tenantId: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, productId, tenantId }) => {
  const { status, reset, error, config } = useStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');

  const handleClose = () => {
    reset();
    onClose();
  };

  const theme = config?.widgetTheme || 'light';
  const btnStyle = config?.buttonStyle || 'rounded';
  const radius = btnStyle === 'square' ? '0px' : btnStyle === 'capsule' ? '9999px' : '16px';
  const primaryColor = config?.primaryColor || '#000000';
  
  // Theme class mappings
  const bgClass = theme === 'dark' 
    ? 'tryon-bg-slate-950 tryon-text-white' 
    : theme === 'glassmorphism'
    ? 'tryon-bg-white/70 tryon-backdrop-blur-md tryon-text-slate-900'
    : 'tryon-bg-white tryon-text-slate-900';

  const borderClass = theme === 'dark' 
    ? 'tryon-border-slate-800' 
    : 'tryon-border-slate-100';

  const textMutedClass = theme === 'dark' 
    ? 'tryon-text-slate-400' 
    : 'tryon-text-slate-500';

  const textHeadingClass = theme === 'dark'
    ? 'tryon-text-slate-100'
    : 'tryon-text-slate-900';

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="tryon-flex tryon-flex-col tryon-h-full">
            <div className={`tryon-flex tryon-border-b ${borderClass}`}>
              <button
                onClick={() => setActiveTab('upload')}
                className={`tryon-flex-1 tryon-py-4 tryon-text-sm tryon-font-medium tryon-transition-colors`}
                style={{
                  borderBottom: activeTab === 'upload' ? `2px solid ${primaryColor}` : 'none',
                  color: activeTab === 'upload' 
                    ? (theme === 'dark' ? '#fff' : '#0f172a') 
                    : (theme === 'dark' ? '#64748b' : '#94a3b8'),
                }}
              >
                <div className="tryon-flex tryon-items-center tryon-justify-center tryon-gap-2">
                  <Upload className="tryon-w-4 tryon-h-4" />
                  Upload
                </div>
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`tryon-flex-1 tryon-py-4 tryon-text-sm tryon-font-medium tryon-transition-colors`}
                style={{
                  borderBottom: activeTab === 'camera' ? `2px solid ${primaryColor}` : 'none',
                  color: activeTab === 'camera' 
                    ? (theme === 'dark' ? '#fff' : '#0f172a') 
                    : (theme === 'dark' ? '#64748b' : '#94a3b8'),
                }}
              >
                <div className="tryon-flex tryon-items-center tryon-justify-center tryon-gap-2">
                  <Camera className="tryon-w-4 tryon-h-4" />
                  Camera
                </div>
              </button>
            </div>
            <div className="tryon-flex-1 tryon-overflow-y-auto">
              {activeTab === 'upload' ? <UploadTab productId={productId} tenantId={tenantId} /> : <CameraTab productId={productId} tenantId={tenantId} />}
            </div>
          </div>
        );
      case 'uploading':
      case 'queued':
      case 'polling':
        return <ProcessingView />;
      case 'completed':
        return <ResultView onClose={handleClose} />;
      case 'failed':
      case 'timeout': {
        const errLower = (error || '').toLowerCase();
        let errorTitle = 'Something went wrong';
        let errorDesc = 'Please try again or use a different photo.';
        let ErrorIcon = X;
        let iconBg = 'tryon-bg-red-50';
        let iconColor = 'tryon-text-red-500';

        if (errLower.includes('face') || errLower.includes('selfie') || errLower.includes('person') || errLower.includes('detect')) {
          errorTitle = 'No Face Detected';
          errorDesc = 'We couldn\'t detect a clear face in your photo. Make sure your head is fully visible and looking straight ahead!';
          ErrorIcon = UserX;
          iconBg = 'tryon-bg-amber-50';
          iconColor = 'tryon-text-amber-600';
        } else if (errLower.includes('format') || errLower.includes('unsupported') || errLower.includes('size') || errLower.includes('type')) {
          errorTitle = 'Unsupported Photo';
          errorDesc = 'Please upload a standard portrait photo (JPEG or PNG) under 5MB for the best try-on styling results.';
          ErrorIcon = FileX;
          iconBg = 'tryon-bg-cyan-50';
          iconColor = 'tryon-text-cyan-600';
        } else if (status === 'timeout' || errLower.includes('timeout') || errLower.includes('timed out')) {
          errorTitle = 'Processing Timeout';
          errorDesc = 'Our AI engines are currently taking a little longer than usual. Tap try again to resubmit your look!';
          ErrorIcon = Clock;
          iconBg = 'tryon-bg-indigo-50';
          iconColor = 'tryon-text-indigo-600';
        } else if (errLower.includes('queue') || errLower.includes('model') || errLower.includes('busy') || errLower.includes('fail')) {
          errorTitle = 'Engine is Busy';
          errorDesc = 'All AI styling instances are actively tailoring shopify garments. Let\'s resubmit your look!';
          ErrorIcon = AlertTriangle;
          iconBg = 'tryon-bg-rose-50';
          iconColor = 'tryon-text-rose-600';
        }

        return (
          <div className="tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-h-full tryon-p-8 tryon-text-center tryon-fade-in-up">
            <div className={`tryon-w-16 tryon-h-16 ${iconBg} ${iconColor} tryon-rounded-full tryon-flex tryon-items-center tryon-justify-center tryon-mb-5 tryon-shadow-sm`}>
              <ErrorIcon className="tryon-w-8 tryon-h-8" />
            </div>
            <h3 className={`tryon-text-lg tryon-font-semibold tryon-mb-2 ${textHeadingClass}`}>{errorTitle}</h3>
            <p className={`tryon-text-sm tryon-max-w-xs tryon-mb-6 tryon-leading-relaxed ${textMutedClass}`}>{errorDesc}</p>
            <button
              onClick={reset}
              className="tryon-px-8 tryon-py-3 tryon-text-white tryon-font-semibold tryon-text-sm tryon-transition-all tryon-active:scale-95 tryon-shadow-lg tryon-shadow-slate-950/20"
              style={{
                backgroundColor: primaryColor,
                borderRadius: radius,
              }}
            >
              Try Again
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="tryon-fixed tryon-inset-0 tryon-z-[10000] tryon-flex tryon-items-center tryon-justify-center tryon-bg-black/50 tryon-backdrop-blur-sm">
      <div 
        className={`${bgClass} tryon-w-full tryon-h-full tryon-max-w-md tryon-md:h-[600px] tryon-md:rounded-2xl tryon-shadow-2xl tryon-overflow-hidden tryon-relative tryon-flex tryon-flex-col`}
        style={{
          '--tryon-primary': primaryColor,
          '--tryon-btn-radius': radius,
        } as any}
      >
        <button
          onClick={handleClose}
          className="tryon-absolute tryon-top-3.5 tryon-right-4 tryon-p-2 tryon-rounded-full tryon-shadow-sm tryon-z-10 tryon-hover:opacity-80"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            color: theme === 'dark' ? '#fff' : '#000',
          }}
        >
          <X className="tryon-w-4 tryon-h-4" />
        </button>
        {/* Dynamic Brand Customization Logo/Header Bar */}
        <div className={`tryon-flex tryon-items-center tryon-justify-center tryon-py-4 tryon-border-b ${borderClass}`}>
          {config?.logoUrl ? (
            <img src={config.logoUrl} className="tryon-h-7 tryon-object-contain" alt="Brand Logo" />
          ) : (
            <span className={`tryon-text-[11px] tryon-font-bold tryon-tracking-widest tryon-uppercase ${textMutedClass}`}>
              Virtual Try-On
            </span>
          )}
        </div>
        <div className="tryon-flex-1 tryon-relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Modal;
