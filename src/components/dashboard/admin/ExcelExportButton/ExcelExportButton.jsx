'use client'
import React from 'react'
import Button from '@/components/ui/Button/Button'
import './ExcelExportButton.css'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
const ExcelExportButton = () => (
  <div className='excel-btnCont'>
    <button className='excel-btn' onClick={() => alert('Download XLSX')}><CloudDownloadIcon/> </button>
  </div>
)
export default ExcelExportButton
