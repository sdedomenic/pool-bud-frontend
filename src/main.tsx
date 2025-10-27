import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles.css'

import App from './App'
import AppProviders from './_app_providers'
import ProtectedRoute from './layouts/ProtectedRoute'
import DispatcherRoute from './layouts/DispatcherRoute'
import PlatformAdminRoute from './layouts/PlatformAdminRoute'
import StaffShell from './layouts/StaffShell'

import Landing from '@pages/Landing'
import Login from '@pages/Login'
import ForgotPassword from '@pages/ForgotPassword'
import ResetPassword from '@pages/ResetPassword'
import Dashboard from '@pages/Dashboard'
import JobDetail from '@pages/JobDetail'
import Inventory from '@pages/Inventory'
import Settings from '@pages/Settings'
import CustomerPortal from '@pages/CustomerPortal'
import WelcomeOnboarding from '@pages/WelcomeOnboarding'
import CustomersPage from '@pages/CustomersPage'
import AccountSettings from '@pages/AccountSettings'
import CustomerSetup from '@pages/CustomerSetup'

import Features from '@pages/Features'
import Services from '@pages/Services'
import Pricing from '@pages/Pricing'
import About from '@pages/About'
import StaffSetup from '@pages/StaffSetup'

const router = createBrowserRouter([
  // Public site
  { path: '/', element: <Landing /> },
  { path: '/features', element: <Features /> },
  { path: '/services', element: <Services /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/about', element: <About /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  {
    path: '/welcome',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <WelcomeOnboarding /> }],
  },

  { path: '/customer-setup', element: <CustomerSetup /> },

  // Protected app
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DispatcherRoute />,
        children: [
          {
            element: <App />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'jobs/:id', element: <JobDetail /> },
              { path: 'inventory', element: <Inventory /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'settings', element: <Settings /> },
              { path: 'account', element: <AccountSettings /> },
            ]
          }
        ]
      }
    ]
  },

  {
    path: '/staff',
    element: <ProtectedRoute />,
    children: [
      {
        element: <PlatformAdminRoute />,
        children: [
          {
            element: <StaffShell />,
            children: [
              { index: true, element: <Navigate to="setup" replace /> },
              { path: 'setup', element: <StaffSetup /> },
            ],
          },
        ],
      },
    ],
  },

  // Public customer portal
  { path: '/customer/:customerId', element: <CustomerPortal /> },
])

const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppProviders>
  </React.StrictMode>
)
