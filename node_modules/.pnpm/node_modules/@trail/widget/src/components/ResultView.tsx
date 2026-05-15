import React from 'react';
import { useStore } from '../store/useStore';
import { Download, Sparkles, X } from 'lucide-react';

interface ResultViewProps {
  onClose: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ onClose }) => {
  const { resultImage, compliment, styleScore } = useStore();

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
      <div className="tryon-flex-1 tryon-relative tryon-overflow-hidden">
        {resultImage && (
          <img src={resultImage} className="tryon-w-full tryon-h-full tryon-object-contain tryon-bg-gray-50" alt="Result" />
        )}
        {styleScore && (
          <div className="tryon-absolute tryon-top-4 tryon-left-4 tryon-bg-white/90 tryon-backdrop-blur tryon-px-3 tryon-py-1 tryon-rounded-full tryon-shadow-sm tryon-flex tryon-items-center tryon-gap-1.5 tryon-text-sm tryon-font-bold">
            <Sparkles className="tryon-w-4 tryon-h-4 tryon-text-yellow-500" />
            <span>Style Score: {styleScore}/10</span>
          </div>
        )}
      </div>

      <div className="tryon-p-6 tryon-bg-white tryon-border-t tryon-border-gray-100">
        <div className="tryon-mb-6">
          <p className="tryon-text-lg tryon-font-medium tryon-italic tryon-text-gray-900 tryon-leading-relaxed">
            "{compliment}"
          </p>
        </div>

        <div className="tryon-flex tryon-gap-3">
          <button
            onClick={handleDownload}
            className="tryon-flex-1 tryon-flex tryon-items-center tryon-justify-center tryon-gap-2 tryon-px-6 tryon-py-3 tryon-bg-gray-100 tryon-text-black tryon-rounded-full tryon-font-medium tryon-transition-all tryon-active:scale-95"
          >
            <Download className="tryon-w-5 tryon-h-5" />
            Download
          </button>
          <button
            onClick={onClose}
            className="tryon-flex-1 tryon-flex tryon-items-center tryon-justify-center tryon-gap-2 tryon-px-6 tryon-py-3 tryon-bg-black tryon-text-white tryon-rounded-full tryon-font-medium tryon-transition-all tryon-active:scale-95"
          >
            Perfect!
          </button>
        </div>

        <div className="tryon-mt-4 tryon-text-center">
          <span className="tryon-text-[10px] tryon-uppercase tryon-tracking-widest tryon-text-gray-300">
            Powered by Virtual-Trail AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
