import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
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
  const { status, reset } = useStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');

  const handleClose = () => {
    reset();
    onClose();
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="tryon-flex tryon-flex-col tryon-h-full">
            <div className="tryon-flex tryon-border-b tryon-border-gray-100">
              <button
                onClick={() => setActiveTab('upload')}
                className={`tryon-flex-1 tryon-py-4 tryon-text-sm tryon-font-medium tryon-transition-colors ${
                  activeTab === 'upload' ? 'tryon-border-b-2 tryon-border-black tryon-text-black' : 'tryon-text-gray-400'
                }`}
              >
                <div className="tryon-flex tryon-items-center tryon-justify-center tryon-gap-2">
                  <Upload className="tryon-w-4 tryon-h-4" />
                  Upload
                </div>
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`tryon-flex-1 tryon-py-4 tryon-text-sm tryon-font-medium tryon-transition-colors ${
                  activeTab === 'camera' ? 'tryon-border-b-2 tryon-border-black tryon-text-black' : 'tryon-text-gray-400'
                }`}
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
      case 'timeout':
        return (
          <div className="tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-h-full tryon-p-8 tryon-text-center">
            <div className="tryon-w-12 tryon-h-12 tryon-bg-red-50 tryon-text-red-500 tryon-rounded-full tryon-flex tryon-items-center tryon-justify-center tryon-mb-4">
              <X className="tryon-w-6 tryon-h-6" />
            </div>
            <h3 className="tryon-text-lg tryon-font-semibold tryon-mb-2">Something went wrong</h3>
            <p className="tryon-text-gray-500 tryon-mb-6">Please try again or use a different photo.</p>
            <button
              onClick={reset}
              className="tryon-px-6 tryon-py-2 tryon-bg-black tryon-text-white tryon-rounded-full tryon-font-medium"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tryon-fixed tryon-inset-0 tryon-z-[10000] tryon-flex tryon-items-center tryon-justify-center tryon-bg-black/50 tryon-backdrop-blur-sm">
      <div className="tryon-bg-white tryon-w-full tryon-h-full tryon-max-w-md tryon-md:h-[600px] tryon-md:rounded-2xl tryon-shadow-2xl tryon-overflow-hidden tryon-relative tryon-flex tryon-flex-col">
        <button
          onClick={handleClose}
          className="tryon-absolute tryon-top-4 tryon-right-4 tryon-p-2 tryon-bg-white/80 tryon-backdrop-blur tryon-rounded-full tryon-shadow-sm tryon-z-10 tryon-hover:bg-gray-100"
        >
          <X className="tryon-w-5 tryon-h-5" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default Modal;
