import { useState, useEffect } from 'react'
import StudySchedule from '../components/StudySchedule'
import StudyTimer from '../components/StudyTimer'
import { supabase } from '../lib/supabase'

export default function Board({ user }) {
  const [subjects, setSubjects] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  function handleUpdate() {
    fetchSubjects()
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StudyTimer subjects={subjects} userId={user.id} />
      </div>
      
      <StudySchedule key={refreshKey} subjects={subjects} />
    </div>
  )
}
