'use client'
import React, { useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'

import Modal from '@/components/ui/Modal/Modal'
import Button from '@/components/ui/Button/Button'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import './ExcelExportButton.css'

const ExcelExportButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Fechas por defecto: Hoy
  const getTodayString = () => new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getTodayString())

  const handleOpen = () => {
    setStartDate(getTodayString())
    setEndDate(getTodayString())
    setIsModalOpen(true)
  }

  const handleClose = () => setIsModalOpen(false)

  const processData = (sales) => {
    // Función auxiliar para formatear una fila de Excel
    return sales.map(sale => ({
      ID: sale.id,
      Fecha: sale.date,
      Ciudad: sale.city,
      'Hora Ingreso': sale.entryTime || '',
      Vendedor: sale.sellerEmail,
      Concierge: sale.referredBy || 'N/A', // ReferredBy ahora es visualmente Concierge
      'Reserva Para': sale.reservationFor || '', // Nuevo campo
      Pax: sale.quantity,
      'Paquete': sale.packageType || '',
      'Total ($)': sale.totalAmount || 0,
      'Balance (Debe)': sale.amount || 0,
      'Anticipo': sale.paymentType === 'Pago Anticipo' ? 'SI' : 'NO',
      'Método Pago Vendedor': sale.paymentMethod,
      'Método Pago Admin': sale.adminPaymentMethod || '',
      Folio: sale.folio || '',
      Color: sale.wristbandColor || '',
      Observaciones: sale.observation || '',
      'Link Comprobante': sale.paymentProofUrl || 'Sin Comprobante'
    }))
  }

  const generateExcel = async () => {
    setLoading(true)
    try {
      // 1. Obtener TODAS las ventas (o filtrar en query si es mucha data, 
      // pero filtrar en cliente es más seguro para strings de fecha 'YYYY-MM-DD')
      const q = query(collection(db, 'sales'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const allSales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // 2. Filtrar por rango de fechas
      // Como las fechas son strings YYYY-MM-DD, la comparación de strings funciona bien
      const filteredSales = allSales.filter(sale => {
        if (!sale.date) return false
        return sale.date >= startDate && sale.date <= endDate
      })

      if (filteredSales.length === 0) {
        Swal.fire('Sin datos', 'No hay ventas en el rango de fechas seleccionado', 'info')
        setLoading(false)
        return
      }

      // 3. Dividir en grupos
      const completed = filteredSales.filter(s => s.status === 'Completed')
      const pending = filteredSales.filter(s => s.status === 'Pending' || !s.status) // Default pending
      const cancelled = filteredSales.filter(s => s.status === 'Cancelled')

      // 4. Crear Workbook
      const wb = XLSX.utils.book_new()

      // 5. Crear Hojas (Sheets)
      // Hoja Aprobadas
      if (completed.length > 0) {
        const wsCompleted = XLSX.utils.json_to_sheet(processData(completed))
        XLSX.utils.book_append_sheet(wb, wsCompleted, "Aprobadas")
      }
      
      // Hoja En Proceso
      if (pending.length > 0) {
        const wsPending = XLSX.utils.json_to_sheet(processData(pending))
        XLSX.utils.book_append_sheet(wb, wsPending, "En Proceso")
      }

      // Hoja Canceladas
      if (cancelled.length > 0) {
        constwsCancelled = XLSX.utils.json_to_sheet(processData(cancelled))
        XLSX.utils.book_append_sheet(wb, constwsCancelled, "Canceladas") // Corrección variable typo manual
      }
      
      // Si todo está vacío (raro por el check anterior)
      if (wb.SheetNames.length === 0) {
         const wsEmpty = XLSX.utils.json_to_sheet([{Info: "Sin datos"}])
         XLSX.utils.book_append_sheet(wb, wsEmpty, "Info")
      }

      // 6. Descargar Archivo
      XLSX.writeFile(wb, `Reporte_Ventas_${startDate}_a_${endDate}.xlsx`)
      
      handleClose()
      Swal.fire({
        title: '¡Éxito!',
        text: 'El reporte se ha descargado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })

    } catch (error) {
      console.error("Error exportando excel:", error)
      Swal.fire('Error', 'Hubo un error al generar el Excel', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='excel-btnCont'>
        <button className='excel-btn' onClick={handleOpen}>
          <CloudDownloadIcon /> 
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="Exportar Reporte de Ventas">
        <div className="export-modal-content">
            <p>Seleccione el rango de fechas para el reporte:</p>
            
            <div className="date-range-container">
                <div className="date-field">
                    <label>Desde:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                </div>
                <div className="date-field">
                    <label>Hasta:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
            </div>

            <div className="modal-footer">
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button onClick={generateExcel} disabled={loading}>
                    {loading ? 'Generando...' : 'Descargar .XLSX'}
                </Button>
            </div>
        </div>
      </Modal>
    </>
  )
}

export default ExcelExportButton