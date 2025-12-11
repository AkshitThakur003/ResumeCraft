import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import toast from 'react-hot-toast'
import { userAPI } from '../../utils/api'

/**
 * Preferences Settings Component
 * Handles user preferences management
 */
export const PreferencesSettings = ({ preferences, setPreferences }) => {
  const handlePreferenceChange = async (key, value) => {
    const newPrefs = {...preferences, [key]: value}
    setPreferences(newPrefs)
    try {
      await userAPI.updatePreferences(newPrefs)
      toast.success('Preferences saved')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
      setPreferences(preferences)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 pb-2 border-b border-gray-200 dark:border-slate-700">Notifications</h4>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Email Notifications</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Push Notifications</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 pb-2 border-b border-gray-200 dark:border-slate-700">Privacy</h4>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Data Sharing</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Allow anonymous usage data collection</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={preferences.dataSharing}
                  onChange={(e) => handlePreferenceChange('dataSharing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

