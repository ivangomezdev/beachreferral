'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Importamos onSnapshot
import { db } from '@/lib/firebase'; //
import { useAuth } from '@/context/AuthContext'; //
import Card from '@/components/ui/Card/Card';
import './SalesHistory.css';

const SalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); 

  // 1. Suscripción en Tiempo Real (onSnapshot)
  useEffect(() => {
    if (!user) return;

    // Creamos la query
    const q = query(
      collection(db, "sales"), 
      where("sellerId", "==", user.uid)
    );

    // Nos suscribimos a los cambios
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Ordenamos en cliente (por fecha descendente)
      salesData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setSales(salesData); // Esto disparará el useEffect de filtrado abajo
      setLoading(false);
    }, (error) => {
      console.error("Error escuchando historial:", error);
      setLoading(false);
    });

    // Limpiamos la suscripción al desmontar
    return () => unsubscribe();

  }, [user]);

  // 2. Filtrado (Se ejecuta cada vez que 'sales' cambia por el onSnapshot)
  useEffect(() => {
    const applyFilter = () => {
      const now = new Date();
      const todayString = now.toDateString();

      const filtered = sales.filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');

        if (filter === 'day') return saleDate.toDateString() === todayString;
        if (filter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        }
        if (filter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
      setFilteredSales(filtered);
    };

    applyFilter();
  }, [filter, sales]);

  const getStatusLabel = (status) => {
    if (status === 'Pending') return <span className="badge badge--pending">En proceso</span>;
    if (status === 'Approved') return <span className="badge badge--success">Aprobada</span>;
    if (status === 'Rejected') return <span className="badge badge--error">Rechazada</span>;
    return status;
  };

  return (
    <Card title="Mis Ventas">
      <div className="history-filters">
        <button className={filter === 'day' ? 'active' : ''} onClick={() => setFilter('day')}>Día</button>
        <button className={filter === 'week' ? 'active' : ''} onClick={() => setFilter('week')}>Semana</button>
        <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>Mes</button>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button>
      </div>

      {loading ? (
        <p style={{padding: '1rem'}}>Cargando ventas...</p>
      ) : (
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ciudad</th>
                <th>Pax</th>
                <th>Monto</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.date}</td>
                  <td>{sale.city}</td>
                  <td>{sale.quantity}</td>
                  <td>${parseFloat(sale.amount).toLocaleString()}</td>
                  <td>
                    <div className="payment-info">
                      <small>{sale.paymentType}</small>
                      <small>{sale.paymentMethod}</small>
                    </div>
                  </td>
                  <td>{getStatusLabel(sale.status)}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>
                    No hay ventas registradas en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default SalesHistory;