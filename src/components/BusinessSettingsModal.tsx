import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Lock, Sliders, Check, AlertCircle } from 'lucide-react';
import { BusinessConfig } from '../types';
import { api } from '../api';

interface BusinessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BusinessConfig;
  token: string;
  onConfigUpdated: (newConfig: BusinessConfig) => void;
}

export const BusinessSettingsModal: React.FC<BusinessSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  token,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'business' | 'security'>('business');
  const [name, setName] = useState(config.name);
  const [category, setCategory] = useState(config.category);
  const [welcomeMessage, setWelcomeMessage] = useState(config.welcomeMessage);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(config.googleReviewUrl);
  const [positiveThreshold, setPositiveThreshold] = useState(config.positiveThreshold || 8);
  const [neutralThreshold, setNeutralThreshold] = useState(config.neutralThreshold || 5);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updated = await api.updateBusinessConfig(token, {
        name: name.trim(),
        category: category.trim(),
        welcomeMessage: welcomeMessage.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        positiveThreshold: Number(positiveThreshold),
        neutralThreshold: Number(neutralThreshold),
      });
      onConfigUpdated(updated);
      setStatusMessage({ type: 'success', text: 'Business settings updated successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsSaving(true);

    try {
      await api.changeAdminPassword(token, currentPassword, newPassword);
      setStatusMessage({ type: 'success', text: 'Administrator password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Platform Settings</h3>
              <p className="text-xs text-neutral-500">Manage business details & access control</p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-100 px-6 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('business');
                setStatusMessage(null);
              }}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'business'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Business Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setStatusMessage(null);
              }}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Security</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {activeTab === 'business' ? (
              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Business Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Business Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="Assignment Ordering Platform">Assignment Ordering Platform</option>
                      <option value="Academic Writing & Coursework">Academic Writing & Coursework</option>
                      <option value="Online Tutoring & Learning">Online Tutoring & Learning</option>
                      <option value="EdTech & Homework Help">EdTech & Homework Help</option>
                      <option value="Education & Professional Services">Education & Professional Services</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700">
                      Official Google Review URL
                    </label>
                    {googleReviewUrl && (
                      <a
                        href={googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-600 hover:text-amber-800 font-medium"
                      >
                        Test Link ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={e => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review or https://www.google.com/search?q=..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Paste your official Google Business Profile review link. If left blank or default, it automatically directs students to Google search for your brand.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Customer Welcome Message
                  </label>
                  <textarea
                    rows={2}
                    value={welcomeMessage}
                    onChange={e => setWelcomeMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <h4 className="text-xs font-bold text-neutral-800 mb-2">Sentiment Thresholds (1-10 Scale)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-600">Positive Score (starts at)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={6}
                          max={10}
                          value={positiveThreshold}
                          onChange={e => setPositiveThreshold(Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200"
                        />
                        <span className="text-xs text-neutral-500">{positiveThreshold}-10 Stars</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-600">Neutral Score (starts at)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={2}
                          max={8}
                          value={neutralThreshold}
                          onChange={e => setNeutralThreshold(Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200"
                        />
                        <span className="text-xs text-neutral-500">{neutralThreshold}-{positiveThreshold - 1} Stars</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current administrator password"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
