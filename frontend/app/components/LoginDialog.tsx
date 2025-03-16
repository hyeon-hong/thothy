"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    await signIn();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            Please sign in to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <img src="/google.svg" alt="Google" className="w-6 h-6" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 