import React from 'react';
import MetricsSummary from '@/components/dashboard/owner/MetricsSummary/MetricsSummary';
import TopSellersList from '@/components/dashboard/owner/TopSellersList/TopSellersList';
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton';

export default function Page() { 
  return (
    <div>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
        <h2>Owner Dashboard</h2>
        <ExcelExportButton />
      </div>
      
      <MetricsSummary />
      <TopSellersList />
    </div>
  ); 
}