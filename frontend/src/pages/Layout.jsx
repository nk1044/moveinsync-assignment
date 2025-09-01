import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

export default Layout