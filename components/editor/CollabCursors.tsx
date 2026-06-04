'use client';

import { memo } from 'react';
import type { CollabUser } from '@/hooks/use-collab';

interface Props {
  peers: CollabUser[];
  /** Canvas element's bounding rect (for offset calculations) */
  canvasRect: DOMRect | null;
  /** Canvas zoom + pan offset so cursor is correct */
  zoom: number;
  panX: number;
  panY: number;
}

/**
 * Renders other users' cursors as coloured SVG arrows with name labels.
 * Absolutely positioned over the canvas container.
 */
export const CollabCursors = memo(function CollabCursors({
  peers,
  canvasRect,
  zoom,
  panX,
  panY,
}: Props) {
  if (!peers.length || !canvasRect) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {peers.map((peer) => {
        if (!peer.cursor) return null;

        // Convert canvas-space → screen-space
        const screenX = peer.cursor.x * zoom + panX;
        const screenY = peer.cursor.y * zoom + panY;

        // Clip to canvas bounds
        if (screenX < 0 || screenX > canvasRect.width) return null;
        if (screenY < 0 || screenY > canvasRect.height) return null;

        return (
          <div
            key={peer.userId}
            className="absolute transition-transform duration-75"
            style={{ left: screenX, top: screenY, transform: 'translate(0, 0)' }}
          >
            {/* Cursor SVG */}
            <svg
              width="20" height="24"
              viewBox="0 0 20 24"
              className="drop-shadow-sm"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
            >
              <path
                d="M0 0 L0 20 L5 15 L9 24 L11 23 L7 14 L13 14 Z"
                fill={peer.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-3 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ background: peer.color }}
            >
              {peer.name || 'User'}
            </div>

            {/* Selection highlight dot */}
            {peer.selectedId && (
              <div
                className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white animate-pulse"
                style={{ background: peer.color }}
                title={`${peer.name} is editing this object`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
