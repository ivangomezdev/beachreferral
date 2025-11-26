'use client'; 
import React from 'react'; 
import SalesForm from '../SalesForm/SalesForm'; 
import SalesHistory from '../SalesHistory/SalesHistory';
import './SellerDashboard.css';

const SellerDashboard = () => (
  <div className="seller-dashboard">
    <SalesHistory />
    <SalesForm />
  </div>
); 

export default SellerDashboard;