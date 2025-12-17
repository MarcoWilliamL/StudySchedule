import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudySchedule({ subjects, userId, weeklyHours }) {
  const [schedule, setSchedule] = useState([])
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [studySessions, setStudySessions] = useState([])

  useEffect(() => {
    generateSchedule()
    fetchStudySessions()
  }, [subjects, currentWeekStart])

  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  async function fetchStudySessions() {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
      
      if (error) throw error
      setStudySessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  function generateSchedule() {
    if (subjects.length === 0) {
      setSchedule([])
      return
    }

    const newSchedule = []
    
    // Calculate time allocation based on weight
    const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0)
    const availableHours = weeklyHours || 28 // Default 4 hours/day * 7 days
    
    // Calculate hours per subject based on weight
    const subjectHours = subjects.map(subject => ({
      ...subject,
      allocatedHours: (subject.weight / totalWeight) * availableHours
    }))

    // Distribute subjects across the week
    const hoursPerDay = availableHours / 7
    
    // Generate 7 days (current week)
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      
      const daySchedule = {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        isToday: date.toDateString() === new Date().toDateString(),
        subjects: []
      }

      // Distribute subjects for this day based on weight
      let remainingHours = hoursPerDay
      let subjectIndex = i % subjects.length
      
      while (remainingHours > 0 && daySchedule.subjects.length < 6) {
        const subject = subjectHours[subjectIndex % subjectHours.length]
        const timeForSubject = Math.min(
          Math.ceil(subject.allocatedHours / 7), // Distribute evenly across week
          remainingHours,
          2 // Max 2 hours per subject per day
        )
        
        if (timeForSubject > 0) {
          daySchedule.subjects.push({
            ...subject,
            timeLimit: `${Math.round(timeForSubject * 60)} min`
          })
          remainingHours -= timeForSubject
        }
        
        subjectIndex++
        
        // Prevent infinite loop
        if (subjectIndex > subjectHours.length * 2) break
      }

      newSchedule.push(daySchedule)
    }

    setSchedule(newSchedule)
  }

  function changeWeek(offset) {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (offset * 7))
    setCurrentWeekStart(getWeekStart(newDate))
  }

  function getStudyProgress(subjectId, date) {
    const sessionsForDay = studySessions.filter(session => {
      const sessionDate = new Date(session.date).toISOString().split('T')[0]
      return session.subject_id === subjectId && sessionDate === date
    })
    
    const totalSeconds = sessionsForDay.reduce((sum, session) => sum + session.duration_seconds, 0)
    const remainingSeconds = Math.max(3600 - totalSeconds, 0)
    const remainingMinutes = Math.ceil(remainingSeconds / 60)
    
    return {
      completed: totalSeconds >= 3600,
      remainingMinutes: remainingMinutes,
      totalMinutes: Math.floor(totalSeconds / 60)
    }
  }

  async function markAsCompleted(subjectId, date) {
    try {
      // Add a session of exactly 1 hour for this subject and date
      const { error } = await supabase
        .from('study_sessions')
        .insert([{
          subject_id: subjectId,
          duration_seconds: 3600,
          date: new Date(date + 'T12:00:00').toISOString()
        }])
      
      if (error) throw error
      await fetchStudySessions()
    } catch (error) {
      console.error('Error marking as completed:', error)
      alert('Erro ao marcar como concluído')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeWeek(-1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          ← Semana Anterior
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          Semana Atual
        </h2>
        <button
          onClick={() => changeWeek(1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Próxima Semana →
        </button>
      </div>

      {schedule.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Adicione matérias para gerar o cronograma
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {schedule.map((day) => (
            <div
              key={day.date}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                day.isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <div className={`font-bold text-sm mb-3 ${
                day.isToday ? 'text-indigo-700' : 'text-gray-700'
              }`}>
                {day.dayOfWeek}
                <div className="text-xs text-gray-500">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
              <div className="space-y-2">
                {day.subjects.map((subject, idx) => {
                  const progress = getStudyProgress(subject.id, day.date)
                  return (
                    <div
                      key={idx}
                      className="text-sm bg-white border border-gray-200 p-2 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-800 text-xs">{subject.name}</div>
                        <button
                          onClick={() => !progress.completed && markAsCompleted(subject.id, day.date)}
                          disabled={progress.completed}
                          className={`text-xl transition-colors ${
                            progress.completed 
                              ? 'text-green-500 cursor-default' 
                              : 'text-gray-300 hover:text-green-500 cursor-pointer'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                      <div className={`text-xs mt-1 ${
                        progress.completed ? 'text-green-600 font-semibold' : 'text-gray-500'
                      }`}>
                        {progress.completed 
                          ? 'Concluído!' 
                          : `Faltam ${progress.remainingMinutes} min`
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
