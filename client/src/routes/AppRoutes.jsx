import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import StudentLayout from '../layouts/StudentLayout.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'
import MealHistory from '../pages/MealHistory.jsx'
import StudentDashboard from '../pages/StudentDashboard.jsx'
import PaymentPage from '../pages/PaymentPage.jsx'
import PaymentHistory from '../pages/PaymentHistory.jsx'
import StudentQrCode from '../pages/StudentQrCode.jsx'
import MealExtensions from '../pages/MealExtensions.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminStudents from '../pages/admin/AdminStudents.jsx'
import AdminTransactions from '../pages/admin/AdminTransactions.jsx'
import AdminQrScanner from '../pages/admin/AdminQrScanner.jsx'
import AdminExtensions from '../pages/admin/AdminExtensions.jsx'
import AdminReports from '../pages/admin/AdminReports.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route element={<StudentLayout />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/meal-usage" element={<MealHistory />} />
        <Route path="/student/payments/new" element={<PaymentPage />} />
        <Route path="/student/payment-history" element={<PaymentHistory />} />
        <Route path="/student/qr-code" element={<StudentQrCode />} />
        <Route path="/student/extensions" element={<MealExtensions />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/qr-scanner" element={<AdminQrScanner />} />
        <Route path="/admin/extensions" element={<AdminExtensions />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  )
}

export default AppRoutes
