import React from 'react';
import { useStore } from '../store/useStore';
import { Download, Sparkles } from 'lucide-react';

interface ResultViewProps {
  onClose: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ onClose }) => {
  const { resultImage, compliment, styleScore, config } = useStore();
  const theme = config?.widgetTheme || 'light';
  const btnStyle = config?.buttonStyle || 'rounded';
  const radius = btnStyle === 'square' ? '0px' : btnStyle === 'capsule' ? '9999px' : '16px';
  const primaryColor = config?.primaryColor || '#000000';

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tryon-result.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="tryon-flex tryon-flex-col tryon-h-full">
      <div className="tryon-flex-1 tryon-relative tryon-overflow-hidden tryon-animate-scale-in">
        {resultImage && (
          <img 
            src={resultImage} 
            className={`tryon-w-full tryon-h-full tryon-object-contain tryon-shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'tryon-bg-slate-900' : 'tryon-bg-slate-50'}`} 
            alt="Result" 
          />
        )}
        {styleScore && (
          <div className={`tryon-absolute tryon-top-4 tryon-left-4 tryon-px-3.5 tryon-py-1.5 tryon-rounded-full tryon-shadow-lg tryon-flex tryon-items-center tryon-gap-2 tryon-text-sm tryon-font-bold tryon-backdrop-blur-md tryon-border ${
            theme === 'dark' ? 'tryon-bg-slate-900/80 tryon-border-slate-700 tryon-text-white' : 'tryon-bg-white/80 tryon-border-white/50 tryon-text-slate-900'
          }`}>
            <div className="tryon-w-5 tryon-h-5 tryon-rounded-full tryon-bg-gradient-to-tr tryon-from-yellow-400 tryon-to-orange-500 tryon-flex tryon-items-center tryon-justify-center tryon-shadow-sm">
              <Sparkles className="tryon-w-3 tryon-h-3 tryon-text-white" />
            </div>
            <span>Style Score: {styleScore}/10</span>
          </div>
        )}
      </div>

      <div className={`tryon-p-5 tryon-border-t ${theme === 'dark' ? 'tryon-bg-slate-950 tryon-border-slate-800' : 'tryon-bg-white tryon-border-gray-100'}`}>
        <div className="tryon-mb-5">
          <p className={`tryon-text-sm tryon-font-medium tryon-italic tryon-leading-relaxed ${
            theme === 'dark' ? 'tryon-text-slate-200' : 'tryon-text-slate-800'
          }`}>
            "{compliment}"
          </p>
        </div>

        <div className="tryon-flex tryon-gap-3">
          <button
            onClick={handleDownload}
            className="tryon-flex-1 tryon-flex tryon-items-center tryon-justify-center tryon-gap-2 tryon-px-5 tryon-py-3 tryon-font-medium tryon-transition-all tryon-duration-300 tryon-hover:-translate-y-0.5 tryon-hover:shadow-md tryon-active:scale-95"
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
              color: theme === 'dark' ? '#fff' : '#0f172a',
              borderRadius: radius,
            }}
          >
            <Download className="tryon-w-4 tryon-h-4" />
            Download
          </button>
          <button
            onClick={onClose}
            className="tryon-flex-1 tryon-flex tryon-items-center tryon-justify-center tryon-gap-2 tryon-px-5 tryon-py-3 tryon-text-white tryon-font-medium tryon-transition-all tryon-duration-300 tryon-hover:-translate-y-0.5 tryon-hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] tryon-active:scale-95 tryon-shadow-inner"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              borderRadius: radius,
            }}
          >
            Perfect!
          </button>
        </div>

        <div className="tryon-mt-4 tryon-text-center">
          <span className={`tryon-text-[9px] tryon-uppercase tryon-tracking-widest ${theme === 'dark' ? 'tryon-text-slate-600' : 'tryon-text-slate-300'}`}>
            Powered by Virtual-Trail AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
