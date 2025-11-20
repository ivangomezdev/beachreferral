'use client'; import React from 'react'; import './Input.css';
const Input = ({ label, id, type='text', value, onChange, required }) => (
  <div className="input-group">{label && <label htmlFor={id}>{label}</label>}<input type={type} id={id} name={id} value={value} onChange={onChange} required={required} /></div>
); export default Input;