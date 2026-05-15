import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { startTryOn } from '../utils/api';

interface UploadTabProps {
  productId: string;
  tenantId: string;
}

const UploadTab: React.FC<UploadTabProps> = ({ productId, tenantId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setStatus, setJobId, setUserImage, setError } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUserImage(base64);
      setStatus('uploading');

      try {
        const jobId = await startTryOn(tenantId, productId, base64);
        setJobId(jobId);
        setStatus('queued');
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="tryon-p-6 tryon-h-full tryon-flex tryon-flex-col">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileInputRef.current?.click()}
        className={`tryon-flex-1 tryon-border-2 tryon-border-dashed tryon-rounded-xl tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-cursor-pointer tryon-transition-all ${
          isDragging ? 'tryon-border-black tryon-bg-gray-50' : 'tryon-border-gray-200 tryon-hover:border-gray-300'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="tryon-hidden"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="tryon-w-16 tryon-h-16 tryon-bg-gray-50 tryon-rounded-full tryon-flex tryon-items-center tryon-justify-center tryon-mb-4">
          <Upload className="tryon-w-8 tryon-h-8 tryon-text-gray-400" />
        </div>
        <p className="tryon-text-sm tryon-font-medium tryon-mb-1">Click or drag to upload</p>
        <p className="tryon-text-xs tryon-text-gray-400">JPG, PNG or WebP (max. 5MB)</p>
      </div>

      <div className="tryon-mt-6 tryon-bg-blue-50 tryon-p-4 tryon-rounded-xl tryon-flex tryon-gap-3">
        <AlertCircle className="tryon-w-5 tryon-h-5 tryon-text-blue-500 tryon-flex-shrink-0" />
        <div className="tryon-text-xs tryon-text-blue-700 tryon-leading-relaxed">
          <strong>Stylist Tip:</strong> For best results, use a well-lit, front-facing photo with a simple background.
        </div>
      </div>
    </div>
  );
};

export default UploadTab;
