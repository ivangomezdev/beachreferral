'use client'
import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import './LoginForm.css'
const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      console.log("Intentando login con:", { email, password });
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form className='login-form' onSubmit={handleLogin}>
      {error && <p className='error'>{error}</p>}
      <Input
        label='Email'
        id='email'
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Input
        label='Password'
        id='password'
        type='password'
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <Button type='submit'>Log In</Button>
    </form>
  )
}
export default LoginForm
