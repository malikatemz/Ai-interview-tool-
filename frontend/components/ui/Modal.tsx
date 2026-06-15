'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
            'rounded-lg border bg-[var(--surface)] p-6 shadow-lg',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            className
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            {title && (
              <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="text-sm text-[var(--text-secondary)]">
                {description}
              </Dialog.Description>
            )}
          </div>
          
          <div className="mt-4">{children}</div>
          
          <Dialog.Close
            className={cn(
              'absolute right-4 top-4 rounded-sm opacity-70',
              'transition-opacity hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]',
              'disabled:pointer-events-none'
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={() => onOpenChange(false)}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'bg-[var(--surface-elevated)] text-[var(--text-primary)]',
            'hover:bg-[var(--border)]'
          )}
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            variant === 'danger'
              ? 'bg-[var(--accent-danger)] text-white hover:opacity-90'
              : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
