import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Reviews({ user }) {
  const [reviews, setReviews] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [modalForm, setModalForm] = useState({
    review_type: '',
    custom_days: '',
    notes: ''
  })

  // Spaced repetition sequence in days
  const REVIEW_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 30]

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          topics(title, completed),
          subjects(name, color)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true })
      
      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  function findClosestInterval(customDays) {
    const days = parseInt(customDays)
    if (isNaN(days) || days <= 0) return null
    
    // Find closest value in sequence
    let closest = REVIEW_SEQUENCE[0]
    let minDiff = Math.abs(days - closest)
    
    for (const interval of REVIEW_SEQUENCE) {
      const diff = Math.abs(days - interval)
      if (diff < minDiff) {
        minDiff = diff
        closest = interval
      }
    }
    
    return closest
  }

  function getNextInterval(currentInterval) {
    const currentIndex = REVIEW_SEQUENCE.indexOf(currentInterval)
    if (currentIndex === -1 || currentIndex === REVIEW_SEQUENCE.length - 1) {
      return REVIEW_SEQUENCE[REVIEW_SEQUENCE.length - 1] // Stay at 30 days
    }
    return REVIEW_SEQUENCE[currentIndex + 1]
  }

  function getSuggestedNextDate(review) {
    const nextInterval = getNextInterval(review.days_interval || 1)
    const today = new Date()
    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + nextInterval)
    return {
      date: nextDate.toISOString().split('T')[0],
      interval: nextInterval
    }
  }

  function openReviewModal(review) {
    setSelectedReview(review)
    const suggested = getSuggestedNextDate(review)
    setModalForm({
      review_type: '',
      custom_days: suggested.interval.toString(),
      notes: ''
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedReview(null)
    setModalForm({
      review_type: '',
      custom_days: '',
      notes: ''
    })
  }

  async function handleCompleteReview() {
    if (!selectedReview) return

    try {
      // Calculate next review date
      let daysToAdd = parseInt(modalForm.custom_days)
      if (isNaN(daysToAdd) || daysToAdd <= 0) {
        alert('Por favor, insira um número válido de dias')
        return
      }

      // Find closest interval in sequence
      const closestInterval = findClosestInterval(daysToAdd)
      
      const today = new Date()
      const nextReviewDate = new Date(today)
      nextReviewDate.setDate(nextReviewDate.getDate() + closestInterval)

      // Mark current review as completed
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          review_type: modalForm.review_type,
          notes: modalForm.notes
        })
        .eq('id', selectedReview.id)

      if (updateError) throw updateError

      // Create next review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert([{
          user_id: user.id,
          topic_id: selectedReview.topic_id,
          subject_id: selectedReview.subject_id,
          review_date: today.toISOString().split('T')[0],
          next_review_date: nextReviewDate.toISOString().split('T')[0],
          days_interval: closestInterval,
          completed: false
        }])

      if (insertError) throw insertError

      alert(`✓ Revisão concluída! Próxima revisão em ${closestInterval} dias`)
      closeModal()
      fetchReviews()
    } catch (error) {
      console.error('Error completing review:', error)
      alert('Erro ao concluir revisão')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Revisões</h1>
        <div className="text-sm text-gray-600">
          Sequência: {REVIEW_SEQUENCE.join(' → ')} dias
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 text-lg">🎉 Nenhuma revisão pendente para hoje!</p>
          <p className="text-gray-500 text-sm mt-2">
            Complete sessões de estudo e marque tópicos como concluídos para criar revisões.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => {
            const suggested = getSuggestedNextDate(review)
            return (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1"
                    style={{ backgroundColor: review.subjects?.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{review.subjects?.name}</h3>
                    <p className="text-sm text-gray-600">{review.topics?.title}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Intervalo atual:</span>
                    <span className="font-medium">{review.days_interval || 1} dias</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Próximo sugerido:</span>
                    <span className="font-medium text-indigo-600">{suggested.interval} dias</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Data prevista:</span>
                    <span className="font-medium">
                      {new Date(suggested.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openReviewModal(review)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  📝 Revisar Agora
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📚 Revisão de Tópico
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedReview.subjects?.color }}
                />
                <span className="font-semibold text-gray-800">
                  {selectedReview.subjects?.name}
                </span>
              </div>
              <p className="text-gray-700">{selectedReview.topics?.title}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Revisão
                </label>
                <input
                  type="text"
                  value={modalForm.review_type}
                  onChange={(e) => setModalForm({ ...modalForm, review_type: e.target.value })}
                  placeholder="Ex: Resumo, Flashcards, Exercícios..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próxima Revisão (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  value={modalForm.custom_days}
                  onChange={(e) => setModalForm({ ...modalForm, custom_days: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugerido: {getSuggestedNextDate(selectedReview).interval} dias
                  {modalForm.custom_days && findClosestInterval(modalForm.custom_days) !== parseInt(modalForm.custom_days) && (
                    <span className="text-indigo-600">
                      {' '}(será ajustado para {findClosestInterval(modalForm.custom_days)} dias)
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anotações
                </label>
                <textarea
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  rows={4}
                  placeholder="Como foi a revisão? O que precisa melhorar?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCompleteReview}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Concluir Revisão
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
