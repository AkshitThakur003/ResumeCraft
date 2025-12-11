import React from 'react'
import { Card, CardContent, Button } from '../ui'
import { Camera } from 'lucide-react'
import { formatDate } from '../../utils'

/**
 * Profile Summary Component
 * Displays user profile card with avatar and basic info
 */
export const ProfileSummary = ({ profile, onAvatarClick, uploadingAvatar, fileInputRef, onAvatarUpload }) => {
  return (
    <Card className="sticky top-6">
      <CardContent className="p-6 text-center">
        <div className="relative inline-block mb-5">
          {profile?.profilePicture?.url ? (
            <img 
              key={profile.profilePicture.url}
              src={profile.profilePicture.url} 
              alt={profile?.firstName && profile?.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : profile?.name || 'Profile'} 
              className="w-28 h-28 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700 shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-200 dark:border-slate-700 shadow-lg">
              {(profile?.firstName?.[0] || profile?.name?.[0] || 'U').toUpperCase()}
              {profile?.lastName?.[0]?.toUpperCase() || ''}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onAvatarUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-0 right-0 w-9 h-9 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full shadow-md hover:shadow-lg transition-shadow"
            onClick={onAvatarClick}
            disabled={uploadingAvatar}
            aria-label="Upload profile picture"
          >
            {uploadingAvatar ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
            ) : (
              <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {profile?.firstName && profile?.lastName 
            ? `${profile.firstName} ${profile.lastName}` 
            : profile?.name || 'User'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate w-full" title={profile?.email}>
          {profile?.email}
        </p>
        <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            Member since {formatDate(profile?.createdAt || new Date())}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

