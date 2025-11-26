'use client'
import React from 'react'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import './Navbar.css'
import LogoutIcon from '@mui/icons-material/Logout';
const Navbar = () => {
  const { user, userRole } = useAuth()

  return (
    <nav className='navbar'>
      <div className='navbar__container'>
        <Link href='/' className='logo'>
          <img style={{width:"80px"}} src="https://i.imgur.com/NqvR5G3.png" alt="Logo" />
        </Link>
        {user && (
          <div className='menu'>
            <span>
           
              {user.email.slice(0, user.email.indexOf("@"))} ({userRole})
            </span>
            <button style={{backgroundColor:"red",borderRadius:"5px",padding:"5px"}} onClick={() => signOut(auth)} variant='secondary'>
              <LogoutIcon style={{fontSize:"16px",color:"white"}}/>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar