import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ClientPage from './pages/ClientPage'
import LoginPage from './pages/LoginPage'
import OwnerPage from './pages/OwnerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
