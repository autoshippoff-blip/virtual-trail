import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import usePolling from '../hooks/usePolling';

const STEPS = [
  "Uploading your photo...",
  "Generating your look...",
  "Adding finishing touches..."
];

const ProcessingView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { userImage, jobId, tenantId } = useStore();
  
  // Initialize polling
  usePolling(tenantId!, jobId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 6000); // Change step every 6s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-h-full tryon-p-8 tryon-text-center">
      <div className="tryon-relative tryon-w-48 tryon-h-48 tryon-mb-8">
        {userImage && (
          <img
            src={userImage}
            className="tryon-w-full tryon-h-full tryon-object-cover tryon-rounded-2xl tryon-opacity-50"
            alt="Original"
          />
        )}
        <div className="tryon-absolute tryon-inset-0 tryon-flex tryon-items-center tryon-justify-center">
          <Loader2 className="tryon-w-10 tryon-h-10 tryon-text-black tryon-animate-spin" />
        </div>
      </div>
      
      <div className="tryon-space-y-4">
        <h3 className="tryon-text-lg tryon-font-semibold tryon-text-gray-900">
          {STEPS[currentStep]}
        </h3>
        <div className="tryon-flex tryon-justify-center tryon-gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tryon-w-2 tryon-h-2 tryon-rounded-full tryon-transition-all tryon-duration-500 ${
                i === currentStep ? 'tryon-bg-black tryon-w-6' : 'tryon-bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      <p className="tryon-mt-8 tryon-text-xs tryon-text-gray-400">
        AI processing usually takes 15-30 seconds.
      </p>
    </div>
  );
};

export default ProcessingView;
