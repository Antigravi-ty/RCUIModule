import React from 'react';
import {
  pushQuickNotification,
  useQuickNotificationStore,
} from '../../stores/quickNotificationStore';
import { dialogue } from '../../compounds/dialogue/dialogueStore';

export function dispatchOnlineRoomErrorNotification(
  summary = 'Could not bind or connect to signaling room within 10s.',
  details = 'WebSocket Signaling Handshake Failed (ERR_CONNECTION_TIMED_OUT).\nEndpoint: wss://relay.carsoccer.dev/signaling\nAttempted Room: #4829 (120Hz Sub-Tick WebRTC)'
) {
  const store = useQuickNotificationStore.getState();
  const existing =
    store.activeNotification?.id === 'online-room-error' ||
    store.unreadStack.some((item) => item.id === 'online-room-error') ||
    store.preemptedPersistentStack.some((item) => item.id === 'online-room-error');

  if (!existing) {
    pushQuickNotification({
      id: 'online-room-error',
      type: 'persistent',
      tone: 'error',
      icon: 'octagon-alert',
      duration: 0,
      content: summary,
      buttons: [
        {
          label: 'Details',
          color: 'amber',
          onClick: () => {
            dialogue.show({
              title: 'CONNECTION DIAGNOSTIC LOG',
              tone: 'error',
              icon: 'octagon-alert',
              content: (
                <div className="flex flex-col gap-2 font-mono text-xs w-full text-left">
                  <p className="font-bold text-rose-600 dark:text-rose-400">{summary}</p>
                  <div className="p-3 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-950/70 dark:border-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                    {details}
                  </div>
                </div>
              ),
              buttons: [{ label: 'Close', variant: 'primary' }],
            });
          },
        },
      ],
    });
  }
}
