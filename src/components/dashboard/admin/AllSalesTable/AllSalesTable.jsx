'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // [Importar]
import { db } from '@/lib/firebase'; // [Importar]
import Card from '@/components/ui/Card/Card';
import './AllSalesTable.css';

const AllSalesTable = () => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
        try {
            const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesData);
        } catch (error) {
            console.error("Error cargando ventas:", error);
        }
    };
    fetchSales();
  }, []);

  return (
    <Card title="Todas las Ventas">
        <table className="sales-table">
            <thead>
                <tr>
                    <th>Vendedor</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {/* AQUI ESTA EL CAMBIO: Mapeamos los datos reales */}
                {sales.map((sale) => (
                    <tr key={sale.id}>
                        <td>{sale.sellerEmail}</td>
                        <td>${sale.amount}</td>
                        <td>{sale.date}</td>
                        <td>{sale.status}</td>
                    </tr>
                ))}
                {sales.length === 0 && <tr><td colSpan="4">No hay ventas registradas</td></tr>}
            </tbody>
        </table>
    </Card>
  );
};
export default AllSalesTable;