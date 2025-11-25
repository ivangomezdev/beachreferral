'use client';
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToImgBB } from '@/utils/imgbb';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import Swal from 'sweetalert2';
import './SaleDetailModal.css';

const SaleDetailModal = ({ sale, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);

  // Cargar datos cuando se abre una venta
  useEffect(() => {
    if (sale) {
      setFormData({
        entryTime: sale.entryTime || '',
        adminPaymentMethod: sale.adminPaymentMethod || 'Efectivo',
        totalAmount: sale.totalAmount || '',
        folio: sale.folio || '',
        clientPaid: sale.clientPaid || false,
        paymentProofUrl: sale.paymentProofUrl || ''
      });
    }
  }, [sale]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadToImgBB(file);
    setUploading(false);

    if (url) {
      setFormData(prev => ({ ...prev, paymentProofUrl: url }));
      Swal.fire('Imagen subida', 'El comprobante se cargó correctamente', 'success');
    } else {
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
    }
  };

  const handleSave = async () => {
    try {
      const saleRef = doc(db, "sales", sale.id);
      
      // Actualizamos los campos nuevos
      await updateDoc(saleRef, {
        ...formData,
        // Opcional: Si el cliente pagó y hay folio, podrías cambiar el estado a Approved automáticamente
        // status: formData.clientPaid ? 'Approved' : sale.status 
      });

      Swal.fire('Actualizado', 'La venta ha sido actualizada', 'success');
      onUpdate(); // Recargar tabla
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al actualizar la venta', 'error');
    }
  };

  if (!sale) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle Venta - ${sale.city}`}>
      <div className="modal-scroll-content">
        {/* SECCIÓN 1: Datos del Vendedor (Solo Lectura) */}
        <div className="section readonly-section">
          <h4>Datos del Vendedor</h4>
          <div className="grid-2">
            <p><strong>Vendedor:</strong> {sale.sellerEmail}</p>
            <p><strong>Fecha:</strong> {sale.date}</p>
            <p><strong>Ciudad:</strong> {sale.city}</p>
            <p><strong>Pax:</strong> {sale.quantity}</p>
            <p><strong>Referido (Reservante):</strong> {sale.referredBy || 'N/A'}</p>
            <p><strong>Tipo Cobro:</strong> {sale.paymentType}</p>
            <p><strong>Balance Vendedor:</strong> ${sale.amount}</p>
          </div>
        </div>

        {/* SECCIÓN 2: Gestión Admin (Editable) */}
        <div className="section admin-section">
          <h4>Gestión Administrativa</h4>
          
          <div className="form-group">
            <label>Hora de Ingreso</label>
            <input type="time" name="entryTime" value={formData.entryTime} onChange={handleChange} className="admin-input" />
          </div>

          <div className="form-group">
            <label>Forma de Pago (Cliente)</label>
            <select name="adminPaymentMethod" value={formData.adminPaymentMethod} onChange={handleChange} className="admin-input">
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          <div className="form-group">
            <label>Total ($)</label>
            <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="admin-input" placeholder="0.00" />
          </div>

          <div className="form-group">
            <label>Folio</label>
            <input type="text" name="folio" value={formData.folio} onChange={handleChange} className="admin-input" placeholder="Ej: A-123" />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="clientPaid" checked={formData.clientPaid} onChange={handleChange} />
              <span className="checkbox-label">¿Cliente Pagó?</span>
            </label>
          </div>

          <div className="form-group">
            <label>Comprobante de Pago</label>
            <input type="file" onChange={handleImageUpload} disabled={uploading} className="file-input" />
            {uploading && <small>Subiendo imagen...</small>}
            
            {formData.paymentProofUrl && (
              <div className="img-preview">
                <p>Imagen cargada:</p>
                <a href={formData.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <img src={formData.paymentProofUrl} alt="Comprobante" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
            <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaleDetailModal;