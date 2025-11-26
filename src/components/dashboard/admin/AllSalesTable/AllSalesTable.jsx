'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import Card from '@/components/ui/Card/Card';
import Modal from '@/components/ui/Modal/Modal'; // Solo para wrapper, el contenido está en SaleDetailModal
import SaleDetailModal from '../SaleDetailModal/SaleDetailModal'; // <--- IMPORTANTE
import './AllSalesTable.css';

const AllSalesTable = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]); 
  
  // Filtros
  const [dateFilter, setDateFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState(''); 

  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Función para Cargar Datos (Reutilizable)
  const fetchSales = useCallback(async () => {
    try {
        const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSales(salesData);
        // Nota: filteredSales se actualizará por el useEffect de abajo
    } catch (error) {
        console.error("Error cargando ventas:", error);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // 2. Lógica de Filtrado 
  useEffect(() => {
    let result = [...sales];
    const now = new Date();

    if (dateFilter !== 'all') {
      result = result.filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');
        
        if (dateFilter === 'day') return saleDate.toDateString() === now.toDateString();
        if (dateFilter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        }
        if (dateFilter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(sale => sale.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => 
        (sale.sellerEmail && sale.sellerEmail.toLowerCase().includes(term)) ||
        (sale.referredBy && sale.referredBy.toLowerCase().includes(term)) ||
        (sale.folio && sale.folio.toString().includes(term)) // Búsqueda por folio también
      );
    }

    setFilteredSales(result);
  }, [sales, dateFilter, statusFilter, searchTerm]);

  // Helpers
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatStatus = (status) => {
    if (status === 'Completed') return 'Aprobada';
    if (status === 'Pending') return 'En Espera';
    if (status === 'Cancelled') return 'Cancelada';
    return status;
  }

  const formatName = (email) => email ? email.split('@')[0] : 'N/A';

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  return (
    <>
      <Card title="Gestión de Ventas">
          {/* --- BARRA DE FILTROS --- */}
          <div className="filters-container">
            <div className="filter-group date-buttons">
                <button onClick={() => setDateFilter('day')} className={dateFilter === 'day' ? 'active' : ''}>Hoy</button>
                <button onClick={() => setDateFilter('week')} className={dateFilter === 'week' ? 'active' : ''}>Semana</button>
                <button onClick={() => setDateFilter('month')} className={dateFilter === 'month' ? 'active' : ''}>Mes</button>
                <button onClick={() => setDateFilter('all')} className={dateFilter === 'all' ? 'active' : ''}>Todo</button>
            </div>

            <div className="filter-group inputs">
                <input 
                  type="text" 
                  placeholder="Buscar vendedor, referido o folio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="Pending">En Espera</option>
                  <option value="Completed">Aprobada</option>
                  <option value="Cancelled">Cancelada</option>
                </select>
            </div>
          </div>

          <div className="table-container">
              <table className="sales-table">
                  <thead>
                      <tr>
                          <th>Vendedor / Referido</th>
                          <th>Detalles</th>
                          <th>Monto</th>
                          <th>Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredSales.map((sale) => (
                          <tr key={sale.id} onClick={() => handleRowClick(sale)} className="clickable-row">
                              <td data-label="Vendedor">
                                  <div className="seller-info">
                                      <span className="seller-name">{formatName(sale.sellerEmail)}</span>
                                      <span className="referred-by">Ref: {formatName(sale.referredBy)}</span>
                                  </div>
                              </td>
                              <td data-label="Detalles">
                                <div style={{fontSize: '0.85rem'}}>
                                    <div>{sale.date}</div>
                                    {sale.folio && <div style={{fontWeight:'bold', color: '#555'}}>Folio: {sale.folio}</div>}
                                </div>
                              </td>
                              <td data-label="Monto" className="amount-cell">
                                  ${parseFloat(sale.totalAmount || sale.amount).toLocaleString()}
                              </td>
                              <td data-label="Estado">
                                  <span className={`status-badge ${getStatusClass(sale.status)}`}>
                                      {formatStatus(sale.status)}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {filteredSales.length === 0 && (
                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>No se encontraron ventas.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>

      {/* --- USAMOS EL NUEVO COMPONENTE MODAL --- */}
      <SaleDetailModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        sale={selectedSale}
        onUpdate={fetchSales} // <--- Pasamos la función para refrescar la tabla
      />
    </>
  );
};
export default AllSalesTable;