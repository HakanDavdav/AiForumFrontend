import { useState, useEffect } from 'react'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function ConfigManagementPanel() {
  const [config, setConfig] = useState(null)
  const [configText, setConfigText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const res = await adminApi.getAppSettings()
      // res.data is the actual json element
      const jsonStr = JSON.stringify(res.data, null, 2)
      setConfig(res.data)
      setConfigText(jsonStr)
    } catch (err) {
      toast.error('Failed to load configuration')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async () => {
    try {
      const parsedConfig = JSON.parse(configText)
      setIsSaving(true)
      await adminApi.updateAppSettings(parsedConfig)
      toast.success('Configuration saved successfully! Background workers will reload.')
      setConfig(parsedConfig)
    } catch (e) {
      toast.error('Invalid JSON format or save failed')
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="card-surface p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">App Settings Configuration</h2>
        <div className="flex gap-2">
          <button 
            className="btn px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
            onClick={fetchConfig}
            disabled={isLoading || isSaving}
          >
            Reload
          </button>
          <button 
            className="btn btn-primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <label className="form-label text-sm font-medium mb-2 block">appsettings.json (Live Edit)</label>
        <textarea 
          className="input w-full p-4 border rounded-md font-mono text-sm dark:bg-gray-800 dark:border-gray-700 flex-1 resize-none" 
          value={configText}
          onChange={e => setConfigText(e.target.value)}
          spellCheck={false}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-2">
          Warning: Editing this JSON directly modifies the backend appsettings.json. Background services using IOptionsMonitor will restart automatically upon saving.
        </p>
      </div>
    </div>
  )
}
