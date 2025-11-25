'use client';
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore'; // [Importar esto]
import { db } from '@/lib/firebase'; // [Importar esto]
import { useAuth } from '@/context/AuthContext'; // [Importar para saber quién vende]
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import './SalesForm.css';

const SalesForm = () => {
  const { user } = useAuth(); // Obtener usuario actual
  const [formData, setFormData] = useState({ date: '', city: '', quantity: 1, amount: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => { // Hacer la función asíncrona
    e.preventDefault();
    setLoading(true);
    try {
        // Guardar en Firebase
        await addDoc(collection(db, "sales"), {
            ...formData,
            sellerEmail: user.email,
            sellerId: user.uid,
            status: 'Pending', // Estado inicial por defecto
            createdAt: new Date()
        });
        alert('¡Venta guardada exitosamente!');
        setFormData({ date: '', city: '', quantity: 1, amount: '' }); // Limpiar form
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar la venta");
    }
    setLoading(false);
  };

  return (
    <Card title="Nueva Venta">
        <form onSubmit={handleSubmit} className="sales-form">
            <Input label="Fecha" id="date" type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} required />
            <Input label="Ciudad" id="city" type="text" value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} required />
            <Input label="Monto ($)" id="amount" type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} required />
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Registrar Venta'}</Button>
        </form>
    </Card>
  );
};
export default SalesForm;