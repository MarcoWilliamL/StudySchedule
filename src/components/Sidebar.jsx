import { supabase } from '../lib/supabase'

export default function Sidebar({ currentPage, onPageChange, user }) {
  const menuItems = [
    { id: 'board', label: 'Board', icon: '📊' },
    { id: 'plan', label: 'Plano', icon: '📋' },
    { id: 'subjects', label: 'Matérias', icon: '📚' },
    { id: 'topics', label: 'Tópicos', icon: '📝' },
    { id: 'sessions', label: 'Sessões de Estudo', icon: '⏱️' },
    { id: 'reviews', label: 'Revisões', icon: '🔄' },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="w-64 bg-indigo-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">📚 Studium</h1>
        <p className="text-sm text-indigo-300 mt-1">{user?.email}</p>
      </div>
      
      <nav className="flex-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              currentPage === item.id
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          🚪 Sair
        </button>
      </div>
    </div>
  )
}
