import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Sessions({ user }) {
  const [sessions, setSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    content_type: 'PDF',
    subject_id: '',
    topic_id: '',
    questions_resolved: 0,
    correct_answers: 0,
    wrong_answers: 0,
    comments: ''
  })

  const contentTypes = ['PDF', 'Lei', 'Vídeo', 'Q&A', 'Mapas Mentais']

  useEffect(() => {
    fetchSessions()
    fetchSubjects()
    fetchTopics()
  }, [])

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
        .from('study_sessions_detailed')
        .select('*, subjects(name, color), topics(title)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
      
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
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const sessionData = {
        user_id: user.id,
        ...formData,
        topic_id: formData.topic_id || null
      }

      if (editingSession) {
        const { error } = await supabase
          .from('study_sessions_detailed')
          .update(sessionData)
          .eq('id', editingSession.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('study_sessions_detailed')
          .insert([sessionData])
        
        if (error) throw error
      }

      resetForm()
      fetchSessions()
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Erro ao salvar sessão')
    }
  }

  async function deleteSession(id) {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return
    
    try {
      const { error } = await supabase
        .from('study_sessions_detailed')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  function editSession(session) {
    setEditingSession(session)
    setFormData({
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      content_type: session.content_type,
      subject_id: session.subject_id,
      topic_id: session.topic_id || '',
      questions_resolved: session.questions_resolved,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      comments: session.comments || ''
    })
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      content_type: 'PDF',
      subject_id: '',
      topic_id: '',
      questions_resolved: 0,
      correct_answers: 0,
      wrong_answers: 0,
      comments: ''
    })
    setEditingSession(null)
    setShowForm(false)
  }

  const filteredTopics = topics.filter(t => t.subject_id === formData.subject_id)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sessões de Estudo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Nova Sessão'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingSession ? 'Editar Sessão' : 'Nova Sessão de Estudo'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conteúdo</label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {contentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Início</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fim</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, topic_id: '' })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tópico (Opcional)</label>
              <select
                value={formData.topic_id}
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nenhum</option>
                {filteredTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questões Resolvidas</label>
              <input
                type="number"
                min="0"
                value={formData.questions_resolved}
                onChange={(e) => setFormData({ ...formData, questions_resolved: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acertos</label>
              <input
                type="number"
                min="0"
                value={formData.correct_answers}
                onChange={(e) => setFormData({ ...formData, correct_answers: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Erros</label>
              <input
                type="number"
                min="0"
                value={formData.wrong_answers}
                onChange={(e) => setFormData({ ...formData, wrong_answers: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentários</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingSession ? 'Atualizar' : 'Criar'} Sessão
              </button>
              {editingSession && (
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

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: session.subjects?.color }}
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{session.subjects?.name}</h3>
                  {session.topics && (
                    <p className="text-sm text-gray-600">{session.topics.title}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editSession(session)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">{new Date(session.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Horário</p>
                <p className="font-medium">{session.start_time} - {session.end_time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium">{session.content_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Questões</p>
                <p className="font-medium">{session.questions_resolved}</p>
              </div>
            </div>

            {session.questions_resolved > 0 && (
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">{session.correct_answers} acertos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span className="text-sm">{session.wrong_answers} erros</span>
                </div>
                <div className="text-sm text-gray-600">
                  ({((session.correct_answers / session.questions_resolved) * 100).toFixed(1)}% de aproveitamento)
                </div>
              </div>
            )}

            {session.comments && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-700">{session.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
