'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import './TopSellersList.css';

const TopSellersList = () => {
  const [topSellers, setTopSellers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'day', 'week', 'month', 'all'

  // 1. Cargar datos UNA sola vez
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map(doc => doc.data());
        setAllSales(salesData);
      } catch (error) {
        console.error("Error obteniendo datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // 2. Filtrar y Agrupar
  useEffect(() => {
    const processSellers = () => {
      const now = new Date();

      // Paso A: Filtrar ventas por fecha
      const filteredSales = allSales.filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');

        if (filter === 'all') return true;
        if (filter === 'day') return saleDate.toDateString() === now.toDateString();
        if (filter === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0,0,0,0);
            return saleDate >= startOfWeek;
        }
        if (filter === 'month') {
            return saleDate.getMonth() === now.getMonth() && 
                   saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });

      // Paso B: Agrupar por vendedor (Usando las ventas YA filtradas)
      const sellerMap = {};
      filteredSales.forEach((data) => {
        const amount = parseFloat(data.amount) || 0;
        const email = data.sellerEmail || 'Desconocido';

        if (!sellerMap[email]) {
          sellerMap[email] = 0;
        }
        sellerMap[email] += amount;
      });

      // Paso C: Ordenar y cortar Top 5
      const sortedSellers = Object.entries(sellerMap)
        .map(([email, total]) => ({ email, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopSellers(sortedSellers);
    };

    processSellers();
  }, [filter, allSales]);

  if (loading) return <Card title="Top Vendedores"><div>Cargando...</div></Card>;

  return (
    <Card title="Mejores Vendedores">
       {/* Botones de Filtro */}
       <div className="filter-buttons" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
        <button onClick={() => setFilter('day')} disabled={filter === 'day'} style={{ fontWeight: filter === 'day' ? 'bold' : 'normal' }}>Hoy</button>
        <button onClick={() => setFilter('week')} disabled={filter === 'week'} style={{ fontWeight: filter === 'week' ? 'bold' : 'normal' }}>Semana</button>
        <button onClick={() => setFilter('month')} disabled={filter === 'month'} style={{ fontWeight: filter === 'month' ? 'bold' : 'normal' }}>Mes</button>
        <button onClick={() => setFilter('all')} disabled={filter === 'all'} style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}>Histórico</button>
      </div>

      <ul>
        {topSellers.map((seller, index) => (
          <li key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{index + 1}. {seller.email}</span>
            <strong>${seller.total.toLocaleString()}</strong>
          </li>
        ))}
        {topSellers.length === 0 && <li style={{color: '#888', fontStyle: 'italic'}}>No hubo ventas en este periodo.</li>}
      </ul>
    </Card>
  );
};

export default TopSellersList;