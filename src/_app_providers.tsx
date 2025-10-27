
import React from 'react'
import { AuthProvider } from '@api/useAuth'

export default function AppProviders({children}:{children: React.ReactNode}){
  return <AuthProvider>{children}</AuthProvider>
}
