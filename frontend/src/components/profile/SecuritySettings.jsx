import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { Key, Download, Trash2 } from 'lucide-react'

/**
 * Security Settings Component
 * Handles security-related settings (password, data export, account deletion)
 */
export const SecuritySettings = ({
  onPasswordChange,
  onExportData,
  onDeleteAccount
}) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Password & Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Password</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last changed 30 days ago</p>
            </div>
            <Button onClick={onPasswordChange} className="gap-2">
              <Key className="w-4 h-4" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Export Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download a copy of your data</p>
            </div>
            <Button variant="outline" onClick={onExportData} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-1">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={onDeleteAccount} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

