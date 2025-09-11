'use client';

import { Button } from '@/components/ui/button';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  url?: string;
  title?: string;
  className?: string;
}

export function SocialShare({ 
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Check out this Pokemon!',
  className 
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  // Progressive enhancement: Use native Web Share API if available
  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch {
        // User cancelled or error occurred, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Could not copy link:', err);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNativeShare}
      className={cn("gap-2", className)}
      aria-label={copied ? "Link copied!" : "Share this Pokemon"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : typeof navigator !== 'undefined' && 'share' in navigator ? (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </>
      )}
    </Button>
  );
}

export default SocialShare;