import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Subjects({ user }) {
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: '#6366f1',
    weight: 5
  })
  const [topicForm, setTopicForm] = useState({
    title: '',
    weight: 5,
    subject_id: ''
  })

  useEffect(() => {
    fetchSubjects()
    fetchTopics()
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

  async function fetchTopics() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, subjects(name, color)')
        .eq('user_id', user.id)
      
      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
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

  async function handleTopicSubmit(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('topics')
        .insert([{
          user_id: user.id,
          ...topicForm
        }])
      
      if (error) throw error
      setTopicForm({ title: '', weight: 5, subject_id: '' })
      setShowTopicForm(false)
      fetchTopics()
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Erro ao criar tópico')
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

  async function deleteTopic(id) {
    if (!confirm('Tem certeza que deseja excluir este tópico?')) return
    
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchTopics()
    } catch (error) {
      console.error('Error deleting topic:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Matérias e Tópicos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700">Matérias</h2>
            <button
              onClick={() => setShowSubjectForm(!showSubjectForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {showSubjectForm ? 'Cancelar' : '+ Nova Matéria'}
            </button>
          </div>

          {showSubjectForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
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
                    Peso (Relevância: 1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
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

          <div className="space-y-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                    <p className="text-sm text-gray-500">Peso: {subject.weight}/10</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteSubject(subject.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Topics Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700">Tópicos</h2>
            <button
              onClick={() => setShowTopicForm(!showTopicForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {showTopicForm ? 'Cancelar' : '+ Novo Tópico'}
            </button>
          </div>

          {showTopicForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={topicForm.title}
                    onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matéria
                  </label>
                  <select
                    value={topicForm.subject_id}
                    onChange={(e) => setTopicForm({ ...topicForm, subject_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione uma matéria</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (Relevância: 1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={topicForm.weight}
                    onChange={(e) => setTopicForm({ ...topicForm, weight: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Criar Tópico
                </button>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: topic.subjects?.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{topic.title}</h3>
                    <p className="text-sm text-gray-500">
                      {topic.subjects?.name} • Peso: {topic.weight}/10
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTopic(topic.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
