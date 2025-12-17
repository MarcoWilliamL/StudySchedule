import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Plan({ user }) {
  const [plans, setPlans] = useState([])
  const [subjects, setSubjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_ids: []
  })

  useEffect(() => {
    fetchPlans()
    fetchSubjects()
  }, [])

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*, plan_subjects(subject_id, subjects(name))')
        .eq('user_id', user.id)
      
      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
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

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert([{
          user_id: user.id,
          name: formData.name,
          description: formData.description
        }])
        .select()
        .single()
      
      if (planError) throw planError

      if (formData.subject_ids.length > 0) {
        const planSubjects = formData.subject_ids.map(subjectId => ({
          plan_id: plan.id,
          subject_id: subjectId
        }))
        
        const { error: linkError } = await supabase
          .from('plan_subjects')
          .insert(planSubjects)
        
        if (linkError) throw linkError
      }

      setFormData({ name: '', description: '', subject_ids: [] })
      setShowForm(false)
      fetchPlans()
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Erro ao criar plano')
    }
  }

  function toggleSubject(subjectId) {
    setFormData(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId]
    }))
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Planos de Estudo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Plano'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Criar Novo Plano</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Plano
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matérias Incluídas
              </label>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="mr-2"
                    />
                    <span>{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Criar Plano
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Matérias:</p>
              <div className="space-y-1">
                {plan.plan_subjects?.map((ps, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {ps.subjects?.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
