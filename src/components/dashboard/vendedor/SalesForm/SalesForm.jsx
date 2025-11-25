'use client';
import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import './SalesForm.css';

const SalesForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados auxiliares para la lógica de UI
  const [isAnticipo, setIsAnticipo] = useState(true); // Checkbox estado
  const [referralMode, setReferralMode] = useState('me'); // 'me' | 'other'
  
  const initialState = {
    date: '',
    city: '',
    quantity: 1,
    referredBy: '', // Este valor se calculará al enviar
    amount: '',
    paymentMethod: 'Efectivo'
  };

  const [formData, setFormData] = useState(initialState);

  // Efecto para pre-llenar referido si está en modo "me"
  useEffect(() => {
    if (referralMode === 'me' && user) {
      setFormData(prev => ({ ...prev, referredBy: user.email }));
    } else if (referralMode === 'other') {
      setFormData(prev => ({ ...prev, referredBy: '' }));
    }
  }, [referralMode, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculamos valores finales
      const finalPaymentType = isAnticipo ? 'Pago Anticipo' : 'No Pago Anticipo';
      
      await addDoc(collection(db, "sales"), {
        ...formData,
        paymentType: finalPaymentType,
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity),
        sellerEmail: user.email,
        sellerId: user.uid,
        status: 'Pending',
        createdAt: new Date()
      });

      Swal.fire({
        title: '¡Venta Registrada!',
        text: 'La venta se ha guardado exitosamente.',
        icon: 'success',
        confirmButtonColor: '#007bff',
      });

      // Resetear formulario
      setFormData(initialState);
      setIsAnticipo(true);
      setReferralMode('me');
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar la venta.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card title="Registrar Nueva Venta">
      <form onSubmit={handleSubmit} className="sales-form">
        
        {/* Fila 1: Fecha y Ciudad */}
        <div className="form-row">
          <Input 
            label="Fecha" 
            id="date" 
            type="date" 
            value={formData.date} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Ciudad" 
            id="city" 
            type="text" 
            value={formData.city} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Fila 2: Cantidad y Forma de Pago */}
        <div className="form-row">
          <Input 
            label="Cant. Personas" 
            id="quantity" 
            type="number" 
            value={formData.quantity} 
            onChange={handleChange} 
            required 
          />
           <div className="input-group">
            <label htmlFor="paymentMethod">Forma de Pago</label>
            <select 
              id="paymentMethod" 
              value={formData.paymentMethod} 
              onChange={handleChange}
              required
            >
              <option value="Efectivo">Efectivo</option>
              <option value="TC">Tarjeta de Crédito (TC)</option>
            </select>
          </div>
        </div>

        {/* Fila 3: Referido Por (Lógica Especial) */}
        <div className="form-row">
          <div className="input-group">
            <label>Referido por</label>
            <select 
              value={referralMode} 
              onChange={(e) => setReferralMode(e.target.value)}
              style={{marginBottom: referralMode === 'other' ? '0.5rem' : '0'}}
            >
              <option value="me">Yo ({user?.email})</option>
              <option value="other">Otro...</option>
            </select>
            
            {referralMode === 'other' && (
              <input
                type="text"
                id="referredBy"
                placeholder="Nombre del referido"
                value={formData.referredBy}
                onChange={handleChange}
                required
                className="mt-2" // Pequeño margen superior si usas Tailwind o similar, sino el CSS lo maneja
              />
            )}
          </div>

           {/* Checkbox Tipo de Cobro */}
           <div className="input-group checkbox-container">
            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input 
                type="checkbox" 
                checked={isAnticipo} 
                onChange={(e) => setIsAnticipo(e.target.checked)}
                style={{width: '20px', height: '20px'}} 
              />
              <span style={{fontWeight: 'bold'}}>
                {isAnticipo ? 'Pago Anticipo' : 'No Pago Anticipo'}
              </span>
            </label>
          </div>
        </div>

        {/* Fila 4: Balance (Antes Monto) */}
        <Input 
          label="Balance" 
          id="amount" 
          type="number" 
          value={formData.amount} 
          onChange={handleChange} 
          required 
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar Venta'}
        </Button>
      </form>
    </Card>
  );
};

export default SalesForm;