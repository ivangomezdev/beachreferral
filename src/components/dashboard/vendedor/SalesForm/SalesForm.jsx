'use client'; import React, { useState } from 'react'; import Input from '@/components/ui/Input/Input'; import Button from '@/components/ui/Button/Button'; import Card from '@/components/ui/Card/Card'; import './SalesForm.css';
const SalesForm = () => {
  const [formData, setFormData] = useState({ date: '', city: '', quantity: 1, amount: '' });
  const handleSubmit = (e) => { e.preventDefault(); alert('Simulated Submit!'); };
  return (<Card title="New Sale"><form onSubmit={handleSubmit} className="sales-form"><Input label="Date" id="date" type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} /><Input label="Amount" id="amount" type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} /><Button type="submit">Submit</Button></form></Card>);
}; export default SalesForm;