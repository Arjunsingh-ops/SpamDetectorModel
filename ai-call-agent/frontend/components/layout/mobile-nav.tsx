'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { X } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative z-10 w-72 max-w-[85vw] bg-zinc-950 flex flex-col h-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white z-50"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar collapsed={false} onCloseMobile={onClose} />
      </div>
    </div>
  );
}
