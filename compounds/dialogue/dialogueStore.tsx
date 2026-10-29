import React, { useState, useEffect } from 'react';
import { Dialogue } from './DialogueView';
import { DialogueStackItem, StackedDialogueOptions } from './dialogueTypes';

export type { DialogueStackItem, StackedDialogueOptions };

type StackListener = (items: DialogueStackItem[]) => void;
let stackListeners: StackListener[] = [];
let activeDialogueStack: DialogueStackItem[] = [];
let stackCounter = 1;

export const dialogue = {
  /**
   * Spawn a new dialogue on top of the stack.
   * Generates at the top layer with an incremented z-index and no background darkening.
   */
  show: (options: StackedDialogueOptions): string => {
    const id = options.id || `dialogue-${Date.now()}-${stackCounter++}`;
    const baseZIndex = 800 + activeDialogueStack.length * 10;
    const newItem: DialogueStackItem = {
      ...options,
      id,
      zIndex: baseZIndex,
    };
    activeDialogueStack = [...activeDialogueStack, newItem];
    stackListeners.forEach((fn) => fn(activeDialogueStack));
    return id;
  },

  /** Dismiss a specific dialogue by ID */
  dismiss: (id: string) => {
    activeDialogueStack = activeDialogueStack.filter((item) => item.id !== id);
    stackListeners.forEach((fn) => fn(activeDialogueStack));
  },

  /** Clear all stacked dialogues */
  clear: () => {
    activeDialogueStack = [];
    stackListeners.forEach((fn) => fn(activeDialogueStack));
  },

  /** Get current stack count */
  getCount: () => activeDialogueStack.length,
};

/**
 * Hook to subscribe to dialogue stack updates
 */
export const useDialogueStack = () => {
  const [stack, setStack] = useState<DialogueStackItem[]>(activeDialogueStack);

  useEffect(() => {
    const listener: StackListener = (newStack) => setStack(newStack);
    stackListeners.push(listener);
    return () => {
      stackListeners = stackListeners.filter((fn) => fn !== listener);
    };
  }, []);

  return {
    stack,
    show: dialogue.show,
    dismiss: dialogue.dismiss,
    clear: dialogue.clear,
  };
};

/**
 * Global or page container that renders stacked dialogues.
 * No background mask darkening is applied, rendering layered dialogues cleanly.
 */
export const DialogueStackContainer: React.FC<{ isLight?: boolean }> = ({ isLight }) => {
  const { stack, dismiss } = useDialogueStack();

  useEffect(() => {
    const handleSchemaError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message || 'Unknown schema violation';
      dialogue.show({
        title: 'FATAL ERROR',
        tone: 'error',
        icon: 'ghost',
        content: (
          <div className="flex flex-col gap-2 font-mono text-xs w-full text-left">
            <p className="font-bold text-red-600 dark:text-red-400">
              Fatal parameter schema violation occurred in the Notification System:
            </p>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:border-red-800/80 dark:text-red-200 whitespace-pre-wrap select-all leading-relaxed">
              {message}
            </div>
            <p className="opacity-80 text-[11px] mt-1 text-neutral-500 dark:text-neutral-400">
              Silent fallbacks are strictly prohibited. Fix the parameter keys or provide required values in source code.
            </p>
          </div>
        ),
        buttons: [
          {
            label: 'Acknowledge',
            variant: 'danger',
          },
        ],
      });
    };

    window.addEventListener('uistorybook:fatal-schema-error', handleSchemaError);
    return () => window.removeEventListener('uistorybook:fatal-schema-error', handleSchemaError);
  }, []);

  useEffect(() => {
    if (stack.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const topItem = stack[stack.length - 1];
        if (topItem) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const cancelBtn = topItem.buttons?.find(
            (b) => /cancel|close|no|dismiss/i.test(b.label)
          );
          if (cancelBtn?.onClick && !cancelBtn.disabled) {
            cancelBtn.onClick();
          }
          dismiss(topItem.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [stack, dismiss]);

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item, index) => {
        // Subtle vertical lift per layer underneath so user can appreciate the stack
        const layerDepth = stack.length - 1 - index;
        const translateY = -layerDepth * 10;
        const scale = 1 - layerDepth * 0.02;

        const docIsLight =
          typeof document !== 'undefined'
            ? document.documentElement.classList.contains('light') ||
              document.documentElement.dataset.theme === 'light' ||
              document.body.classList.contains('light')
            : false;
        const effectiveIsLight = item.isLight ?? isLight ?? docIsLight;

        return (
          <div
            key={item.id}
            role="dialog"
            aria-modal="true"
            style={{ zIndex: item.zIndex }}
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 select-none bg-transparent pointer-events-none transition-all duration-200"
          >
            <div
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
              }}
              className="w-full flex items-center justify-center pointer-events-auto cursor-default animate-in fade-in zoom-in-95 duration-150 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                {...item}
                isLight={effectiveIsLight}
                buttons={item.buttons?.map((b) => ({
                  ...b,
                  onClick: () => {
                    if (b.disabled) return;
                    if (b.onClick) b.onClick();
                    dismiss(item.id);
                  },
                }))}
              />
            </div>
          </div>
        );
      })}
    </>
  );
};
