import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { logger } from '../utils/logger'
import { clearStoredToken } from '../utils/tokenStorage'
import { 
  Button,
  LoadingWrapper,
  ConfirmModal,
  ProfileSkeleton,
  SkeletonCard,
  Skeleton,
  SkeletonText
} from '../components/ui'
import { 
  User, 
  Shield,
  Bell
} from 'lucide-react'
import { ProfileSummary } from '../components/profile/ProfileSummary'
import { ProfileEditForm } from '../components/profile/ProfileEditForm'
import { PasswordChangeModal } from '../components/profile/PasswordChangeModal'
import { PreferencesSettings } from '../components/profile/PreferencesSettings'
import { SecuritySettings } from '../components/profile/SecuritySettings'

export const ProfilePage = () => {
  const { user, updateProfile: updateUser, checkAuth } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    skills: '',
    experience: '',
    education: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    dataSharing: false,
    profileVisibility: 'private'
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    // ✅ Add request cancellation to prevent memory leaks
    const abortController = new AbortController();
    
    loadProfile(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [])


  const loadProfile = async (signal) => {
    try {
      setLoading(true)
      
      // ✅ Add retry logic for critical profile load
      const { apiRequest } = await import('../utils/api')
      const result = await apiRequest(
        () => userAPI.getProfile({ signal }),
        {
          retries: 2,
          retryDelay: 1500,
          retryableStatuses: [0, 500, 502, 503, 504],
          errorMessage: 'Failed to load profile. Please try again.',
          onRetry: (attempt, maxRetries) => {
            logger.debug(`Profile load failed (attempt ${attempt}/${maxRetries}), retrying...`)
          }
        }
      )
      
      // Check if request was aborted
      if (signal?.aborted) {
        return
      }
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      const profileData = result.data?.user || result.data
      setProfile(profileData)
      const fullName = profileData?.firstName && profileData?.lastName
        ? `${profileData.firstName} ${profileData.lastName}`.trim()
        : profileData?.name || ''
      
      setFormData({
        name: fullName,
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        email: profileData?.email || '',
        phone: profileData?.phone || '',
        location: profileData?.location || '',
        bio: profileData?.bio || '',
        website: profileData?.website || '',
        linkedin: profileData?.linkedin || '',
        github: profileData?.github || '',
        skills: Array.isArray(profileData?.skills) 
          ? profileData.skills.map(s => typeof s === 'string' ? s : s.name).join(', ')
          : '',
        experience: profileData?.experience || '',
        education: profileData?.education || ''
      })
      
      // Load preferences from API (non-critical, no retry needed)
      try {
        const prefsRes = await userAPI.getPreferences({ signal })
        if (!signal?.aborted) {
          const prefs = prefsRes.data?.data?.preferences
          if (prefs) {
            setPreferences(prefs)
          }
        }
      } catch (prefError) {
        // Ignore abort errors
        if (prefError.name !== 'AbortError' && prefError.code !== 'ERR_CANCELED') {
          logger.error('Failed to load preferences:', prefError)
        }
        // Fallback to default preferences
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return
      }
      logger.error('Failed to load profile:', error)
      // Fallback to user from context
      setProfile(user)
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || '',
        website: user?.website || '',
        linkedin: user?.linkedin || '',
        github: user?.github || '',
        skills: user?.skills?.join(', ') || '',
        experience: user?.experience || '',
        education: user?.education || ''
      })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    // ✅ Optimistic update - update UI immediately before API call
    const previousProfile = { ...profile }
    const previousFormData = { ...formData }
    
    // Split name into firstName and lastName if needed
    let firstName = formData.firstName
    let lastName = formData.lastName
    
    // If name field is used, split it
    if (formData.name && !firstName && !lastName) {
      const nameParts = formData.name.trim().split(/\s+/)
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    } else if (formData.name && (!firstName || !lastName)) {
      // If name is provided but firstName/lastName are missing, use name
      const nameParts = formData.name.trim().split(/\s+/)
      firstName = firstName || nameParts[0] || ''
      lastName = lastName || nameParts.slice(1).join(' ') || ''
    }
    
    const updateData = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      bio: formData.bio?.trim() || undefined,
      experience: formData.experience?.trim() || undefined,
      education: formData.education?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      linkedin: formData.linkedin?.trim() || undefined,
      github: formData.github?.trim() || undefined
    }
    
    // Optimistically update profile state
    const optimisticProfile = {
      ...profile,
      ...updateData,
      name: `${firstName} ${lastName}`.trim() || profile?.name
    }
    setProfile(optimisticProfile)
    
    try {
      setSaving(true)
      
      // Update profile via API
      const response = await userAPI.updateProfile(updateData)
      const updatedProfile = response.data.data.user
      
      // Update skills if they changed
      if (formData.skills) {
        const newSkills = formData.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        // Get current skills from API
        try {
          const skillsRes = await userAPI.getSkills()
          const currentSkills = skillsRes.data.data.skills || []
          
          // Add new skills
          for (const skillName of newSkills) {
            const exists = currentSkills.some(s => 
              (typeof s === 'string' ? s : s.name).toLowerCase() === skillName.toLowerCase()
            )
            if (!exists) {
              await userAPI.addSkill({ name: skillName, level: 5 })
            }
          }
        } catch (error) {
          logger.error('Failed to update skills:', error)
        }
      }
      
      // Reload full profile to ensure we have latest data
      const profileResponse = await userAPI.getProfile()
      const refreshedProfile = profileResponse.data.data.user
      
      // Update local state with server response
      setProfile(refreshedProfile)
      // Update user context
      await updateUser(refreshedProfile)
      // Refresh auth to ensure user context is fully updated
      await checkAuth()
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      // ✅ Revert optimistic update on error
      setProfile(previousProfile)
      setFormData(previousFormData)
      
      logger.error('Failed to update profile:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password updated successfully!')
    } catch (error) {
      logger.error('Failed to change password:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteAccount()
      // Clear tokens using centralized utility
      clearStoredToken()
      // Clear other user-related data
      localStorage.removeItem('user')
      localStorage.removeItem('userPreferences')
      sessionStorage.clear()
      toast.success('Account deleted successfully')
      navigate('/login', { replace: true })
    } catch (error) {
      logger.error('Failed to delete account:', error)
      toast.error(error.response?.data?.message || 'Failed to delete account')
    }
    setShowDeleteModal(false)
  }

  const exportData = async () => {
    try {
      // In a real app, this would call export data API
      const dataBlob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Failed to export data:', error)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const response = await userAPI.uploadProfilePicture(file)
      const profilePicture = response.data.data.profilePicture
      
      // Reload full profile to get updated data
      const profileResponse = await userAPI.getProfile()
      const updatedProfile = profileResponse.data.data.user
      
      // Update local state
      setProfile(updatedProfile)
      // Update user context with full profile
      await updateUser(updatedProfile)
      // Refresh auth to ensure user context is fully updated
      await checkAuth()
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      logger.error('Failed to upload avatar:', error)
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const tabs = [
    { id: 'profile', label: 'Personal Details', icon: User },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Account Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your personal details and preferences</p>
        </div>
      </div>

      <LoadingWrapper loading={loading}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <ProfileSummary
              profile={profile}
              onAvatarClick={handleAvatarClick}
              uploadingAvatar={uploadingAvatar}
              fileInputRef={fileInputRef}
              onAvatarUpload={handleAvatarUpload}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation - Horizontally scrollable on mobile */}
            <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-slate-800 overflow-x-auto scroll-hide-mobile pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg h-auto border-b-2 transition-all whitespace-nowrap flex-shrink-0 -mb-px ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <ProfileEditForm
                profile={profile}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSubmit={handleProfileSubmit}
              />
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <SecuritySettings
                onPasswordChange={() => setShowPasswordModal(true)}
                onExportData={exportData}
                onDeleteAccount={() => setShowDeleteModal(true)}
              />
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <PreferencesSettings
                preferences={preferences}
                setPreferences={setPreferences}
              />
            )}

          </div>
        </div>
      </LoadingWrapper>

      {/* Change Password Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        showPasswords={showPasswords}
        setShowPasswords={setShowPasswords}
        onSubmit={handlePasswordSubmit}
      />

      {/* Delete Account Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost."
        confirmText="Delete Account"
        confirmVariant="destructive"
      />
    </div>
  )
}
