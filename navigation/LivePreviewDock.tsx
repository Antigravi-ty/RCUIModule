import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { KeycapBadge } from '../primitives/KeycapBadge';

export interface LivePreviewDockProps {
  isLight?: boolean;
  isHovered?: boolean;
  isVisible?: boolean;
  shortcut?: string;
  className?: string;
}

/**
 * [L4 Navigation] LivePreviewDock
 * Right-middle docked pill content ('<' | TAB) rendered inside a morphing stage shell
 * when a Live Preview session collapses to the viewport right edge.
 */
export const LivePreviewDock: React.FC<LivePreviewDockProps> = React.memo(({
  isLight = false,
  isHovered = false,
  isVisible = true,
  shortcut = 'TAB',
  className = '',
}) => {
  return (
    <div
      data-ui-element="live-preview-dock"
      className={`w-full h-full flex items-center justify-between px-3 cursor-pointer select-none transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <motion.div
        animate={{ x: isHovered ? -2.5 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`flex items-center justify-center shrink-0 ${
          isLight ? 'text-neutral-900' : 'text-neutral-100'
        }`}
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
      </motion.div>
      <div
        className={`h-3.5 w-px ${
          isLight ? 'bg-neutral-200' : 'bg-neutral-700'
        }`}
      />
      <KeycapBadge shortcut={shortcut} size="sm" isLight={isLight} />
    </div>
  );
});
