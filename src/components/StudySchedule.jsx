import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudySchedule({ subjects, userId, weeklyHours, planId }) {
  const [schedule, setSchedule] = useState([])
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [studySessions, setStudySessions] = useState([])
  const [completedSessions, setCompletedSessions] = useState([])

  useEffect(() => {
    generateSchedule()
    fetchStudySessions()
    if (planId) {
      fetchCompletedSessions()
    }
  }, [subjects, currentWeekStart, planId])

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

  async function fetchCompletedSessions() {
    try {
      const weekStart = currentWeekStart.toISOString().split('T')[0]
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('study_sessions_detailed')
        .select('subject_id, start_time, end_time, date')
        .eq('plan_id', planId)
        .gte('date', weekStart)
        .lt('date', weekEndStr)
      
      if (error) throw error
      setCompletedSessions(data || [])
    } catch (error) {
      console.error('Error fetching completed sessions:', error)
    }
  }

  function getCompletedMinutes(subjectId, date) {
    const sessions = completedSessions.filter(
      s => s.subject_id === subjectId && s.date === date
    )
    
    let totalMinutes = 0
    sessions.forEach(session => {
      const [startHour, startMin] = session.start_time.split(':').map(Number)
      const [endHour, endMin] = session.end_time.split(':').map(Number)
      const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
      totalMinutes += minutes
    })
    
    return totalMinutes
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
    const totalMinutes = availableHours * 60
    
    // Calculate minutes per subject based on weight, rounded to nearest 10
    const subjectAllocations = subjects.map(subject => {
      const exactMinutes = (subject.weight / totalWeight) * totalMinutes
      const roundedMinutes = Math.round(exactMinutes / 10) * 10
      return {
        ...subject,
        totalMinutes: roundedMinutes,
        remainingMinutes: roundedMinutes
      }
    })
    
    // Adjust for rounding errors
    const allocatedTotal = subjectAllocations.reduce((sum, s) => sum + s.totalMinutes, 0)
    const difference = totalMinutes - allocatedTotal
    if (difference !== 0 && subjectAllocations.length > 0) {
      // Add/subtract difference to highest weight subject
      subjectAllocations[0].totalMinutes += difference
      subjectAllocations[0].remainingMinutes += difference
    }

    // Calculate daily hours with weekend distribution
    const baseHoursPerDay = Math.floor((availableHours / 7) * 10) / 10 // Round to 0.1
    const totalBaseHours = baseHoursPerDay * 7
    const excessHours = availableHours - totalBaseHours
    
    // Distribute excess to weekends
    const saturdayExtra = Math.floor((excessHours / 2) * 10) / 10
    const sundayExtra = Math.ceil((excessHours / 2) * 10) / 10
    
    const dailyMinutes = [
      baseHoursPerDay * 60, // Sunday (0)
      baseHoursPerDay * 60, // Monday (1)
      baseHoursPerDay * 60, // Tuesday (2)
      baseHoursPerDay * 60, // Wednesday (3)
      baseHoursPerDay * 60, // Thursday (4)
      baseHoursPerDay * 60, // Friday (5)
      baseHoursPerDay * 60  // Saturday (6)
    ]
    
    // Add weekend extras
    dailyMinutes[0] += sundayExtra * 60  // Sunday
    dailyMinutes[6] += saturdayExtra * 60 // Saturday
    
    // Generate 7 days (current week)
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      const dayOfWeek = date.getDay()
      
      const daySchedule = {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        isToday: date.toDateString() === new Date().toDateString(),
        subjects: [],
        totalMinutes: dailyMinutes[dayOfWeek]
      }

      // Distribute subjects for this day
      let remainingMinutes = dailyMinutes[dayOfWeek]
      const maxSessionMinutes = 120 // Max 2 hours per session
      
      // Sort subjects by remaining minutes (descending)
      const sortedSubjects = [...subjectAllocations]
        .filter(s => s.remainingMinutes > 0)
        .sort((a, b) => b.remainingMinutes - a.remainingMinutes)
      
      for (const subject of sortedSubjects) {
        if (remainingMinutes <= 0) break
        if (daySchedule.subjects.length >= 8) break // Max 8 sessions per day
        
        // Calculate time for this subject on this day
        const idealMinutes = Math.min(
          subject.remainingMinutes,
          remainingMinutes,
          maxSessionMinutes
        )
        
        // Round to nearest 10 minutes, minimum 10
        const sessionMinutes = Math.max(10, Math.round(idealMinutes / 10) * 10)
        
        if (sessionMinutes >= 10) {
          daySchedule.subjects.push({
            ...subject,
            sessionMinutes: sessionMinutes,
            timeLimit: `${sessionMinutes} min`
          })
          
          // Update remaining minutes for this subject
          const subjectIndex = subjectAllocations.findIndex(s => s.id === subject.id)
          subjectAllocations[subjectIndex].remainingMinutes -= sessionMinutes
          remainingMinutes -= sessionMinutes
        }
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
                  const completedMinutes = planId ? getCompletedMinutes(subject.id, day.date) : 0
                  const plannedMinutes = subject.sessionMinutes || 60
                  const remainingMinutes = Math.max(0, plannedMinutes - completedMinutes)
                  const isCompleted = completedMinutes >= plannedMinutes || progress.completed
                  
                  return (
                    <div
                      key={idx}
                      className="text-sm bg-white border border-gray-200 p-2 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-800 text-xs">{subject.name}</div>
                        <button
                          onClick={() => !isCompleted && markAsCompleted(subject.id, day.date)}
                          disabled={isCompleted}
                          className={`text-xl transition-colors ${
                            isCompleted 
                              ? 'text-green-500 cursor-default' 
                              : 'text-gray-300 hover:text-green-500 cursor-pointer'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                      <div className={`text-xs mt-1 ${
                        isCompleted ? 'text-green-600 font-semibold' : 'text-gray-500'
                      }`}>
                        {isCompleted 
                          ? 'Concluído!' 
                          : planId && completedMinutes > 0
                            ? `${completedMinutes}/${plannedMinutes} min (faltam ${remainingMinutes} min)`
                            : `${plannedMinutes} min`
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
