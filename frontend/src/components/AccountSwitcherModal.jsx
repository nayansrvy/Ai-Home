import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, ChevronUp, ChevronDown, UserPlus, LogOut } from 'lucide-react';

const AccountSwitcherModal = ({
  isOpen,
  onClose,
  positionClass = "fixed bottom-14 left-4 z-[9999]",
  currentUser = {
    name: 'Sarvaiya Nayan',
    email: 'sarvaiyanayan0@gmail.com',
    avatar: '/avatar_placeholder.png'
  },
  secondaryAccounts = [
    {
      id: 'acc-2',
      name: 'nd sarvaiya',
      email: 'ndsarvaiyaa@gmail.com',
      avatar: '',
      badgeText: 'nd',
      badgeBg: 'bg-orange-600'
    }
  ],
  onSwitchAccount,
  onManageAccount,
  onAddAccount,
  onSignOut
}) => {
  const modalRef = useRef(null);
  const [showSecondaryAccounts, setShowSecondaryAccounts] = useState(true);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';

  const modalJSX = (
    <div className={`${positionClass} pointer-events-auto animate-in fade-in zoom-in-95 duration-200`}>
      <div 
        ref={modalRef} 
        className="w-[330px] max-w-[90vw] bg-[#1e1f20] border border-[#333537] rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-[#e3e3e3] select-none flex flex-col gap-4 z-[9999]"
        style={{ backgroundColor: '#1e1f20' }}
      >
        {/* Header bar: Active Email + Close X */}
        <div className="flex items-center justify-between text-xs text-gray-300 px-1">
          <span className="truncate font-medium text-gray-200">{currentUser.email}</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Account Display */}
        <div className="flex flex-col items-center text-center mt-1">
          {/* Avatar with Camera Badge */}
          <div className="relative group cursor-pointer mb-3">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-[#333537] shadow-inner"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.svgrepo.com/show/335455/profile-default.svg';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-2xl font-bold text-white border-2 border-[#333537]">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-[#2d2e2f] border border-[#444746] p-1.5 rounded-full text-gray-200 shadow hover:bg-[#3d3e3f] transition-colors">
              <Camera size={14} />
            </div>
          </div>

          <h3 className="text-xl font-medium text-white mb-3">
            Hi, {firstName}!
          </h3>

          <button 
            onClick={onManageAccount}
            className="px-5 py-2 text-xs font-semibold rounded-full border border-[#444746] text-[#c4c7c5] hover:bg-white/5 hover:border-gray-400 hover:text-white transition-all duration-200 mb-1"
          >
            Manage your Account
          </button>
        </div>

        {/* Account Switcher Section */}
        <div className="border-t border-[#333537] pt-3 flex flex-col gap-2">
          {/* Collapsible toggle */}
          <button 
            onClick={() => setShowSecondaryAccounts(v => !v)}
            className="flex items-center justify-between w-full text-xs text-gray-400 font-medium px-2 py-1 hover:text-gray-200 transition-colors"
          >
            <span>{showSecondaryAccounts ? 'Hide more accounts' : 'Show more accounts'}</span>
            {showSecondaryAccounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* List of secondary accounts */}
          {showSecondaryAccounts && (
            <div className="flex flex-col gap-1 my-1">
              {secondaryAccounts.map((account) => (
                <div 
                  key={account.id}
                  onClick={() => onSwitchAccount && onSwitchAccount(account)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#131314]/60 hover:bg-[#2d2e2f] cursor-pointer transition-colors border border-transparent hover:border-[#333537]"
                >
                  {account.avatar ? (
                    <img src={account.avatar} alt={account.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full ${account.badgeBg || 'bg-orange-600'} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                      {account.badgeText || (account.name ? account.name.substring(0, 2) : 'A2')}
                    </div>
                  )}
                  <div className="flex flex-col text-left truncate">
                    <span className="text-xs font-medium text-white truncate">{account.name}</span>
                    <span className="text-[11px] text-gray-400 truncate">{account.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Another Account Action */}
          <button 
            onClick={onAddAccount}
            className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/5 text-xs text-gray-300 hover:text-white transition-colors text-left font-medium"
          >
            <UserPlus size={18} className="text-gray-400" />
            <span>Add another account</span>
          </button>

          {/* Sign Out Action */}
          <button 
            onClick={onSignOut}
            className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/5 text-xs text-gray-300 hover:text-white transition-colors text-left font-medium"
          >
            <LogOut size={18} className="text-gray-400" />
            <span>Sign out of all accounts</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="border-t border-[#333537] pt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <a href="/privacy" className="hover:underline hover:text-gray-200">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:underline hover:text-gray-200">Terms of Service</a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default AccountSwitcherModal;
