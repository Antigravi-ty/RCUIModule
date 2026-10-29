import React, { useEffect, useRef } from 'react';
import type { ActionBinding, ListeningTarget } from './KeybindingSlots';

export const GAMEPAD_BUTTON_INDEX_MAP: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'BACK',
  9: 'START',
  10: 'LS',
  11: 'RS',
  12: 'D-UP',
  13: 'D-DOWN',
  14: 'D-LEFT',
  15: 'D-RIGHT',
  16: 'HOME',
};

/**
 * Format raw keyboard event key into standard human-readable keycap shortcut
 */
export function normalizeKeyboardKey(e: KeyboardEvent): string {
  if (e.code === 'Space' || e.key === ' ') return 'SPACE';
  if (e.code === 'ArrowUp') return 'UP';
  if (e.code === 'ArrowDown') return 'DOWN';
  if (e.code === 'ArrowLeft') return 'LEFT';
  if (e.code === 'ArrowRight') return 'RIGHT';
  if (e.code === 'Enter') return 'ENTER';
  if (e.code === 'Backspace') return 'BKSP';
  if (e.code === 'Tab') return 'TAB';
  if (e.code.startsWith('Key')) return e.code.replace('Key', '').toUpperCase();
  if (e.code.startsWith('Digit')) return e.code.replace('Digit', '');
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'SHIFT';
  if (e.code === 'ControlLeft' || e.code === 'ControlRight') return 'CTRL';
  if (e.code === 'AltLeft' || e.code === 'AltRight') return 'ALT';
  if (e.code === 'CapsLock') return 'CAPS';

  if (e.key.length === 1) return e.key.toUpperCase();
  return e.key.toUpperCase();
}

