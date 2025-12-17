import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SubjectManager({ subjects, onUpdate }) {
  const [newSubject, setNewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  async function addSubject(e) {
    e.preventDefault()
    if (!newSubject.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{ name: newSubject.trim() }])
      
      if (error) throw error
      setNewSubject('')
      onUpdate()
    } catch (error) {
      console.error('Error adding subject:', error)
      alert('Erro ao adicionar matéria')
    } finally {
      setLoading(false)
    }
  }

  async function deleteSubject(id) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Minhas Matérias</h2>
      
      <form onSubmit={addSubject} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Nome da matéria"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium text-gray-700">{subject.name}</span>
            <button
              onClick={() => deleteSubject(subject.id)}
              className="text-red-500 hover:text-red-700"
            >
              🗑️
            </button>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhuma matéria adicionada ainda
          </p>
        )}
      </div>
    </div>
  )
}
