import React from 'react'
import AllSalesTable from '@/components/dashboard/admin/AllSalesTable/AllSalesTable'
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton'
export default function Page () {
  return (
    <div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
      <h2>Admin Dashboard</h2>
      <ExcelExportButton />
      </div>
      <AllSalesTable />
    </div>
  )
}