export function useKeybindingCapture(
  listeningTarget: ListeningTarget | null,
  setBindings: React.Dispatch<React.SetStateAction<ActionBinding[]>>,
  setListeningTarget: React.Dispatch<React.SetStateAction<ListeningTarget | null>>,
  showFeedback: (msg: string) => void
) {
  const animFrameRef = useRef<number | null>(null);

  // 1. Keyboard event listener for binding capture
  useEffect(() => {
    if (!listeningTarget || listeningTarget.kind !== 'keyboard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setListeningTarget(null);
        showFeedback('Cancelled binding capture.');
        return;
      }

      const shortcut = normalizeKeyboardKey(e);

      setBindings((prev) =>
        prev.map((item) => {
          if (item.id === listeningTarget.actionId) {
            if (item.keyboard.includes(shortcut)) {
              return item;
            }
            return {
              ...item,
              keyboard: [...item.keyboard, shortcut],
            };
          }
          return item;
        })
      );

      showFeedback(`Bound keyboard key [${shortcut}].`);
      setListeningTarget(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [listeningTarget, setBindings, setListeningTarget, showFeedback]);

  // 2. Gamepad API polling listener for physical gamepad button presses
  useEffect(() => {
    if (!listeningTarget || listeningTarget.kind !== 'gamepad') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const pollGamepads = () => {
      const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          if (btn && (btn.pressed || btn.value > 0.5)) {
            const mappedName = GAMEPAD_BUTTON_INDEX_MAP[i] || `BTN ${i}`;

            setBindings((prev) =>
              prev.map((item) => {
                if (item.id === listeningTarget.actionId) {
                  if (item.gamepad.includes(mappedName)) return item;
                  return {
                    ...item,
                    gamepad: [...item.gamepad, mappedName],
                  };
                }
                return item;
              })
            );

            showFeedback(`Bound controller button [${mappedName}].`);
            setListeningTarget(null);
            return;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(pollGamepads);
    };

    animFrameRef.current = requestAnimationFrame(pollGamepads);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [listeningTarget, setBindings, setListeningTarget, showFeedback]);
}

/**
 * Export mathematical layout telemetry of the first row (Throttle / Accelerate)
 */
export async function exportFirstRowLayoutTelemetry(
  tableEl: HTMLElement | null,
  showFeedback: (msg: string) => void
) {
  if (!tableEl) return;

  const firstRowEl = tableEl.querySelector<HTMLElement>('[data-row-id="throttle"], [data-row="binding-row"]');
  if (!firstRowEl) {
    showFeedback('First row element not found');
    return;
  }

  const rowRect = firstRowEl.getBoundingClientRect();
  const actionEl = firstRowEl.querySelector<HTMLElement>('[data-col="action"]');
  const kbdWrapper = firstRowEl.querySelector<HTMLElement>('[data-element="keycap-wrapper"]');
  const firstKbd = firstRowEl.querySelector<HTMLElement>('[data-component="keycap-badge"]');
  const labelSpan = firstKbd?.querySelector<HTMLElement>('[data-element="keycap-label"]');
  const unbindSpan = firstKbd?.querySelector<HTMLElement>('[data-element="unbind-container"]');
  const unbindBtn = firstKbd?.querySelector<HTMLElement>('[data-element="unbind-button"]');

  const getRectStr = (r?: DOMRect | null) =>
    r
      ? `${Math.round(r.width * 10) / 10}px × ${Math.round(r.height * 10) / 10}px (left: ${Math.round(r.left * 10) / 10}, top: ${Math.round(r.top * 10) / 10})`
      : 'N/A';

  const lines: string[] = [];
  lines.push('========================================================================');
  lines.push(' [CONTROLS FIRST ROW LAYOUT INSPECTOR] ACTION: THROTTLE / ACCELERATE');
  lines.push('========================================================================');
  lines.push(`• Row Bounding Box: ${getRectStr(rowRect)}`);

  if (actionEl) {
    lines.push(
      `• Action Cell:      ${getRectStr(actionEl.getBoundingClientRect())} | Text: "${actionEl.textContent?.trim()}"`
    );
  }

  const capturePhase = (phaseTitle: string) => {
    lines.push('\n------------------------------------------------------------------------');
    lines.push(` ${phaseTitle}`);
    lines.push('------------------------------------------------------------------------');

    if (!firstKbd) return;
    const kRect = firstKbd.getBoundingClientRect();
    const kStyle = window.getComputedStyle(firstKbd);
    lines.push('[1. KEYCAP BADGE CONTAINER]');
    lines.push(`  • Size & Pos:     ${getRectStr(kRect)}`);
    lines.push(
      `  • Padding:        top=${kStyle.paddingTop}, right=${kStyle.paddingRight}, bottom=${kStyle.paddingBottom}, left=${kStyle.paddingLeft}`
    );
    lines.push(
      `  • Border:         top=${kStyle.borderTopWidth}, right=${kStyle.borderRightWidth}, bottom=${kStyle.borderBottomWidth}, left=${kStyle.borderLeftWidth}`
    );

    if (labelSpan) {
      const lRect = labelSpan.getBoundingClientRect();
      const lStyle = window.getComputedStyle(labelSpan);
      const topGap = lRect.top - kRect.top;
      const bottomGap = kRect.bottom - lRect.bottom;
      lines.push('\n[2. KEY LABEL (LETTER W)]');
      lines.push(`  • Size & Pos:     ${getRectStr(lRect)} | Char: "${labelSpan.textContent?.trim()}"`);
      lines.push(`  • Padding:        left=${lStyle.paddingLeft}, right=${lStyle.paddingRight}`);
      lines.push(
        `  • Vertical Gap:   TopGap = ${Math.round(topGap * 10) / 10}px | BottomGap = ${Math.round(bottomGap * 10) / 10}px | Delta = ${Math.round((topGap - bottomGap) * 10) / 10}px`
      );
    }

    if (unbindSpan) {
      const uRect = unbindSpan.getBoundingClientRect();
      const uStyle = window.getComputedStyle(unbindSpan);
      lines.push('\n[3. UNBIND CONTAINER (EXPANDING SPAN)]');
      lines.push(`  • Size & Pos:     ${getRectStr(uRect)}`);
      lines.push(`  • Overflow:       ${uStyle.overflow}`);

      if (unbindBtn) {
        const bRect = unbindBtn.getBoundingClientRect();
        const leftGap = bRect.left - uRect.left;
        const rightGap = uRect.right - bRect.right;
        const isClippedLeft = bRect.left < uRect.left;
        const isClippedRight = bRect.right > uRect.right;
        lines.push('\n[4. UNBIND BUTTON (RED CROSS CIRCLE)]');
        lines.push(`  • Size & Pos:     ${getRectStr(bRect)}`);
        lines.push(
          `  • Inner Gaps:     LeftGap = ${Math.round(leftGap * 10) / 10}px | RightGap = ${Math.round(rightGap * 10) / 10}px`
        );
        lines.push(`  • Clipping Test:  ClippedLeft = ${isClippedLeft} | ClippedRight = ${isClippedRight}`);
      }
    }
  };

  capturePhase('[PHASE 1: RESTING STATE (Collapsed / Zero Footprint)]');

  if (kbdWrapper) {
    const allEls = [kbdWrapper, ...kbdWrapper.querySelectorAll<HTMLElement>('*')];
    allEls.forEach((el) => el.style.setProperty('transition', 'none', 'important'));
    kbdWrapper.classList.add('is-expanded');
    void kbdWrapper.offsetWidth;

    capturePhase('[PHASE 2: EXPANDED / HOVER STATE (Expanded Clear Button)]');

    kbdWrapper.classList.remove('is-expanded');
    allEls.forEach((el) => el.style.removeProperty('transition'));
  }

  lines.push('\n========================================================================\n');
  const report = lines.join('\n');
  console.log(report);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(report);
      showFeedback('First-row layout metrics logged to console and copied to clipboard');
    } catch (_) {
      showFeedback('First-row layout metrics logged to console');
    }
  } else {
    showFeedback('First-row layout metrics logged to console');
  }
}
