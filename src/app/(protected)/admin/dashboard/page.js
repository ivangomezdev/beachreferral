import React from 'react';
import AllSalesTable from '@/components/dashboard/admin/AllSalesTable/AllSalesTable';
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton';
export default function Page() { return (<div><h2>Admin Dashboard</h2><ExcelExportButton /><AllSalesTable /></div>); }