import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Check, X, AlertCircle } from 'lucide-react';
import { AppleSpinner } from './AppleSpinner';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType?: string;
  description?: string;
  cascadeOption?: boolean;
  cascadeLabel?: string;
  isDeleting: boolean;
  onConfirm: (cascade: boolean) => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  description,
  cascadeOption = false,
  cascadeLabel = 'Also delete dependent resources (e.g. hosted web apps) before deleting this resource',
  isDeleting,
  onConfirm,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [cascade, setCascade] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setCopied(false);
      setCascade(true);
    }
  }, [isOpen, itemName]);

  if (!isOpen) return null;

  const isMatch = inputValue.trim() === itemName.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(itemName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePasteIntoInput = async () => {
    try {
      await navigator.clipboard.writeText(itemName);
      setInputValue(itemName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setInputValue(itemName);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        style={{
          background: '#121215',
          border: '1px solid #27272a',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trash2 size={18} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fafafa' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Description / Warning */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            {description || (
              <>
                This action cannot be undone. This will permanently destroy the resource from your Azure subscription.
              </>
            )}
          </div>
        </div>

        {/* Copyable Target Name Box */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
            Resource to delete {itemType ? `(${itemType})` : ''}:
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fafafa',
                userSelect: 'all',
                wordBreak: 'break-all',
              }}
            >
              {itemName}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy name to clipboard"
                style={{
                  background: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#fafafa',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handlePasteIntoInput}
                title="Fill into confirmation input"
                style={{
                  background: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#fafafa',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Auto-fill
              </button>
            </div>
          </div>
        </div>

        {/* Cascade delete option */}
        {cascadeOption && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '12px',
                color: '#d4d4d8',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={cascade}
                onChange={(e) => setCascade(e.target.checked)}
                style={{ marginTop: '2px', cursor: 'pointer' }}
              />
              <span>{cascadeLabel}</span>
            </label>
          </div>
        )}

        {/* Type name input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
            Type <strong style={{ color: '#fafafa' }}>{itemName}</strong> to confirm:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={itemName}
            disabled={isDeleting}
            autoFocus
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#18181b',
              border: isMatch ? '1px solid #3f3f46' : '1px solid #27272a',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fafafa',
              fontSize: '13px',
              fontFamily: 'var(--font-mono, monospace)',
              outline: 'none',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!isMatch || isDeleting}
            onClick={() => onConfirm(cascade)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isMatch && !isDeleting ? 1 : 0.5,
              cursor: isMatch && !isDeleting ? 'pointer' : 'not-allowed',
            }}
          >
            {isDeleting ? <AppleSpinner size={14} /> : <Trash2 size={14} />}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
