import { useState, useEffect } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  Edit3,
  Save,
  RefreshCw,
  LogOut,
  Smartphone,
  Mail,
  Calendar,
  MapPin,
  Camera,
  Settings as SettingsIcon,
  Database,
  Clock
} from 'lucide-react'
import { useUserProfile } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import ProfileForm from '../components/ProfileForm'
import { AppErrorHandler } from '../utils/errorHandling'
import LoadingState from '../components/LoadingState'

interface SettingsSectionProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  children: React.ReactNode
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="glass-morphism p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

function Toggle({ enabled, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
    }`}>
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        {description && (
          <div className="text-sm text-gray-600">{description}</div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-500' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

interface UserSettings {
  notifications: {
    mealReminders: boolean
    workoutReminders: boolean
    progressUpdates: boolean
    achievements: boolean
    weeklyReports: boolean
    emailNotifications: boolean
    pushNotifications: boolean
  }
  preferences: {
    units: 'metric' | 'imperial'
    theme: 'light' | 'dark' | 'auto'
    language: string
    startOfWeek: 'sunday' | 'monday'
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    timeFormat: '12h' | '24h'
  }
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
    dataAnalytics: boolean
    marketing: boolean
    searchable: boolean
    showEmail: boolean
  }
  account: {
    twoFactorAuth: boolean
    loginAlerts: boolean
    sessionTimeout: number
    autoLogout: boolean
  }
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { profile, loading, updateProfile } = useUserProfile()
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'preferences' | 'privacy' | 'account' | 'data'>('profile')
  const errorHandler = AppErrorHandler.getInstance()

  // Settings state with default values
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      mealReminders: true,
      workoutReminders: true,
      progressUpdates: true,
      achievements: true,
      weeklyReports: false,
      emailNotifications: true,
      pushNotifications: true
    },
    preferences: {
      units: 'metric',
      theme: 'light',
      language: 'en',
      startOfWeek: 'monday',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    privacy: {
      shareProgress: false,
      publicProfile: false,
      dataAnalytics: true,
      marketing: false,
      searchable: false,
      showEmail: false
    },
    account: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      autoLogout: true
    }
  })

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings()
  }, [user])

  const loadUserSettings = async () => {
    if (!user) return

    try {
      // In a real app, this would load from Firestore
      // For now, we'll use localStorage as a fallback
      const savedSettings = localStorage.getItem(`settings_${user.uid}`)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      errorHandler.handleError(error, 'Loading user settings')
    }
  }

  const saveUserSettings = async () => {
    if (!user) return

    try {
      setSaveStatus('saving')
      setHasUnsavedChanges(false)

      // In a real app, this would save to Firestore
      // For now, we'll use localStorage as a fallback
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings))

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      errorHandler.handleError(error, 'Saving user settings')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleProfileUpdate = async (updates: any) => {
    try {
      setSaveStatus('saving')
      await updateProfile(updates)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      errorHandler.handleError(error, 'Updating profile')
      setTimeout(() => setSaveStatus('idle'), 3000)
      throw error
    }
  }

  const handleExportData = async () => {
    try {
      const userData = {
        profile,
        settings,
        exportDate: new Date().toISOString()
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `reddyfit-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      errorHandler.handleError(error, 'Exporting data')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      errorHandler.handleError(error, 'Signing out')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState.Card />
        <LoadingState.List rows={3} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    )
  }

  const sections = [
    { id: 'profile', label: 'Profile & Goals', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'account', label: 'Account Security', icon: SettingsIcon },
    { id: 'data', label: 'Data Management', icon: Database }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black gradient-text mb-2">Settings</h1>
        <p className="text-xl text-gray-700">Manage your account and preferences</p>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          saveStatus === 'saved' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent" />}
          {saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4" />}
          {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {saveStatus === 'saving' && 'Saving changes...'}
            {saveStatus === 'saved' && 'Changes saved successfully!'}
            {saveStatus === 'error' && 'Error saving changes. Please try again.'}
          </span>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">You have unsaved changes</span>
          </div>
          <button
            onClick={saveUserSettings}
            className="btn-primary text-sm"
            disabled={saveStatus === 'saving'}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeSection === id
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      {activeSection === 'profile' && (
        <SettingsSection
          title="Profile & Goals"
          description="Manage your personal information and fitness goals"
          icon={User}
        >
          <div className="space-y-4">
            {profile && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Current Profile</h3>
                  <button
                    onClick={() => setShowProfileForm(true)}
                    className="btn-secondary text-sm flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Name</div>
                    <div className="font-medium text-gray-800">{profile.displayName}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Email</div>
                    <div className="font-medium text-gray-800">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Current Weight</div>
                    <div className="font-medium text-gray-800">{profile.currentWeight}kg</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Goal Weight</div>
                    <div className="font-medium text-gray-800">{profile.goalWeight}kg</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Height</div>
                    <div className="font-medium text-gray-800">{profile.height}cm</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Age</div>
                    <div className="font-medium text-gray-800">{profile.age} years</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Activity Level</div>
                    <div className="font-medium text-gray-800 capitalize">{profile.activityLevel?.replace('-', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Daily Calories</div>
                    <div className="font-medium text-gray-800">{profile.dailyCalories}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 p-4 rounded-xl text-center border border-primary-200">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                <div className="text-lg font-bold text-primary-600">
                  {Math.floor((new Date().getTime() - new Date(profile?.startDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-primary-700">Days Active</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">
                  {((profile?.startWeight || 0) - (profile?.currentWeight || 0)).toFixed(1)}kg
                </div>
                <div className="text-sm text-green-700">Weight Lost</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-200">
                <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">
                  {new Date(user.metadata.creationTime || '').toLocaleDateString()}
                </div>
                <div className="text-sm text-orange-700">Member Since</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-200">
                <Camera className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">
                  {new Date(user.metadata.lastSignInTime || '').toLocaleDateString()}
                </div>
                <div className="text-sm text-purple-700">Last Active</div>
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {activeSection === 'notifications' && (
        <SettingsSection
          title="Notifications"
          description="Configure when and how you want to be notified"
          icon={Bell}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">App Notifications</h4>
              <div className="space-y-2">
                <Toggle
                  enabled={settings.notifications.mealReminders}
                  onChange={(enabled) => updateSettings('notifications', 'mealReminders', enabled)}
                  label="Meal Reminders"
                  description="Get reminded to log your meals throughout the day"
                />
                <Toggle
                  enabled={settings.notifications.workoutReminders}
                  onChange={(enabled) => updateSettings('notifications', 'workoutReminders', enabled)}
                  label="Workout Reminders"
                  description="Daily reminders to complete your workout"
                />
                <Toggle
                  enabled={settings.notifications.progressUpdates}
                  onChange={(enabled) => updateSettings('notifications', 'progressUpdates', enabled)}
                  label="Progress Updates"
                  description="Weekly progress summaries and insights"
                />
                <Toggle
                  enabled={settings.notifications.achievements}
                  onChange={(enabled) => updateSettings('notifications', 'achievements', enabled)}
                  label="Achievements"
                  description="Celebrate your milestones and achievements"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Communication Preferences</h4>
              <div className="space-y-2">
                <Toggle
                  enabled={settings.notifications.emailNotifications}
                  onChange={(enabled) => updateSettings('notifications', 'emailNotifications', enabled)}
                  label="Email Notifications"
                  description="Receive important updates via email"
                />
                <Toggle
                  enabled={settings.notifications.pushNotifications}
                  onChange={(enabled) => updateSettings('notifications', 'pushNotifications', enabled)}
                  label="Push Notifications"
                  description="Get real-time notifications on your device"
                />
                <Toggle
                  enabled={settings.notifications.weeklyReports}
                  onChange={(enabled) => updateSettings('notifications', 'weeklyReports', enabled)}
                  label="Weekly Reports"
                  description="Detailed weekly progress reports via email"
                />
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {activeSection === 'preferences' && (
        <SettingsSection
          title="Preferences"
          description="Customize your app experience"
          icon={Palette}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                <select
                  value={settings.preferences.units}
                  onChange={(e) => updateSettings('preferences', 'units', e.target.value)}
                  className="input-field"
                >
                  <option value="metric">Metric (kg, cm, °C)</option>
                  <option value="imperial">Imperial (lbs, ft, °F)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => updateSettings('preferences', 'theme', e.target.value)}
                  className="input-field"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                  className="input-field"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start of Week</label>
                <select
                  value={settings.preferences.startOfWeek}
                  onChange={(e) => updateSettings('preferences', 'startOfWeek', e.target.value)}
                  className="input-field"
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => updateSettings('preferences', 'dateFormat', e.target.value)}
                  className="input-field"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                <select
                  value={settings.preferences.timeFormat}
                  onChange={(e) => updateSettings('preferences', 'timeFormat', e.target.value)}
                  className="input-field"
                >
                  <option value="12h">12 Hour (AM/PM)</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {activeSection === 'privacy' && (
        <SettingsSection
          title="Privacy & Data"
          description="Control how your data is used and shared"
          icon={Shield}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Profile Visibility</h4>
              <div className="space-y-2">
                <Toggle
                  enabled={settings.privacy.publicProfile}
                  onChange={(enabled) => updateSettings('privacy', 'publicProfile', enabled)}
                  label="Public Profile"
                  description="Make your profile discoverable by other users"
                />
                <Toggle
                  enabled={settings.privacy.shareProgress}
                  onChange={(enabled) => updateSettings('privacy', 'shareProgress', enabled)}
                  label="Share Progress"
                  description="Allow others to see your fitness progress"
                />
                <Toggle
                  enabled={settings.privacy.searchable}
                  onChange={(enabled) => updateSettings('privacy', 'searchable', enabled)}
                  label="Searchable Profile"
                  description="Allow others to find you by name or email"
                />
                <Toggle
                  enabled={settings.privacy.showEmail}
                  onChange={(enabled) => updateSettings('privacy', 'showEmail', enabled)}
                  label="Show Email Address"
                  description="Display your email on your public profile"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Data Usage</h4>
              <div className="space-y-2">
                <Toggle
                  enabled={settings.privacy.dataAnalytics}
                  onChange={(enabled) => updateSettings('privacy', 'dataAnalytics', enabled)}
                  label="Data Analytics"
                  description="Help improve the app by sharing anonymous usage data"
                />
                <Toggle
                  enabled={settings.privacy.marketing}
                  onChange={(enabled) => updateSettings('privacy', 'marketing', enabled)}
                  label="Marketing Communications"
                  description="Receive promotional emails and product updates"
                />
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {activeSection === 'account' && (
        <SettingsSection
          title="Account Security"
          description="Manage your account security and login preferences"
          icon={SettingsIcon}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Security Features</h4>
              <div className="space-y-2">
                <Toggle
                  enabled={settings.account.twoFactorAuth}
                  onChange={(enabled) => updateSettings('account', 'twoFactorAuth', enabled)}
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                  disabled={true}
                />
                <Toggle
                  enabled={settings.account.loginAlerts}
                  onChange={(enabled) => updateSettings('account', 'loginAlerts', enabled)}
                  label="Login Alerts"
                  description="Get notified when someone signs into your account"
                />
                <Toggle
                  enabled={settings.account.autoLogout}
                  onChange={(enabled) => updateSettings('account', 'autoLogout', enabled)}
                  label="Auto Logout"
                  description="Automatically log out after period of inactivity"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <select
                value={settings.account.sessionTimeout}
                onChange={(e) => updateSettings('account', 'sessionTimeout', parseInt(e.target.value))}
                className="input-field max-w-xs"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="btn-danger flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </SettingsSection>
      )}

      {activeSection === 'data' && (
        <SettingsSection
          title="Data Management"
          description="Import, export, or delete your data"
          icon={Database}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleExportData}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              <button
                className="btn-secondary flex items-center justify-center space-x-2"
                disabled
              >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </button>
              <button
                className="btn-danger flex items-center justify-center space-x-2"
                disabled
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800 mb-1">Data Privacy</div>
                  <div className="text-blue-700">
                    Your data is encrypted and stored securely. You have full control over your information
                    and can export or delete it at any time. We never sell your personal data to third parties.
                  </div>
                </div>
              </div>
            </div>

            {/* Data Usage Stats */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Data Usage</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Profile Data</div>
                  <div className="font-medium text-gray-800">~2 KB</div>
                </div>
                <div>
                  <div className="text-gray-600">Workout Data</div>
                  <div className="font-medium text-gray-800">~15 KB</div>
                </div>
                <div>
                  <div className="text-gray-600">Meal Data</div>
                  <div className="font-medium text-gray-800">~8 KB</div>
                </div>
                <div>
                  <div className="text-gray-600">Progress Data</div>
                  <div className="font-medium text-gray-800">~5 KB</div>
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {/* Profile Form Modal */}
      {showProfileForm && profile && (
        <ProfileForm
          profile={profile}
          onSubmit={handleProfileUpdate}
          onClose={() => setShowProfileForm(false)}
        />
      )}

      {/* Save Changes Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={saveUserSettings}
            disabled={saveStatus === 'saving'}
            className="btn-primary shadow-lg flex items-center space-x-2"
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  )
}