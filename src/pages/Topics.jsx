import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Topics({ user }) {
  const [topics, setTopics] = useState([])
  const [subjects, setSubjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')
  const [sortBy, setSortBy] = useState('subject')
  const [formData, setFormData] = useState({
    title: '',
    weight: 3,
    subject_id: ''
  })

  useEffect(() => {
    fetchTopics()
    fetchSubjects()
  }, [])

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

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      if (editingTopic) {
        const { error } = await supabase
          .from('topics')
          .update(formData)
          .eq('id', editingTopic.id)
        
        if (error) throw error
        alert('Tópico atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('topics')
          .insert([{
            user_id: user.id,
            ...formData
          }])
        
        if (error) throw error
      }
      
      resetForm()
      fetchTopics()
    } catch (error) {
      console.error('Error saving topic:', error)
      alert('Erro ao salvar tópico')
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

  function editTopic(topic) {
    setEditingTopic(topic)
    setFormData({
      title: topic.title,
      weight: topic.weight,
      subject_id: topic.subject_id
    })
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      title: '',
      weight: 3,
      subject_id: ''
    })
    setEditingTopic(null)
    setShowForm(false)
  }

  function getFilteredAndSortedTopics() {
    let filtered = topics

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter(t => t.subject_id === filterSubject)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'subject':
          return (a.subjects?.name || '').localeCompare(b.subjects?.name || '')
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'weight':
          return b.weight - a.weight
        default:
          return 0
      }
    })

    return sorted
  }

  const filteredTopics = getFilteredAndSortedTopics()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tópicos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Tópico'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingTopic ? 'Editar Tópico' : 'Novo Tópico'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matéria
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                Peso (Relevância: 1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingTopic ? 'Atualizar' : 'Criar'} Tópico
              </button>
              {editingTopic && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Matéria
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas as Matérias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="subject">Matéria</option>
              <option value="alphabetical">Ordem Alfabética</option>
              <option value="weight">Peso (Maior → Menor)</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="font-semibold">{filteredTopics.length}</span> tópico(s)
            </div>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">
            {filterSubject !== 'all' 
              ? 'Nenhum tópico encontrado para esta matéria.'
              : 'Nenhum tópico cadastrado. Crie seu primeiro tópico!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className={`bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow ${
                topic.completed ? 'border-2 border-green-400' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: topic.subjects?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 break-words">
                      {topic.title}
                    </h3>
                    {topic.completed && (
                      <span className="text-green-600 text-xs">✓ Concluído</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => editTopic(topic)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTopic(topic.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Matéria:</span>
                  <span className="font-medium text-gray-700">{topic.subjects?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Peso:</span>
                  <span className="font-medium text-gray-700">{topic.weight}/5</span>
                </div>
                {topic.completed && topic.completed_at && (
                  <div className="text-xs text-gray-400 pt-1 border-t">
                    Concluído em: {new Date(topic.completed_at).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
