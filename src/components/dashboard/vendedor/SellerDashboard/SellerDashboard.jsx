'use client'; 
import React from 'react'; 
import SalesForm from '../SalesForm/SalesForm'; 
import SalesHistory from '../SalesHistory/SalesHistory'; // Importar el nuevo componente
import './SellerDashboard.css';

const SellerDashboard = () => (
  <div className="seller-dashboard">
    <SalesForm />
    <SalesHistory /> {/* Reemplazo del Placeholder */}
  </div>
); 

export default SellerDashboard;