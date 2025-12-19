import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Subjects({ user }) {
  const [subjects, setSubjects] = useState([])
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: '#6366f1',
    weight: 5
  })

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

  async function handleSubjectSubmit(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{
          user_id: user.id,
          ...subjectForm
        }])
      
      if (error) throw error
      setSubjectForm({ name: '', color: '#6366f1', weight: 5 })
      setShowSubjectForm(false)
      fetchSubjects()
    } catch (error) {
      console.error('Error creating subject:', error)
      alert('Erro ao criar matéria')
    }
  }

  async function deleteSubject(id) {
    if (!confirm('Tem certeza que deseja excluir esta matéria?')) return
    
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchSubjects()
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Matérias</h1>
        <button
          onClick={() => setShowSubjectForm(!showSubjectForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showSubjectForm ? 'Cancelar' : '+ Nova Matéria'}
        </button>
      </div>

      {showSubjectForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Nova Matéria</h2>
          <form onSubmit={handleSubjectSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <input
                type="color"
                value={subjectForm.color}
                onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (Relevância: 1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={subjectForm.weight}
                onChange={(e) => setSubjectForm({ ...subjectForm, weight: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Criar Matéria
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <h3 className="font-bold text-lg text-gray-800">{subject.name}</h3>
              </div>
              <button
                onClick={() => deleteSubject(subject.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
            <p className="text-sm text-gray-600">Peso: {subject.weight}/5</p>
          </div>
        ))}
      </div>
    </div>
  )
}
