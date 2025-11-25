'use client'
import React from 'react'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button/Button'
import './Navbar.css'
const Navbar = () => {
  const { user, userRole } = useAuth()
  return (
    <nav className='navbar'>
      <div className='navbar__container'>
        <Link href='/' className='logo'>
          SalesApp
        </Link>
        {user && (
          <div className='menu'>
            <span>
              {user.email} ({userRole})
            </span>
            <Button onClick={() => signOut(auth)} variant='secondary'>
              Log Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
export default Navbar
