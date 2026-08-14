import { useState } from 'react'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function ActorManagementPanel() {
  const [actorId, setActorId] = useState('')
  const [points, setPoints] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSetPoints = async () => {
    if (!actorId || !points) return toast.error('ActorId and Points are required')
    setIsLoading(true)
    try {
      await adminApi.setActorPoint(actorId, parseInt(points, 10))
      toast.success('Actor points updated successfully!')
    } catch (err) {
      toast.error('Failed to update actor points')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card-surface p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6">Actor Management</h2>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="form-group">
          <label className="form-label text-sm font-medium mb-1 block">Actor ID (Guid)</label>
          <input 
            className="input w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={actorId}
            onChange={e => setActorId(e.target.value)}
          />
        </div>

        <div className="form-group mt-4">
          <label className="form-label text-sm font-medium mb-1 block">New Score</label>
          <input 
            type="number"
            className="input w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
            placeholder="e.g. 1000"
            value={points}
            onChange={e => setPoints(e.target.value)}
          />
        </div>

        <div className="flex mt-4">
          <button 
            className="btn btn-primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-full"
            onClick={handleSetPoints}
            disabled={isLoading}
          >
            Set Actor Points
          </button>
        </div>
      </div>
    </div>
  )
}
