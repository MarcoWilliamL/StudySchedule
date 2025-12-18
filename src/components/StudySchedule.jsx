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

    // Standard study periods (Pomodoro-based)
    const STUDY_PERIODS = [60, 50, 30, 25]
    
    // Calculate time allocation based on weight
    const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0)
    const availableHours = weeklyHours || 28
    const totalMinutes = availableHours * 60
    
    // Calculate minutes per subject based on weight
    const subjectAllocations = subjects.map(subject => {
      const exactMinutes = (subject.weight / totalWeight) * totalMinutes
      return {
        ...subject,
        totalMinutes: Math.round(exactMinutes),
        remainingMinutes: Math.round(exactMinutes),
        dailyAllocations: {} // Track allocation per day
      }
    })
    
    // Adjust for rounding errors
    const allocatedTotal = subjectAllocations.reduce((sum, s) => sum + s.totalMinutes, 0)
    const difference = totalMinutes - allocatedTotal
    if (difference !== 0 && subjectAllocations.length > 0) {
      subjectAllocations[0].totalMinutes += difference
      subjectAllocations[0].remainingMinutes += difference
    }

    // Calculate daily target minutes with weekend distribution
    const baseMinutesPerDay = Math.floor(totalMinutes / 7)
    const excessMinutes = totalMinutes - (baseMinutesPerDay * 7)
    
    const dailyTargets = [
      baseMinutesPerDay + Math.ceil(excessMinutes / 2),  // Sunday (0)
      baseMinutesPerDay,                                  // Monday (1)
      baseMinutesPerDay,                                  // Tuesday (2)
      baseMinutesPerDay,                                  // Wednesday (3)
      baseMinutesPerDay,                                  // Thursday (4)
      baseMinutesPerDay,                                  // Friday (5)
      baseMinutesPerDay + Math.floor(excessMinutes / 2)  // Saturday (6)
    ]
    
    // First pass: Distribute time across days
    const dayAllocations = Array(7).fill(null).map(() => [])
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      let dailyRemaining = dailyTargets[dayIndex]
      
      // Sort subjects by remaining minutes (descending)
      const sortedSubjects = [...subjectAllocations]
        .filter(s => s.remainingMinutes > 0)
        .sort((a, b) => b.remainingMinutes - a.remainingMinutes)
      
      for (const subject of sortedSubjects) {
        if (dailyRemaining < 25) break // Minimum session is 25 min
        
        // Calculate ideal time for this subject today
        const idealMinutes = Math.min(
          subject.remainingMinutes,
          dailyRemaining,
          120 // Max 2 hours per occurrence
        )
        
        if (idealMinutes >= 25) {
          dayAllocations[dayIndex].push({
            subjectId: subject.id,
            minutes: idealMinutes
          })
          
          const subjectIndex = subjectAllocations.findIndex(s => s.id === subject.id)
          subjectAllocations[subjectIndex].remainingMinutes -= idealMinutes
          dailyRemaining -= idealMinutes
        }
      }
    }
    
    // Second pass: Fit to standard periods and redistribute excess
    const finalSchedule = []
    const excessBySubject = {}
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + dayIndex)
      
      const daySchedule = {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        isToday: date.toDateString() === new Date().toDateString(),
        subjects: []
      }
      
      for (const allocation of dayAllocations[dayIndex]) {
        const subject = subjects.find(s => s.id === allocation.subjectId)
        let remainingMinutes = allocation.minutes
        
        // Split into standard periods
        while (remainingMinutes >= 25) {
          let sessionMinutes = 0
          
          // Find best fitting period
          for (const period of STUDY_PERIODS) {
            if (remainingMinutes >= period) {
              sessionMinutes = period
              break
            }
          }
          
          // If no perfect fit, use closest smaller period
          if (sessionMinutes === 0) {
            if (remainingMinutes >= 25) {
              sessionMinutes = 25
            } else {
              // Save excess for redistribution
              if (!excessBySubject[allocation.subjectId]) {
                excessBySubject[allocation.subjectId] = 0
              }
              excessBySubject[allocation.subjectId] += remainingMinutes
              break
            }
          }
          
          daySchedule.subjects.push({
            ...subject,
            sessionMinutes: sessionMinutes,
            timeLimit: `${sessionMinutes} min`,
            sessionId: `${subject.id}-${dayIndex}-${daySchedule.subjects.length}` // Unique ID for each session
          })
          
          remainingMinutes -= sessionMinutes
        }
        
        // Handle small excess (< 25 min)
        if (remainingMinutes > 0 && remainingMinutes < 25) {
          if (!excessBySubject[allocation.subjectId]) {
            excessBySubject[allocation.subjectId] = 0
          }
          excessBySubject[allocation.subjectId] += remainingMinutes
        }
      }
      
      finalSchedule.push(daySchedule)
    }
    
    // Third pass: Redistribute excess minutes
    for (const [subjectId, excessMinutes] of Object.entries(excessBySubject)) {
      if (excessMinutes >= 25) {
        const subject = subjects.find(s => s.id === subjectId)
        
        // Find day with least sessions to add excess
        const dayWithLeastSessions = finalSchedule
          .map((day, index) => ({ day, index, count: day.subjects.length }))
          .sort((a, b) => a.count - b.count)[0]
        
        // Determine best period for excess
        let sessionMinutes = 25
        for (const period of STUDY_PERIODS) {
          if (excessMinutes >= period) {
            sessionMinutes = period
            break
          }
        }
        
        dayWithLeastSessions.day.subjects.push({
          ...subject,
          sessionMinutes: sessionMinutes,
          timeLimit: `${sessionMinutes} min`,
          sessionId: `${subject.id}-${dayWithLeastSessions.index}-${dayWithLeastSessions.day.subjects.length}` // Unique ID
        })
      }
    }
    
    setSchedule(finalSchedule)
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

  async function markAsCompleted(sessionId, subjectId, date, sessionMinutes) {
    try {
      if (planId) {
        // Create session in study_sessions_detailed for plan tracking
        const now = new Date()
        const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const endDate = new Date(now.getTime() + sessionMinutes * 60000)
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
        
        const { error } = await supabase
          .from('study_sessions_detailed')
          .insert([{
            user_id: userId,
            plan_id: planId,
            subject_id: subjectId,
            date: date,
            start_time: startTime,
            end_time: endTime,
            content_type: 'Estudo',
            questions_resolved: 0,
            correct_answers: 0,
            wrong_answers: 0,
            comments: 'Sessão marcada como concluída'
          }])
        
        if (error) throw error
        await fetchCompletedSessions()
      } else {
        // Fallback to old table
        const durationSeconds = sessionMinutes * 60
        const { error } = await supabase
          .from('study_sessions')
          .insert([{
            subject_id: subjectId,
            duration_seconds: durationSeconds,
            date: new Date(date + 'T12:00:00').toISOString()
          }])
        
        if (error) throw error
        await fetchStudySessions()
      }
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
                  const sessionMinutes = subject.sessionMinutes || 60
                  const completedMinutes = planId ? getCompletedMinutes(subject.id, day.date) : 0
                  
                  // Calculate cumulative minutes for sessions of this subject up to this point
                  let cumulativeMinutes = 0
                  for (let i = 0; i <= idx; i++) {
                    if (day.subjects[i].id === subject.id) {
                      cumulativeMinutes += (day.subjects[i].sessionMinutes || 60)
                    }
                  }
                  
                  // This session is completed if total completed >= cumulative up to this session
                  const isCompleted = completedMinutes >= cumulativeMinutes
                  
                  return (
                    <div
                      key={subject.sessionId || idx}
                      className="text-sm bg-white border border-gray-200 p-2 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-800 text-xs">{subject.name}</div>
                        <button
                          onClick={() => !isCompleted && markAsCompleted(subject.sessionId, subject.id, day.date, sessionMinutes)}
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
                          : `${sessionMinutes} min`
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
