/* File: src/components/dashboard/vendedor/SalesHistory/SalesHistory.jsx */
'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import { useAuth } from '@/context/AuthContext'; 
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button'; 
import DateRangeIcon from '@mui/icons-material/DateRange';

import './SalesHistory.css';

const SalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro de Tiempo (existente)
  const [filter, setFilter] = useState('month'); 
  
  // Nuevo Filtro de Estado (Por defecto 'Completed' -> Aprobadas)
  const [statusFilter, setStatusFilter] = useState('Completed');

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // 1. Suscripción en Tiempo Real
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "sales"), 
      where("sellerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      salesData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSales(salesData); 
      setLoading(false);
    }, (error) => {
      console.error("Error escuchando historial:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Filtrado y Reset de Página
  useEffect(() => {
    const applyFilter = () => {
      const now = new Date();
      const todayString = now.toDateString();

      const filtered = sales.filter(sale => {
        // 1. Filtro de Fecha
        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');
        let dateMatch = true;

        if (filter === 'day') dateMatch = saleDate.toDateString() === todayString;
        else if (filter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          dateMatch = saleDate >= startOfWeek;
        }
        else if (filter === 'month') {
          dateMatch = saleDate.getMonth() === now.getMonth() && 
                      saleDate.getFullYear() === now.getFullYear();
        }

        // 2. Filtro de Estado (Nuevo)
        let statusMatch = true;
        if (statusFilter !== 'all') {
            statusMatch = sale.status === statusFilter;
        }

        return dateMatch && statusMatch;
      });

      setFilteredSales(filtered);
      setCurrentPage(1); // Resetear a la primera página al cambiar filtro
    };

    applyFilter();
  }, [filter, statusFilter, sales]); // Agregamos statusFilter a las dependencias

  // 3. Cálculo de datos paginados
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  getStatusLabel = (status) => {
    if (status === 'Pending') return <span className="badge badge--pending">En proceso</span>;
    if (status === 'Completed') return <span className="badge badge--success">Aprobada</span>;
    if (status === 'Cancelled') return <span className="badge badge--error">Cancelada</span>;
    return status;
  };

  return (
    <Card title="Mis Ventas">
      {/* Filtros de Tiempo */}
      <div className="history-filters">
        <button className={filter === 'day' ? 'active' : ''} onClick={() => setFilter('day')}>Día</button>
        <button className={filter === 'week' ? 'active' : ''} onClick={() => setFilter('week')}>Semana</button>
        <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>Mes</button>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}><DateRangeIcon/></button>
      </div>

      {/* Nuevo Filtro de Estado */}
      <div className="status-filter-container" style={{ marginBottom: '1.5rem' }}>
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '150px'
            }}
        >
            <option value="Completed">✅ Aprobadas</option>
            <option value="Pending">⏳ En Proceso</option>
            <option value="Cancelled">❌ Canceladas</option>
            <option value="all">📋 Todas</option>
        </select>
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
                <th>Balance</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {paginatedSales.map((sale) => (
                <tr key={sale.id}>
                  <td data-label="Fecha">{sale.date}</td>
                  <td data-label="Ciudad">{sale.city}</td>
                  <td data-label="Pax">
                    <strong>{sale.quantity}</strong>
                    {sale.reservationFor && <div className="mobile-meta">Reserva: {sale.reservationFor}</div>}
                  </td>
                  <td data-label="Balance">${parseFloat(sale.amount).toLocaleString()}</td>
                  <td data-label="Pago">
                    <div className="payment-info">
                      <small>{sale.paymentType}</small>
                      <small>{sale.paymentMethod}</small>
                    </div>
                  </td>
                  <td data-label="Estado">{getStatusLabel(sale.status)}</td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>
                    No se encontraron ventas con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="page-info">
                Página {currentPage} de {totalPages}
              </span>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SalesHistory;

// Helper function restoration needed due to snippet cut in previous thought process simulation
function getStatusLabel(status) {
    if (status === 'Pending') return <span className="badge badge--pending">En proceso</span>;
    if (status === 'Completed') return <span className="badge badge--success">Aprobada</span>;
    if (status === 'Cancelled') return <span className="badge badge--error">Cancelada</span>;
    return status;
}