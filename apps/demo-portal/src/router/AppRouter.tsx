import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BrandDemoPage from '../pages/BrandDemoPage';
import NotFoundPage from '../pages/NotFoundPage';
import BrandDirectoryPage from '../pages/BrandDirectoryPage';

// Simple Route router wrapper to select directory vs brand details on the root path
const RootRouteResolver: React.FC = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const isGenericDeployDomain = hostname.endsWith('.vercel.app') || hostname.endsWith('.pages.dev');
  
  let isSubdomain = false;
  if (isGenericDeployDomain) {
    // For vercel.app or pages.dev, a brand subdomain would be brand.project.vercel.app (parts.length >= 4)
    isSubdomain = parts.length >= 4 && parts[0] !== 'www' && parts[0] !== 'demo';
  } else {
    // For custom domains or local resolution
    isSubdomain = parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'demo' && !hostname.includes('localhost');
  }
  
  if (isSubdomain) {
    return <BrandDemoPage />;
  }

  // Otherwise render a generic 404 (NotFoundPage) so root path does not leak anything
  return <NotFoundPage />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Private Showcase Directory route for internal sales team use */}
        <Route path="/admin-directory" element={<BrandDirectoryPage />} />

        {/* Dynamic path routing: e.g. demo.virtualtrail.ai/effilo */}
        <Route path="/:brandId" element={<BrandDemoPage />} />
        
        {/* Root routing (with subdomain support check) */}
        <Route path="/" element={<RootRouteResolver />} />
        
        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
