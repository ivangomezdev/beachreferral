const fs = require('fs');
const path = require('path');

// --- DEFINICIÓN DE ARCHIVOS Y CONTENIDO ---
const files = {
  // LIB & CONFIG
  'src/lib/firebase.js': `
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
`,

  // CONTEXT
  'src/context/AuthContext.js': `
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(firebaseUser);
            setUserRole(userDoc.data().role);
          } else {
            console.error("No user document found!");
            auth.signOut();
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { user, userRole, loading };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
`,

  // STYLES
  'src/app/globals.css': `
:root { --color-primary: #007bff; --color-secondary: #6c757d; --color-background: #f8f9fa; --color-text: #212529; --color-card-bg: #ffffff; --color-border: #dee2e6; --color-error: #dc3545; --font-family-sans: system-ui, sans-serif; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-family-sans); background-color: var(--color-background); color: var(--color-text); line-height: 1.5; }
a { color: var(--color-primary); text-decoration: none; }
.main-container { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
`,

  // APP ROUTER FILES
  'src/app/layout.js': `
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = { title: 'Sales App', description: 'Sales Tracker' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
`,
  'src/app/page.module.css': `
.loginPage { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--color-background); }
.loginPage__container { width: 100%; max-width: 400px; padding: 2rem; background-color: var(--color-card-bg); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
.loginPage__loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
`,
  'src/app/page.js': `
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm/LoginForm';
import styles from './page.module.css';

export default function LoginPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className={styles.loginPage__loading}>Loading...</div>;
  if (user) {
    if (userRole === 'vendedor') router.replace('/vendedor/dashboard');
    else if (userRole === 'admin') router.replace('/admin/dashboard');
    else if (userRole === 'owner') router.replace('/owner/dashboard');
    return <div className={styles.loginPage__loading}>Redirecting...</div>;
  }
  return (
    <main className={styles.loginPage}>
      <div className={styles.loginPage__container}>
        <h1>Sales Tracker</h1>
        <LoginForm />
      </div>
    </main>
  );
}
`,
  'src/app/(protected)/layout.js': `
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar/Navbar';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);

  if (loading) return <div>Loading session...</div>;
  return <div><Navbar /><main className="main-container">{children}</main></div>;
}
`,
  'src/app/(protected)/vendedor/dashboard/page.js': `
import React from 'react';
import SellerDashboard from '@/components/dashboard/vendedor/SellerDashboard/SellerDashboard';
export default function Page() { return (<div><h2>Vendedor Dashboard</h2><SellerDashboard /></div>); }
`,
  'src/app/(protected)/admin/dashboard/page.js': `
import React from 'react';
import AllSalesTable from '@/components/dashboard/admin/AllSalesTable/AllSalesTable';
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton';
export default function Page() { return (<div><h2>Admin Dashboard</h2><ExcelExportButton /><AllSalesTable /></div>); }
`,
  'src/app/(protected)/owner/dashboard/page.js': `
import React from 'react';
import MetricsSummary from '@/components/dashboard/owner/MetricsSummary/MetricsSummary';
import TopSellersList from '@/components/dashboard/owner/TopSellersList/TopSellersList';
export default function Page() { return (<div><h2>Owner Dashboard</h2><MetricsSummary /><TopSellersList /></div>); }
`,

  // UI COMPONENTS
  'src/components/ui/Button/Button.jsx': `
'use client'; import React from 'react'; import './Button.css';
const Button = ({ children, onClick, type='button', variant='primary', disabled=false }) => (
  <button className={\`button button--\${variant} \${disabled ? 'button--disabled' : ''}\`} onClick={onClick} type={type} disabled={disabled}>{children}</button>
); export default Button;
`,
  'src/components/ui/Button/Button.css': `
.button { padding: 0.75rem 1.5rem; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; color: white; }
.button--primary { background-color: var(--color-primary); }
.button--secondary { background-color: var(--color-secondary); }
.button--disabled { opacity: 0.6; cursor: not-allowed; }
`,
  'src/components/ui/Input/Input.jsx': `
'use client'; import React from 'react'; import './Input.css';
const Input = ({ label, id, type='text', value, onChange, required }) => (
  <div className="input-group">{label && <label htmlFor={id}>{label}</label>}<input type={type} id={id} name={id} value={value} onChange={onChange} required={required} /></div>
); export default Input;
`,
  'src/components/ui/Input/Input.css': `
.input-group { margin-bottom: 1rem; }
.input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.input-group input, .input-group select { width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 6px; }
`,
  'src/components/ui/Card/Card.jsx': `
'use client'; import React from 'react'; import './Card.css';
const Card = ({ children, title }) => (<div className="card">{title && <div className="card__header"><h3>{title}</h3></div>}<div className="card__body">{children}</div></div>); export default Card;
`,
  'src/components/ui/Card/Card.css': `
.card { background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 1rem; }
.card__header { padding: 1rem; border-bottom: 1px solid var(--color-border); }
.card__body { padding: 1rem; }
`,
  'src/components/ui/Modal/Modal.jsx': `
'use client'; import React from 'react'; import './Modal.css';
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (<div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e=>e.stopPropagation()}><div className="modal-header"><h4>{title}</h4><button onClick={onClose}>&times;</button></div><div className="modal-body">{children}</div></div></div>);
}; export default Modal;
`,
  'src/components/ui/Modal/Modal.css': `
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; width: 90%; max-width: 500px; border-radius: 8px; }
.modal-header { display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--color-border); }
.modal-body { padding: 1rem; }
`,

  // AUTH COMPONENT
  'src/components/auth/LoginForm/LoginForm.jsx': `
'use client'; import React, { useState } from 'react'; import { signInWithEmailAndPassword } from 'firebase/auth'; import { auth } from '@/lib/firebase'; import { useRouter } from 'next/navigation'; import Input from '@/components/ui/Input/Input'; import Button from '@/components/ui/Button/Button'; import './LoginForm.css';
const LoginForm = () => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(null); const router = useRouter();
  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); router.push('/'); } catch (err) { setError(err.message); } };
  return (<form className="login-form" onSubmit={handleLogin}>{error && <p className="error">{error}</p>}<Input label="Email" id="email" value={email} onChange={e=>setEmail(e.target.value)} required /><Input label="Password" id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /><Button type="submit">Log In</Button></form>);
}; export default LoginForm;
`,
  'src/components/auth/LoginForm/LoginForm.css': `.login-form { display: flex; flex-direction: column; } .error { color: var(--color-error); margin-bottom: 1rem; }`,

  // NAVBAR
  'src/components/layout/Navbar/Navbar.jsx': `
'use client'; import React from 'react'; import Link from 'next/link'; import { signOut } from 'firebase/auth'; import { auth } from '@/lib/firebase'; import { useAuth } from '@/context/AuthContext'; import Button from '@/components/ui/Button/Button'; import './Navbar.css';
const Navbar = () => {
  const { user, userRole } = useAuth();
  return (<nav className="navbar"><div className="navbar__container"><Link href="/" className="logo">SalesApp</Link>{user && <div className="menu"><span>{user.email} ({userRole})</span><Button onClick={()=>signOut(auth)} variant="secondary">Log Out</Button></div>}</div></nav>);
}; export default Navbar;
`,
  'src/components/layout/Navbar/Navbar.css': `.navbar { background: white; border-bottom: 1px solid var(--color-border); padding: 0 1.5rem; height: 60px; display: flex; align-items: center; } .navbar__container { width: 100%; max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; } .menu { display: flex; gap: 1rem; align-items: center; }`,

  // VENDEDOR DASHBOARD
  'src/components/dashboard/vendedor/SalesForm/SalesForm.jsx': `
'use client'; import React, { useState } from 'react'; import Input from '@/components/ui/Input/Input'; import Button from '@/components/ui/Button/Button'; import Card from '@/components/ui/Card/Card'; import './SalesForm.css';
const SalesForm = () => {
  const [formData, setFormData] = useState({ date: '', city: '', quantity: 1, amount: '' });
  const handleSubmit = (e) => { e.preventDefault(); alert('Simulated Submit!'); };
  return (<Card title="New Sale"><form onSubmit={handleSubmit} className="sales-form"><Input label="Date" id="date" type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} /><Input label="Amount" id="amount" type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} /><Button type="submit">Submit</Button></form></Card>);
}; export default SalesForm;
`,
  'src/components/dashboard/vendedor/SalesForm/SalesForm.css': `.sales-form { display: grid; gap: 1rem; }`,
  'src/components/dashboard/vendedor/SellerDashboard/SellerDashboard.jsx': `
'use client'; import React from 'react'; import SalesForm from '../SalesForm/SalesForm'; import './SellerDashboard.css';
const SellerDashboard = () => (<div className="seller-dashboard"><SalesForm /><div>Stats Placeholder</div></div>); export default SellerDashboard;
`,
  'src/components/dashboard/vendedor/SellerDashboard/SellerDashboard.css': `.seller-dashboard { display: grid; gap: 2rem; grid-template-columns: 1fr; } @media(min-width: 768px){ .seller-dashboard{ grid-template-columns: 1fr 1fr; } }`,

  // ADMIN DASHBOARD
  'src/components/dashboard/admin/AllSalesTable/AllSalesTable.jsx': `
'use client'; import React from 'react'; import Card from '@/components/ui/Card/Card'; import './AllSalesTable.css';
const AllSalesTable = () => (<Card title="All Sales"><table className="sales-table"><thead><tr><th>Seller</th><th>Amount</th><th>Status</th></tr></thead><tbody><tr><td>user@test.com</td><td>$100</td><td>Pending</td></tr></tbody></table></Card>); export default AllSalesTable;
`,
  'src/components/dashboard/admin/AllSalesTable/AllSalesTable.css': `.sales-table { width: 100%; border-collapse: collapse; } th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }`,
  'src/components/dashboard/admin/ExcelExportButton/ExcelExportButton.jsx': `
'use client'; import React from 'react'; import Button from '@/components/ui/Button/Button'; import './ExcelExportButton.css';
const ExcelExportButton = () => (<div className="excel-btn"><Button onClick={()=>alert('Download XLSX')}>Export Excel</Button></div>); export default ExcelExportButton;
`,
  'src/components/dashboard/admin/ExcelExportButton/ExcelExportButton.css': `.excel-btn { margin-bottom: 1rem; text-align: right; }`,

  // OWNER DASHBOARD
  'src/components/dashboard/owner/MetricsSummary/MetricsSummary.jsx': `
'use client'; import React from 'react'; import Card from '@/components/ui/Card/Card'; import './MetricsSummary.css';
const MetricsSummary = () => (<Card title="Metrics"><div className="metrics"><div>Total: $50k</div><div>Pending: $5k</div></div></Card>); export default MetricsSummary;
`,
  'src/components/dashboard/owner/MetricsSummary/MetricsSummary.css': `.metrics { display: flex; justify-content: space-around; font-size: 1.2rem; font-weight: bold; }`,
  'src/components/dashboard/owner/TopSellersList/TopSellersList.jsx': `
'use client'; import React from 'react'; import Card from '@/components/ui/Card/Card'; import './TopSellersList.css';
const TopSellersList = () => (<Card title="Top Sellers"><ul><li>Seller A - $15k</li><li>Seller B - $10k</li></ul></Card>); export default TopSellersList;
`,
  'src/components/dashboard/owner/TopSellersList/TopSellersList.css': `ul { list-style: none; } li { padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); }`
};

// --- EJECUCIÓN DEL SCRIPT ---
async function createProject() {
  console.log('🚀 Iniciando instalación de archivos...');

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);

    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Escribir archivo
    fs.writeFileSync(absolutePath, content.trim());
    console.log(`✅ Creado: ${filePath}`);
  }

  console.log('\n✨ ¡Instalación completada! ✨');
  console.log('Recuerda instalar Firebase si no lo has hecho:');
  console.log('npm install firebase');
}

createProject();