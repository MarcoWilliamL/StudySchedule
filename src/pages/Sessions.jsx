import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Sessions({ user }) {
  const [sessions, setSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [plans, setPlans] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [showChronometerModal, setShowChronometerModal] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [currentSessionData, setCurrentSessionData] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [targetSeconds, setTargetSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasAlerted, setHasAlerted] = useState(false)
  const intervalRef = useRef(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    content_type: 'PDF',
    plan_id: '',
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
    fetchPlans()
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1
          
          // Check if reached target time
          if (newValue >= targetSeconds && !hasAlerted && targetSeconds > 0) {
            setHasAlerted(true)
            setIsRunning(false)
            alert('⏰ Tempo da sessão concluído!')
          }
          
          return newValue
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, targetSeconds, hasAlerted])

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  function getSessionDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startSeconds = startHour * 3600 + startMin * 60
    const endSeconds = endHour * 3600 + endMin * 60
    const elapsed = endSeconds - startSeconds
    
    return elapsed > 0 ? elapsed : 0
  }

  function closeChronometer() {
    setShowChronometerModal(false)
    setIsRunning(false)
    setElapsedSeconds(0)
    setTargetSeconds(0)
    setCurrentSessionId(null)
    setCurrentSessionData(null)
    setHasAlerted(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

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

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const sessionData = {
        user_id: user.id,
        ...formData,
        plan_id: formData.plan_id || null,
        topic_id: formData.topic_id || null
      }

      if (editingSession) {
        const { error } = await supabase
          .from('study_sessions_detailed')
          .update(sessionData)
          .eq('id', editingSession.id)
        
        if (error) throw error
        alert('Sessão atualizada com sucesso!')
      } else {
        const { data, error } = await supabase
          .from('study_sessions_detailed')
          .insert([sessionData])
          .select()
          .single()
        
        if (error) throw error
        
        // Store session data before resetting form
        setCurrentSessionData({
          topic_id: formData.topic_id,
          subject_id: formData.subject_id
        })
        
        // Calculate session duration and show chronometer modal
        const duration = getSessionDuration(formData.start_time, formData.end_time)
        setTargetSeconds(duration)
        setElapsedSeconds(0) // Start from 00:00
        setHasAlerted(false)
        setCurrentSessionId(data.id)
        setShowChronometerModal(true)
        setIsRunning(true)
      }

      if (editingSession) {
        resetForm()
      } else {
        // Don't reset form yet if showing chronometer
        setShowForm(false)
      }
      fetchSessions()
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Erro ao salvar sessão')
    }
  }

  async function markTopicAsCompleted(topicId, subjectId) {
    if (!topicId) {
      alert('Nenhum tópico selecionado nesta sessão')
      return
    }

    if (!confirm('Marcar este tópico como concluído e criar primeira revisão?')) return

    try {
      // Mark topic as completed
      const { error: topicError } = await supabase
        .from('topics')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', topicId)

      if (topicError) throw topicError

      // Create first review (next review in 1 day)
      const today = new Date()
      const nextReview = new Date(today)
      nextReview.setDate(nextReview.getDate() + 1)

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          user_id: user.id,
          topic_id: topicId,
          subject_id: subjectId,
          review_date: today.toISOString().split('T')[0],
          next_review_date: nextReview.toISOString().split('T')[0],
          days_interval: 1,
          completed: false
        }])

      if (reviewError) throw reviewError

      alert('✓ Tópico marcado como concluído! Primeira revisão agendada para amanhã.')
      fetchTopics()
    } catch (error) {
      console.error('Error marking topic as completed:', error)
      alert('Erro ao marcar tópico como concluído')
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
      plan_id: session.plan_id || '',
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
      plan_id: '',
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

      {/* Chronometer Modal */}
      {showChronometerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              ⏱️ Sessão Registrada!
            </h2>
            
            <div className="text-center mb-6">
              <div className={`text-7xl font-mono font-bold mb-4 ${
                elapsedSeconds >= targetSeconds ? 'text-green-600' : 'text-indigo-600'
              }`}>
                {formatTime(elapsedSeconds)}
              </div>
              <p className="text-gray-600 mb-2">
                {elapsedSeconds >= targetSeconds ? '✓ Sessão concluída!' : 'Tempo decorrido'}
              </p>
              <p className="text-sm text-gray-500">
                Meta: {formatTime(targetSeconds)}
              </p>
              {elapsedSeconds < targetSeconds && (
                <p className="text-sm text-gray-500">
                  Faltam: {formatTime(targetSeconds - elapsedSeconds)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  isRunning
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? '⏸️ Pausar' : '▶️ Continuar'}
              </button>
              <button
                onClick={() => {
                  closeChronometer()
                  resetForm()
                }}
                className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                ✓ Fechar
              </button>
            </div>

            {currentSessionData?.topic_id && (
              <button
                onClick={() => {
                  markTopicAsCompleted(currentSessionData.topic_id, currentSessionData.subject_id)
                  closeChronometer()
                  resetForm()
                }}
                className="w-full mt-3 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
              >
                📚 Marcar Tópico como Concluído
              </button>
            )}
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano (Opcional)</label>
              <select
                value={formData.plan_id}
                onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nenhum</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: session.subjects?.color }}
                />
                <div>
                  <h3 className="font-bold text-base text-gray-800">{session.subjects?.name}</h3>
                  {session.topics && (
                    <p className="text-xs text-gray-600">{session.topics.title}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => editSession(session)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-xs text-gray-500">Data</p>
                <p className="text-sm font-medium">{new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Horário</p>
                <p className="text-sm font-medium">{session.start_time} - {session.end_time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-medium">{session.content_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Questões</p>
                <p className="text-sm font-medium">{session.questions_resolved}</p>
              </div>
            </div>

            {session.questions_resolved > 0 && (
              <div className="flex gap-3 mb-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>{session.correct_answers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span>{session.wrong_answers}</span>
                </div>
                <div className="text-gray-600">
                  ({((session.correct_answers / session.questions_resolved) * 100).toFixed(0)}%)
                </div>
              </div>
            )}

            {session.comments && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-700">{session.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
