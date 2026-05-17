import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LogIn } from 'lucide-react'
import { ownerLogin } from '../lib/api'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ownerLogin(password)
      sessionStorage.setItem('owner_auth', '1')
      sessionStorage.setItem('owner_token', password)
      navigate('/owner')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-c-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-c-border shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-lavender flex items-center justify-center mb-3">
            <Lock size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-dark">Área da Lojista</h1>
          <p className="text-sm text-mid mt-1">Acesso restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-c-border rounded-lg px-3 py-2 text-c-text bg-white focus:border-primary focus:outline-none text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dark text-white font-bold py-2.5 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
