'use client';

import { useState } from 'react';
import { copyToClipboard, showCopyToast } from '@/lib/utils/clipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CopyButton({ text, label = '复制', className = '', size = 'sm' }: CopyButtonProps) {
  const [copying, setCopying] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopying(true);
    const success = await copyToClipboard(text);
    showCopyToast(success);
    
    setTimeout(() => setCopying(false), 1000);
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <button
      onClick={handleCopy}
      disabled={copying}
      className={`${sizeClasses[size]} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-medium disabled:opacity-50 ${className}`}
      title="复制到剪贴板"
    >
      {copying ? '✓ 已复制' : `📋 ${label}`}
    </button>
  );
}
