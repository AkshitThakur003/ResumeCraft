import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mail, Calendar, Shield, User, UserCheck, UserX,
  FileText, Briefcase, Clock, MapPin, KeyRound, Send, Activity, UserCog
} from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalContent, Button, Input, Textarea } from '../ui'
import { useToast } from '../ui'
import { adminAPI } from '../../utils/api'
import { fadeIn, scaleIn } from '../ui/motionVariants'
import { cn } from '../../utils'

export const UserDetailModal = ({ isOpen, onClose, user }) => {
  const { showToast } = useToast()
  const showToastRef = useRef(showToast)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])

  const fetchUserActivity = React.useCallback(async () => {
    if (!user?._id) return
    
    try {
      setActivityLoading(true)
      const response = await adminAPI.getUserActivity(user._id, { limit: 10 })
      setActivityLogs(response.data?.data?.logs || [])
    } catch (err) {
      try {
        showToastRef.current('Failed to fetch user activity', 'error')
      } catch (toastErr) {
        // Silently fail if toast fails
      }
    } finally {
      setActivityLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    if (showActivity && user?._id) {
      fetchUserActivity()
    }
  }, [showActivity, user?._id, fetchUserActivity])

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to send a password reset email to this user?')) {
      return
    }

    try {
      setResettingPassword(true)
      const response = await adminAPI.resetUserPassword(user._id)
      if (response.data?.success) {
        showToast('Password reset email sent successfully', 'success')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send password reset email', 'error')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      showToast('Please fill in both subject and message', 'warning')
      return
    }

    try {
      setSendingEmail(true)
      const response = await adminAPI.sendEmailToUser(user._id, {
        subject: emailSubject,
        message: emailMessage,
      })
      if (response.data?.success) {
        showToast('Email sent successfully', 'success')
        setShowEmailModal(false)
        setEmailSubject('')
        setEmailMessage('')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send email', 'error')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleImpersonate = async () => {
    if (!user) return
    
    if (!confirm(`⚠️ WARNING: You are about to impersonate ${user.email}. This will log you in as this user. Continue?`)) {
      return
    }

    try {
      setImpersonating(true)
      const response = await adminAPI.impersonateUser(user._id)
      if (response.data?.success) {
        // Store impersonation info
        const { accessToken, refreshToken, originalAdminId } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('impersonating', 'true')
        localStorage.setItem('originalAdminId', originalAdminId)
        
        showToast('Impersonation successful. Reloading...', 'success')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to impersonate user', 'error')
    } finally {
      setImpersonating(false)
    }
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    recruiter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-3xl">
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ModalHeader>
              <div className="flex items-center justify-between">
                <ModalTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                    {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'User'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                      User Details
                    </div>
                  </div>
                </ModalTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </ModalHeader>

            <ModalContent className="max-h-[80vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  <span className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    roleColors[user.role] || roleColors.user
                  )}>
                    {user.role === 'admin' && <Shield className="h-4 w-4" />}
                    {user.role === 'recruiter' && <Briefcase className="h-4 w-4" />}
                    {user.role === 'user' && <User className="h-4 w-4" />}
                    {user.role || 'user'}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    user.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {user.isActive ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    variants={fadeIn}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {user.email}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={fadeIn}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(user.createdAt)}
                    </div>
                  </motion.div>

                  {user.firstName && (
                    <motion.div
                      variants={fadeIn}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <User className="h-4 w-4" />
                        First Name
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {user.firstName}
                      </div>
                    </motion.div>
                  )}

                  {user.lastName && (
                    <motion.div
                      variants={fadeIn}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {user.lastName}
                      </div>
                    </motion.div>
                  )}

                  {user.lastLogin && (
                    <motion.div
                      variants={fadeIn}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <Clock className="h-4 w-4" />
                        Last Login
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(user.lastLogin)}
                      </div>
                    </motion.div>
                  )}

                  {user.deactivatedAt && (
                    <motion.div
                      variants={fadeIn}
                      className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-2">
                        <UserX className="h-4 w-4" />
                        Deactivated At
                      </div>
                      <div className="font-medium text-red-700 dark:text-red-300">
                        {formatDate(user.deactivatedAt)}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <motion.div variants={fadeIn} className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {!user.oauthProvider && (
                    <Button
                      variant="outline"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="flex items-center gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      {resettingPassword ? 'Sending...' : 'Reset Password'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowActivity(!showActivity)}
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    {showActivity ? 'Hide' : 'Show'} Activity
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleImpersonate}
                    disabled={impersonating}
                    className="flex items-center gap-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <UserCog className="h-4 w-4" />
                    {impersonating ? 'Impersonating...' : 'Impersonate'}
                  </Button>
                </motion.div>

                {/* User Activity */}
                {showActivity && (
                  <motion.div
                    variants={fadeIn}
                    className="pt-4 border-t border-slate-200 dark:border-slate-700"
                  >
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </h3>
                    {activityLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                        No activity found
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activityLogs.map((log) => (
                          <div
                            key={log._id}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {log.action?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                {log.description && (
                                  <div className="text-slate-600 dark:text-slate-400 mt-1">
                                    {log.description}
                                  </div>
                                )}
                                {log.adminId && (
                                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    By: {log.adminId.email || log.adminId.firstName}
                                  </div>
                                )}
                              </div>
                              {log.createdAt && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                                  {new Date(log.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Additional Info */}
                {user.bio || user.location || user.phoneNumber ? (
                  <motion.div variants={fadeIn} className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.location && (
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {user.location}
                          </div>
                        </div>
                      )}
                      {user.phoneNumber && (
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                            Phone Number
                          </div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {user.phoneNumber}
                          </div>
                        </div>
                      )}
                    </div>
                    {user.bio && (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          Bio
                        </div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {user.bio}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </div>
            </ModalContent>
          </motion.div>
        </Modal>
      )}

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} className="sm:max-w-2xl">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Email to {user?.firstName || user?.email}
                </ModalTitle>
              </ModalHeader>
              <ModalContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Your message..."
                      rows={8}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailModal(false)
                        setEmailSubject('')
                        setEmailMessage('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                  </div>
                </div>
              </ModalContent>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

