import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Board from './pages/Board'
import Plan from './pages/Plan'
import Subjects from './pages/Subjects'
import Topics from './pages/Topics'
import Sessions from './pages/Sessions'
import Reviews from './pages/Reviews'
import { supabase } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('board')

  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-indigo-900">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'board':
        return <Board user={user} />
      case 'plan':
        return <Plan user={user} />
      case 'subjects':
        return <Subjects user={user} />
      case 'topics':
        return <Topics user={user} />
      case 'sessions':
        return <Sessions user={user} />
      case 'reviews':
        return <Reviews user={user} />
      default:
        return <Board user={user} />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} user={user} />
      <div className="flex-1 overflow-auto">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
