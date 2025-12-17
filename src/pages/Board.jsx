import { useState, useEffect } from 'react'
import StudySchedule from '../components/StudySchedule'
import { supabase } from '../lib/supabase'

export default function Board({ user }) {
  const [subjects, setSubjects] = useState([])
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedPlanData, setSelectedPlanData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (selectedPlan) {
      fetchSubjectsByPlan()
    } else {
      fetchAllSubjects()
      setSelectedPlanData(null)
    }
  }, [selectedPlan])

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  async function fetchAllSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('weight', { ascending: false })
      
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function fetchSubjectsByPlan() {
    try {
      // Fetch plan data
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', selectedPlan)
        .single()
      
      if (planError) throw planError
      setSelectedPlanData(planData)

      // Fetch plan subjects
      const { data, error } = await supabase
        .from('plan_subjects')
        .select('subjects(*)')
        .eq('plan_id', selectedPlan)
      
      if (error) throw error
      
      const planSubjects = data.map(ps => ps.subjects).filter(Boolean)
      planSubjects.sort((a, b) => b.weight - a.weight)
      
      setSubjects(planSubjects)
    } catch (error) {
      console.error('Error fetching plan subjects:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione um Plano de Estudo
        </label>
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas as Matérias</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>{plan.name}</option>
          ))}
        </select>
        {selectedPlan && selectedPlanData && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Tempo semanal disponível:</span> {selectedPlanData.weekly_hours}h
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Matérias organizadas por prioridade (peso). O cronograma distribui o tempo disponível proporcionalmente ao peso de cada matéria.
            </p>
          </div>
        )}
      </div>
      
      <StudySchedule 
        key={refreshKey} 
        subjects={subjects} 
        userId={user.id}
        weeklyHours={selectedPlanData?.weekly_hours || null}
      />
    </div>
  )
}
