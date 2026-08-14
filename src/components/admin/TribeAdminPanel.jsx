import { useState } from 'react'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function TribeAdminPanel() {
  const [tribeId, setTribeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleTriggerMemory = async () => {
    if (!tribeId) return toast.error('TribeId is required')
    setIsLoading(true)
    try {
      await adminApi.triggerTribeMemory(tribeId)
      toast.success('Tribe memory triggered successfully!')
    } catch (err) {
      toast.error('Failed to trigger tribe memory')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgetMemories = async () => {
    if (!tribeId) return toast.error('TribeId is required')
    setIsLoading(true)
    try {
      await adminApi.forgetOldTribeMemories(tribeId)
      toast.success('Old tribe memories forgotten successfully!')
    } catch (err) {
      toast.error('Failed to forget old tribe memories')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card-surface p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6">Tribe Management</h2>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="form-group">
          <label className="form-label text-sm font-medium mb-1 block">Tribe ID (Guid)</label>
          <input 
            className="input w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={tribeId}
            onChange={e => setTribeId(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          <button 
            className="btn px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            onClick={handleTriggerMemory}
            disabled={isLoading}
          >
            Trigger Tribe Memory
          </button>
          
          <button 
            className="btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            onClick={handleForgetMemories}
            disabled={isLoading}
          >
            Forget Old Tribe Memories
          </button>
        </div>
      </div>
    </div>
  )
}
