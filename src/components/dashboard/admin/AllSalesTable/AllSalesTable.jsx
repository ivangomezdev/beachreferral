'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import Card from '@/components/ui/Card/Card';
import Modal from '@/components/ui/Modal/Modal';
import './AllSalesTable.css';

const AllSalesTable = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]); // Ventas filtradas
  
  // Estados para los filtros
  const [dateFilter, setDateFilter] = useState('all'); // 'day', 'week', 'month', 'all'
  const [statusFilter, setStatusFilter] = useState('all'); // 'Pending', 'Completed', etc.
  const [searchTerm, setSearchTerm] = useState(''); // Texto para buscar vendedor

  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Cargar datos iniciales
  useEffect(() => {
    const fetchSales = async () => {
        try {
            const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesData);
            setFilteredSales(salesData); // Inicialmente mostramos todo
        } catch (error) {
            console.error("Error cargando ventas:", error);
        }
    };
    fetchSales();
  }, []);

  // 2. Lógica de Filtrado (Se ejecuta cuando cambia sales o algún filtro)
  useEffect(() => {
    let result = [...sales];
    const now = new Date();

    // A. Filtro por Fecha
    if (dateFilter !== 'all') {
      result = result.filter(sale => {
        if (!sale.date) return false;
        // Ajustamos la fecha para evitar problemas de zona horaria (YYYY-MM-DD)
        const saleDate = new Date(sale.date + 'T00:00:00');
        
        if (dateFilter === 'day') {
          return saleDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Inicio domingo
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

    // B. Filtro por Estado
    if (statusFilter !== 'all') {
      result = result.filter(sale => sale.status === statusFilter);
    }

    // C. Búsqueda por Texto (Vendedor o Referido)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => 
        (sale.sellerEmail && sale.sellerEmail.toLowerCase().includes(term)) ||
        (sale.referredBy && sale.referredBy.toLowerCase().includes(term))
      );
    }

    setFilteredSales(result);
  }, [sales, dateFilter, statusFilter, searchTerm]);

  // Helpers
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatName = (email) => {
    if (!email) return 'N/A';
    return email.split('@')[0];
  };

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card title="Gestión de Ventas">
          
          {/* --- BARRA DE FILTROS --- */}
          <div className="filters-container">
            {/* 1. Botones de Fecha */}
            <div className="filter-group date-buttons">
                <button onClick={() => setDateFilter('day')} className={dateFilter === 'day' ? 'active' : ''}>Hoy</button>
                <button onClick={() => setDateFilter('week')} className={dateFilter === 'week' ? 'active' : ''}>Semana</button>
                <button onClick={() => setDateFilter('month')} className={dateFilter === 'month' ? 'active' : ''}>Mes</button>
                <button onClick={() => setDateFilter('all')} className={dateFilter === 'all' ? 'active' : ''}>Todo</button>
            </div>

            {/* 2. Filtros de Texto y Select */}
            <div className="filter-group inputs">
                <input 
                  type="text" 
                  placeholder="Buscar vendedor..." 
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
                  <option value="Pending">Pendiente</option>
                  <option value="Completed">Completado</option>
                  <option value="Cancelled">Cancelado</option>
                </select>
            </div>
          </div>

          <div className="table-container">
              <table className="sales-table">
                  <thead>
                      <tr>
                          <th>Vendedor / Referido</th>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredSales.map((sale) => (
                          <tr 
                            key={sale.id} 
                            onClick={() => handleRowClick(sale)} 
                            className="clickable-row"
                          >
                              <td data-label="Vendedor">
                                  <div className="seller-info">
                                      <span className="seller-name">
                                          {formatName(sale.sellerEmail)}
                                      </span>
                                      <span className="referred-by">
                                          Ref: {formatName(sale.referredBy)}
                                      </span>
                                  </div>
                              </td>
                              <td data-label="Fecha">{sale.date}</td>
                              <td data-label="Monto" className="amount-cell">
                                  ${parseFloat(sale.amount).toLocaleString()}
                              </td>
                              <td data-label="Estado">
                                  <span className={`status-badge ${getStatusClass(sale.status)}`}>
                                      {sale.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>
                            No se encontraron ventas con estos filtros.
                          </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>

      {/* --- POPUP (MODAL) --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Detalles de la Venta"
      >
        {selectedSale && (
            <div className="sale-details">
                <p><strong>ID Transacción:</strong> <span style={{fontSize:'0.8rem', fontFamily:'monospace', color:'#666'}}>{selectedSale.id}</span></p>
                <hr style={{margin: '10px 0', border: '0', borderTop: '1px solid #eee'}}/>
                <p><strong>Vendedor:</strong> {selectedSale.sellerEmail}</p>
                <p><strong>Referido por:</strong> {selectedSale.referredBy || 'N/A'}</p>
                <p><strong>Fecha:</strong> {selectedSale.date}</p>
                <p><strong>Ciudad:</strong> {selectedSale.city || 'N/A'}</p>
                <p><strong>Monto:</strong> ${parseFloat(selectedSale.amount).toLocaleString()}</p>
                <div style={{marginTop: '1rem'}}>
                    <strong>Estado: </strong> 
                    <span className={`status-badge ${getStatusClass(selectedSale.status)}`}>
                        {selectedSale.status}
                    </span>
                </div>
            </div>
        )}
      </Modal>
    </>
  );
};
export default AllSalesTable;