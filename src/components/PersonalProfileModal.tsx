import React, { useState } from 'react';
import {
  User as UserIcon,
  X,
  Save,
  Phone,
  Mail,
  KeyRound,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types';
import { db } from '../services/db';

interface PersonalProfileModalProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export const PersonalProfileModal: React.FC<PersonalProfileModalProps> = ({
  user,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [pin, setPin] = useState(user.pin);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Izina riragenzwa (Name is required).');
      return;
    }
    if (!phone.trim()) {
      alert('Telefone iragenzwa (Phone is required).');
      return;
    }
    if (pin.length < 4 || pin.length > 8) {
      alert('PIN igomba kuba nibura nibura imibare 4 (PIN must be at least 4 digits).');
      return;
    }

    const updated: User = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      pin
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Amagambo ya password ntabwo ahura (Passwords do not match).');
        return;
      }
      updated.systemPassword = newPassword;
    }

    db.saveUser(updated);
    onSave(updated);
    setSuccess('Profilo yawe yahinduwe neza! (Profile updated successfully!)');
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 1500);
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner / Nyene Iduka',
    employee: 'Cashier / Umukozi',
    superadmin: 'Super Admin',
    auditor: 'Auditor / Isuzuma'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profilo Yanjye (My Profile)</h3>
              <p className="text-[11px] text-slate-400">Hindura amakuru yawe</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Avatar + Role Badge */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] text-slate-400 font-semibold">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              {user.shopName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] text-slate-500">{user.shopName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Izina (Name) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-500" />
              Telefoni (Phone) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-slate-500" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3 h-3 text-slate-500" />
              PIN (4-Digit Login) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white font-mono outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 pt-4">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3">
              Gushyiraho Password Nshya (Optional New Password)
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password Nshya</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {newPassword && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Emeza Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
              />
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Reka (Cancel)
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Bika (Save)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
