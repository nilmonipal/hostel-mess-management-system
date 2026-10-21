import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  )
}

export default AppRoutes
