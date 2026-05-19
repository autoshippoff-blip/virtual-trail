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
  const { setStatus, setJobId, setUserImage, setError, config } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const theme = config?.widgetTheme || 'light';
  const primaryColor = config?.primaryColor || '#000000';

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
        className={`tryon-flex-1 tryon-border-2 tryon-border-dashed tryon-rounded-xl tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-cursor-pointer tryon-transition-all tryon-duration-300 ${isDragging ? 'tryon-scale-[1.02]' : 'tryon-hover:bg-slate-50/50'}`}
        style={{
          borderColor: isDragging ? primaryColor : (theme === 'dark' ? '#334155' : '#cbd5e1'),
          backgroundColor: isDragging 
            ? (theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc') 
            : 'transparent',
          boxShadow: isDragging ? `0 0 40px ${primaryColor}20` : 'none'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="tryon-hidden"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className={`tryon-w-16 tryon-h-16 tryon-rounded-full tryon-flex tryon-items-center tryon-justify-center tryon-mb-4 tryon-animate-float tryon-shadow-sm`}
          style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }}
        >
          <Upload className="tryon-w-7 tryon-h-7" style={{ color: primaryColor }} />
        </div>
        <p className={`tryon-text-sm tryon-font-medium tryon-mb-1 ${theme === 'dark' ? 'tryon-text-slate-200' : 'tryon-text-slate-800'}`}>Click or drag to upload</p>
        <p className={`tryon-text-xs ${theme === 'dark' ? 'tryon-text-slate-500' : 'tryon-text-slate-400'}`}>JPG, PNG or WebP (max. 5MB)</p>
      </div>

      <div className={`tryon-mt-6 tryon-p-4 tryon-rounded-xl tryon-flex tryon-gap-3`}
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#eff6ff',
          border: theme === 'dark' ? '1px solid #1e293b' : 'none',
        }}
      >
        <AlertCircle className="tryon-w-5 tryon-h-5 tryon-flex-shrink-0" style={{ color: primaryColor }} />
        <div className={`tryon-text-xs tryon-leading-relaxed`}
          style={{ color: theme === 'dark' ? '#94a3b8' : '#1d4ed8' }}
        >
          <strong>Stylist Tip:</strong> For best results, use a well-lit, front-facing photo with a simple background.
        </div>
      </div>
    </div>
  );
};

export default UploadTab;
