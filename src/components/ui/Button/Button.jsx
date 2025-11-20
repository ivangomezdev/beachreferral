'use client'; import React from 'react'; import './Button.css';
const Button = ({ children, onClick, type='button', variant='primary', disabled=false }) => (
  <button className={`button button--${variant} ${disabled ? 'button--disabled' : ''}`} onClick={onClick} type={type} disabled={disabled}>{children}</button>
); export default Button;