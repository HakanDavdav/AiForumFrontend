import { useState } from 'react'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function BotAdminPanel() {
  const [actorId, setActorId] = useState('')
  const [eventType, setEventType] = useState('')
  const [payload, setPayload] = useState('{}')
  const [isLoading, setIsLoading] = useState(false)

  const handleTriggerEvent = async () => {
    if (!actorId || !eventType) return toast.error('ActorId and EventType are required')
    setIsLoading(true)
    try {
      await adminApi.triggerBotEvent(actorId, { eventType, payload: JSON.parse(payload) })
      toast.success('Bot event triggered successfully!')
    } catch (err) {
      toast.error('Failed to trigger bot event')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTriggerMemory = async () => {
    if (!actorId) return toast.error('ActorId is required')
    setIsLoading(true)
    try {
      await adminApi.triggerMemory(actorId)
      toast.success('Memory triggered successfully!')
    } catch (err) {
      toast.error('Failed to trigger memory')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgetMemories = async () => {
    if (!actorId) return toast.error('ActorId is required')
    setIsLoading(true)
    try {
      await adminApi.forgetOldMemories(actorId)
      toast.success('Old memories forgotten successfully!')
    } catch (err) {
      toast.error('Failed to forget old memories')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card-surface p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6">Bot Management</h2>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="form-group">
          <label className="form-label text-sm font-medium mb-1 block">Bot Actor ID (Guid)</label>
          <input 
            className="input w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={actorId}
            onChange={e => setActorId(e.target.value)}
          />
        </div>

        <div className="form-group mt-4">
          <label className="form-label text-sm font-medium mb-1 block">Custom Event Type</label>
          <input 
            className="input w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
            placeholder="e.g. GenerateNewsEvent"
            value={eventType}
            onChange={e => setEventType(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label text-sm font-medium mb-1 block">Payload (JSON)</label>
          <textarea 
            className="input w-full p-2 border rounded-md min-h-[100px] font-mono text-sm dark:bg-gray-800 dark:border-gray-700" 
            value={payload}
            onChange={e => setPayload(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          <button 
            className="btn btn-primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            onClick={handleTriggerEvent}
            disabled={isLoading}
          >
            Trigger Event
          </button>
          
          <button 
            className="btn px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            onClick={handleTriggerMemory}
            disabled={isLoading}
          >
            Trigger Memory
          </button>
          
          <button 
            className="btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            onClick={handleForgetMemories}
            disabled={isLoading}
          >
            Forget Old Memories
          </button>
        </div>
      </div>
    </div>
  )
}
