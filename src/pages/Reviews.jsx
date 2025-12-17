import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Reviews({ user }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Revisões</h1>
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">Funcionalidade de revisões em desenvolvimento...</p>
      </div>
    </div>
  )
}
