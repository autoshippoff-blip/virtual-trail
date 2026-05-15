import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import TryOnButton from './components/TryOnButton';
import Modal from './components/Modal';

interface TryOnAppProps {
  tenantId: string;
  productId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_RESULTS === 'true';

const MOCK_CONFIG = {
  primaryColor: '#000000',
  complimentTone: 'friendly',
  features: ['tryon']
};

const TryOnApp: React.FC<TryOnAppProps> = ({ tenantId, productId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { config, setConfig } = useStore();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/tenant/${tenantId}/config`);
        if (!response.ok) throw new Error('Failed to fetch config');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('TryOnWidget: Config fetch failed', error);
        if (USE_MOCK) {
          console.log('TryOnWidget: Using mock config');
          setConfig(MOCK_CONFIG);
        }
      }
    };

    fetchConfig();
  }, [tenantId, setConfig]);

  if (!config) return null;

  return (
    <div className="tryon-widget-container">
      <TryOnButton onClick={() => setIsModalOpen(true)} />
      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} productId={productId} tenantId={tenantId} />}
    </div>
  );
};

export default TryOnApp;
