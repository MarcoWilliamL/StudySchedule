import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function StudyTimer({ subjects }) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1)
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
  }, [isRunning])

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function handleSubjectChange(e) {
    const subjectId = e.target.value
    setSelectedSubject(subjectId)
    const subject = subjects.find(s => s.id === subjectId)
    setSelectedSubjectName(subject ? subject.name : '')
  }

  function toggleTimer() {
    if (!selectedSubject && !isRunning) {
      alert('Selecione uma matéria primeiro')
      return
    }
    setIsRunning(!isRunning)
  }

  async function saveSession() {
    if (seconds === 0 || !selectedSubject) return

    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert([{
          subject_id: selectedSubject,
          duration_seconds: seconds,
          date: new Date().toISOString()
        }])
      
      if (error) throw error
      alert('Sessão salva com sucesso!')
      setSeconds(0)
      setIsRunning(false)
      setSelectedSubject('')
      setSelectedSubjectName('')
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Erro ao salvar sessão')
    }
  }

  function resetTimer() {
    setIsRunning(false)
    setSeconds(0)
    setSelectedSubject('')
    setSelectedSubjectName('')
  }

  const remainingSeconds = Math.max(3600 - seconds, 0)
  const isOverTime = seconds > 3600

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Cronômetro de Estudo</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Matéria
        </label>
        {selectedSubject ? (
          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
            {selectedSubjectName}
          </div>
        ) : (
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione uma matéria</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="text-center mb-4">
        <div className={`text-6xl font-mono font-bold mb-4 ${
          isOverTime ? 'text-green-600' : 'text-indigo-600'
        }`}>
          {formatTime(seconds)}
        </div>
        <div className={`text-lg font-semibold mb-2 ${
          isOverTime ? 'text-green-600' : 'text-gray-700'
        }`}>
          {isOverTime ? (
            <span>✓ Meta de 1 hora concluída!</span>
          ) : (
            <span>Tempo restante: {formatTime(remainingSeconds)}</span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Meta: 1 hora (60 min) por matéria
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            isRunning
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          🔄
        </button>
        <button
          onClick={saveSession}
          disabled={seconds === 0}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          💾 Salvar
        </button>
      </div>
    </div>
  )
}
