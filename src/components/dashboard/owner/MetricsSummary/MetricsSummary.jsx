'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import './MetricsSummary.css';

const MetricsSummary = () => {
  const [metrics, setMetrics] = useState({ total: 0, pending: 0 });
  const [allSales, setAllSales] = useState([]); // Guardamos todas las ventas aquí
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
        console.error("Error al obtener ventas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // 2. Recalcular cuando cambia el filtro o llegan datos
  useEffect(() => {
    const filterSales = () => {
      const now = new Date();
      
      const filtered = allSales.filter(sale => {
        // Asumimos que sale.date viene como "YYYY-MM-DD" del input type="date"
        if (!sale.date) return false; 
        const saleDate = new Date(sale.date + 'T00:00:00'); // Forzar hora local/neutra para evitar desfases

        if (filter === 'all') return true;

        if (filter === 'day') {
          return saleDate.toDateString() === now.toDateString();
        }

        if (filter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Asume Domingo como inicio, ajusta si es Lunes
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        }

        if (filter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }

        return true;
      });

      // Calcular métricas sobre el array FILTRADO
      let totalSum = 0;
      let pendingSum = 0;

      filtered.forEach((data) => {
        const amount = parseFloat(data.amount) || 0;
        totalSum += amount;
        if (data.status === 'Pending') {
          pendingSum += amount;
        }
      });

      setMetrics({ total: totalSum, pending: pendingSum });
    };

    filterSales();
  }, [filter, allSales]);

  if (loading) return <Card title="Métricas"><div>Cargando...</div></Card>;

  return (
    <Card title="Resumen Financiero">
      {/* Botones de Filtro */}
      <div className="filter-buttons" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setFilter('day')} disabled={filter === 'day'} style={{ fontWeight: filter === 'day' ? 'bold' : 'normal' }}>Hoy</button>
        <button onClick={() => setFilter('week')} disabled={filter === 'week'} style={{ fontWeight: filter === 'week' ? 'bold' : 'normal' }}>Semana</button>
        <button onClick={() => setFilter('month')} disabled={filter === 'month'} style={{ fontWeight: filter === 'month' ? 'bold' : 'normal' }}>Mes</button>
        <button onClick={() => setFilter('all')} disabled={filter === 'all'} style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}>Todos</button>
      </div>

      <div className="metrics">
        <div style={{ color: 'var(--color-primary)' }}>
          Total: ${metrics.total.toLocaleString()}
        </div>
        <div style={{ color: 'var(--color-secondary)' }}>
          Pendiente: ${metrics.pending.toLocaleString()}
        </div>
      </div>
    </Card>
  );
};

export default MetricsSummary;