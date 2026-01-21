import React, { useState } from 'react';
import { Package, FileArchive } from 'lucide-react';
//import ProductsBulkExcel from './productsBulkExcel';
//import ProductsBulkApi from './ProductsBulkApi';
import ProductsBulkZip from './ProductsBulkZip';
import ProductsManager from './productsManual';

type Tab = 'manual' | 'Zip';

const ProductsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  return (
    <div className="space-y-6">
      {/* SUB TABS */}
      <div className="bg-white rounded-xl p-2 shadow flex gap-2">
        <TabButton icon={<Package />} label="Manual" active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
        <TabButton icon={<FileArchive />} label="ZIP (con imágenes)" active={activeTab === 'Zip'} onClick={() => setActiveTab('Zip')} />
      </div>

      {/* CONTENT */}
      {activeTab === 'manual' && <ProductsManager />}
      {activeTab === 'Zip' && <ProductsBulkZip />} 
      
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition
      ${active ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}
    `}
  >
    {icon}
    {label}
  </button>
);

export default ProductsTabs;


//  <TabButton icon={<Cloud />} label="API Masivo" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
//  <TabButton icon={<Upload />} label="Excel Masivo" active={activeTab === 'excel'} onClick={() => setActiveTab('excel')} />
//      {activeTab === 'excel' && <ProductsBulkExcel />}
//      {activeTab === 'api' && <ProductsBulkApi />}


