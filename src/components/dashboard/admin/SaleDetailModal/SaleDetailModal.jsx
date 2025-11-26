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

  // Helper para obtener hora actual
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (sale) {
      setFormData({
        // Datos Admin
        status: sale.status || 'Pending',
        entryTime: sale.entryTime || getCurrentTime(),
        adminPaymentMethod: sale.adminPaymentMethod || 'Efectivo',
        packageType: sale.packageType || 'Day Pass',
        folio: sale.folio || '',
        wristbandColor: sale.wristbandColor || '',
        paymentProofUrl: sale.paymentProofUrl || '',
        observation: sale.observation || '',
        
        // Datos Editables que vienen del vendedor
        quantity: sale.quantity || 1, // Se inicializa con el valor original
        totalAmount: sale.totalAmount || sale.amount || '', 
      });
    }
  }, [sale]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setFormData(prev => ({ ...prev, paymentProofUrl: url }));
        Swal.fire({ title: 'Imagen subida', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const saleRef = doc(db, "sales", sale.id);
      
      let dataToUpdate = {
        status: formData.status,
        updatedAt: new Date()
      };

      if (formData.status === 'Cancelled') {
        dataToUpdate.observation = formData.observation;
      } else {
        dataToUpdate = {
          ...dataToUpdate,
          entryTime: formData.entryTime,
          adminPaymentMethod: formData.adminPaymentMethod,
          packageType: formData.packageType,
          folio: formData.folio,
          wristbandColor: formData.wristbandColor,
          paymentProofUrl: formData.paymentProofUrl,
          quantity: parseInt(formData.quantity) || 0, // Aquí se actualiza la cantidad en la BD
          totalAmount: parseFloat(formData.totalAmount) || 0,
          observation: '' 
        };
      }
      
      await updateDoc(saleRef, dataToUpdate);

    Swal.fire({
        title: '¡Actualizado!',
        text: 'La venta ha sido actualizada correctamente.',
        icon: 'success',
        confirmButtonColor: '#007bff'
      });

      if (onUpdate) onUpdate(); 
      onClose(); 
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al actualizar la venta', 'error');
    }
  };

  if (!sale) return null;

  // Lógica para mostrar el anticipo en Detalles Originales
  const anticipoMonto = sale.paymentType === 'Pago Anticipo' ? (100 * sale.quantity) : 0;
  const anticipoTexto = sale.paymentType === 'Pago Anticipo' 
    ? `$${anticipoMonto} (Sí)` 
    : 'No';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Administrar Venta - ${sale.city}`}>
      <div className="modal-scroll-content">
        
        {/* SECCIÓN 1: Detalles Originales (Datos del Vendedor) */}
        <div className="section readonly-section">
          <h4>Detalles Originales</h4>
          <div className="info-grid">
            <div className="info-item"><strong>Vendedor:</strong> {sale.sellerEmail}</div>
            <div className="info-item"><strong>Fecha:</strong> {sale.date}</div>
            <div className="info-item"><strong>Ciudad:</strong> {sale.city}</div>
            <div className="info-item"><strong>Pax Original:</strong> {sale.quantity}</div>
            <div className="info-item"><strong>Referido:</strong> {sale.referredBy || 'N/A'}</div>
            {/* Aquí mostramos el cálculo del anticipo basado en la data original */}
            <div className="info-item" style={{color: anticipoMonto > 0 ? 'green' : 'inherit'}}>
                <strong>Anticipo:</strong> {anticipoTexto}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Gestión Admin (Editable) */}
        <div className="section admin-section">
          <h4>Gestión Administrativa</h4>
          
          {/* Selector de Estado */}
          <div className="form-group">
            <label className="label-highlight">Estado de la Venta</label>
            <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className={`admin-input status-select-input ${formData.status}`}
            >
              <option value="Pending">🟡 En Espera</option>
              <option value="Completed">🟢 Aprobada</option>
              <option value="Cancelled">🔴 Cancelada</option>
            </select>
          </div>

          {/* Lógica condicional para Cancelada */}
          {formData.status === 'Cancelled' ? (
            <div className="form-group full-width animate-fade-in">
                <label>Motivo de Cancelación / Observaciones</label>
                <textarea
                    name="observation"
                    value={formData.observation}
                    onChange={handleChange}
                    className="admin-input admin-textarea"
                    placeholder="Especifique por qué se cancela la venta..."
                    rows="4"
                />
            </div>
          ) : (
            <>
              <div className="admin-grid">
                
                {/* Pax Editable (Actualiza la BD) */}
                <div className="form-group">
                    <label>Personas (Pax)</label>
                    <input 
                        type="number" 
                        name="quantity" 
                        value={formData.quantity} 
                        onChange={handleChange} 
                        className="admin-input" 
                    />
                </div>

                {/* Hora Editable (Default: Actual) */}
                <div className="form-group">
                    <label>Hora de Ingreso</label>
                    <input 
                        type="time" 
                        name="entryTime" 
                        value={formData.entryTime} 
                        onChange={handleChange} 
                        className="admin-input" 
                    />
                </div>

                <div className="form-group">
                    <label>Método de Pago</label>
                    <select name="adminPaymentMethod" value={formData.adminPaymentMethod} onChange={handleChange} className="admin-input">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Paquete</label>
                    <select name="packageType" value={formData.packageType} onChange={handleChange} className="admin-input">
                    <option value="Day Pass">Day Pass</option>
                    <option value="Niños">Niños</option>
                    <option value="Paquete 1500">Paquete 1500</option>
                    <option value="Otro">Otro</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Color</label>
                    <input 
                        type="text" 
                        name="wristbandColor" 
                        value={formData.wristbandColor} 
                        onChange={handleChange} 
                        className="admin-input" 
                        placeholder="Ej. Azul" 
                    />
                </div>

                <div className="form-group">
                    <label>Folio</label>
                    <input 
                        type="text" 
                        name="folio" 
                        value={formData.folio} 
                        onChange={handleChange} 
                        className="admin-input" 
                        placeholder="#000" 
                    />
                </div>

                <div className="form-group">
                    <label>Monto Total ($)</label>
                    <input 
                        type="number" 
                        name="totalAmount" 
                        value={formData.totalAmount} 
                        onChange={handleChange} 
                        className="admin-input" 
                    />
                </div>
              </div>

              {/* Subida de Imagen */}
              <div className="form-group full-width" style={{marginTop: '1rem'}}>
                <label>Comprobante</label>
                <div className="file-upload-container">
                    <input type="file" onChange={handleImageUpload} disabled={uploading} className="file-input" accept="image/*" />
                    {uploading && <span className="upload-spinner">Subiendo...</span>}
                </div>
                
                {formData.paymentProofUrl && (
                  <div className="img-preview">
                    <p>Imagen cargada:</p>
                    <a href={formData.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                      <img src={formData.paymentProofUrl} alt="Comprobante" />
                    </a>
                    <button 
                        type="button"
                        className="remove-img-btn"
                        onClick={() => setFormData(prev => ({...prev, paymentProofUrl: ''}))}
                    >
                        Quitar Imagen
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        <div className="modal-actions">
            <Button onClick={onClose} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaleDetailModal;