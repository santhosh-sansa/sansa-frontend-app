'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { connectCollabSocket, disconnectCollabSocket, getCollabSocket } from '@/lib/socket';
import {
  type CRDTState, type CollabOp, type UserPresence, type LamportClock,
  type CRDTObject, type ObjectProps,
  applyOp, mergeState, presenceColor,
  serialiseState, deserialiseState, stateFromFabricObjects,
} from '@/lib/collab-crdt';

// ─── Types ────────────────────────────────────────────────────

export interface CollabUser {
  userId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selectedId: string | null;
  isTransforming: boolean;
}

export interface UseCollabOptions {
  /** The room / document ID (StudioProject id) */
  roomId: string | null;
  /** Current user info */
  userId: string;
  userName: string;
  /** Fabric canvas — used to apply remote ops */
  canvasRef: React.RefObject<{
    getObjects: () => Array<{ __id?: string; [k: string]: unknown }>;
    add: (obj: unknown) => void;
    remove: (obj: unknown) => void;
    renderAll: () => void;
    loadFromJSON: (json: unknown, cb: () => void) => void;
    toJSON: (extra: string[]) => unknown;
    setActiveObject: (obj: unknown) => void;
  } | null>;
  fabricRef: React.RefObject<unknown>;
  /** Callback when remote state has been applied to canvas */
  onRemoteApply?: () => void;
}

export interface UseCollabReturn {
  /** Connected peers (excluding self) */
  peers: CollabUser[];
  /** Is the collab socket connected to the room? */
  connected: boolean;
  /** Whether this user is the "host" (first to join) */
  isHost: boolean;
  /** Broadcast an operation to all peers */
  broadcastOp: (op: Omit<CollabOp, 'clk'>) => void;
  /** Broadcast cursor position (throttled internally) */
  broadcastCursor: (x: number, y: number) => void;
  /** Broadcast selection */
  broadcastSelection: (objectId: string | null, isTransforming: boolean) => void;
  /** Current room member count (including self) */
  memberCount: number;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useCollab({
  roomId,
  userId,
  userName,
  canvasRef,
  fabricRef,
  onRemoteApply,
}: UseCollabOptions): UseCollabReturn {

  const [peers, setPeers]       = useState<CollabUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [isHost,   setIsHost]   = useState(false);
  const [memberCount, setMemberCount] = useState(1);

  // CRDT state — shared mutable ref (no re-render on every op)
  const crdtState = useRef<CRDTState>(new Map());
  // Lamport clock for this client
  const clock = useRef<number>(0);
  // Throttle cursor broadcast
  const cursorThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pending remote op queue (applied when Fabric is ready)
  const applyingRef = useRef(false);

  const myClk = useCallback((): LamportClock => {
    clock.current += 1;
    return { t: clock.current, uid: userId };
  }, [userId]);

  // ── Apply remote op to Fabric canvas ─────────────────────────
  const applyRemoteOp = useCallback((op: CollabOp) => {
    const changed = applyOp(crdtState.current, op);
    if (!changed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (op.kind === 'remove') {
      const obj = canvas.getObjects().find((o: {__id?: string}) => o.__id === op.objectId);
      if (obj) { canvas.remove(obj); canvas.renderAll(); }
      return;
    }

    // upsert: update existing object or create new
    const existing = canvas.getObjects().find((o: {__id?: string}) => o.__id === op.objectId);
    if (existing && op.props) {
      (existing as unknown as { set: (p: unknown) => void }).set(op.props);
      canvas.renderAll();
    } else if (!existing && op.props?.type) {
      // Need Fabric to construct the object — use loadFromJSON for the single object
      void createFabricObject(op.objectId, op.props, canvas, fabricRef);
    }

    onRemoteApply?.();
  }, [canvasRef, fabricRef, onRemoteApply]);

  // ── Create a Fabric object from props ────────────────────────
  const createFabricObject = async (
    id: string,
    props: Partial<ObjectProps>,
    canvas: NonNullable<typeof canvasRef['current']>,
    _fabricRef: React.RefObject<unknown>,
  ) => {
    // Use Fabric's enlivenObjects to reconstruct from JSON
    const fabric = (window as unknown as Record<string, {util: {enlivenObjects: (objs: unknown[], cb: (result: unknown[]) => void) => void}} | undefined>)['fabric'];
    if (!fabric) return;
    fabric.util.enlivenObjects(
      [{ ...props, __id: id }],
      (objs: unknown[]) => {
        if (objs[0]) { canvas.add(objs[0]); canvas.renderAll(); }
      },
    );
  };

  // ── Connect / disconnect ──────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const socket = connectCollabSocket();

    socket.on('connect', () => {
      setConnected(true);
      // Join the room
      socket.emit('collab:join', {
        roomId,
        userId,
        name: userName,
        color: presenceColor(userId),
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setPeers([]);
    });

    // ── Room state on join ──────────────────────────────────────
    socket.on('collab:room-state', (data: {
      isHost: boolean;
      memberCount: number;
      state: Record<string, CRDTObject>;
      peers: UserPresence[];
    }) => {
      setIsHost(data.isHost);
      setMemberCount(data.memberCount);

      // Merge remote CRDT state into local
      const remote = deserialiseState(data.state);
      crdtState.current = mergeState(crdtState.current, remote);

      // Update peers list
      setPeers(data.peers
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          color: p.color,
          cursor: p.cursor,
          selectedId: p.selectedId,
          isTransforming: p.isTransforming,
        })));
    });

    // ── Remote op received ──────────────────────────────────────
    socket.on('collab:op', (op: CollabOp) => {
      // Advance our clock to at least the remote clock
      if (op.clk.t >= clock.current) clock.current = op.clk.t + 1;
      applyRemoteOp(op);
    });

    // ── Peer cursor / selection update ────────────────────────
    socket.on('collab:presence', (presence: UserPresence) => {
      if (presence.userId === userId) return;
      setPeers((prev) => {
        const idx = prev.findIndex((p) => p.userId === presence.userId);
        const updated: CollabUser = {
          userId:        presence.userId,
          name:          presence.name,
          color:         presence.color,
          cursor:        presence.cursor,
          selectedId:    presence.selectedId,
          isTransforming: presence.isTransforming,
        };
        if (idx === -1) return [...prev, updated];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    });

    // ── Peer join / leave ─────────────────────────────────────
    socket.on('collab:peer-joined', (peer: { userId: string; name: string; color: string }) => {
      if (peer.userId === userId) return;
      setMemberCount((n) => n + 1);
      setPeers((prev) => {
        if (prev.some((p) => p.userId === peer.userId)) return prev;
        return [...prev, { ...peer, cursor: null, selectedId: null, isTransforming: false }];
      });
    });

    socket.on('collab:peer-left', (data: { userId: string }) => {
      if (data.userId === userId) return;
      setMemberCount((n) => Math.max(1, n - 1));
      setPeers((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    // ── Full canvas sync request (host → new peer) ────────────
    socket.on('collab:request-state', () => {
      // Send current CRDT state to server for distribution
      socket.emit('collab:push-state', {
        roomId,
        state: serialiseState(crdtState.current),
      });
    });

    return () => {
      socket.emit('collab:leave', { roomId, userId });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('collab:room-state');
      socket.off('collab:op');
      socket.off('collab:presence');
      socket.off('collab:peer-joined');
      socket.off('collab:peer-left');
      socket.off('collab:request-state');
      disconnectCollabSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, userName]);

  // ── Broadcast op ─────────────────────────────────────────────
  const broadcastOp = useCallback((partial: Omit<CollabOp, 'clk'>) => {
    if (!roomId) return;
    const op: CollabOp = { ...partial, clk: myClk() };
    // Apply locally first (optimistic)
    applyOp(crdtState.current, op);
    // Then broadcast
    getCollabSocket().emit('collab:op', { roomId, op });
  }, [roomId, myClk]);

  // ── Broadcast cursor (60fps throttle → 30fps max) ────────────
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!roomId) return;
    if (cursorThrottle.current) return;
    cursorThrottle.current = setTimeout(() => { cursorThrottle.current = null; }, 33);
    getCollabSocket().emit('collab:cursor', {
      roomId, userId,
      cursor: { x, y },
      selectedId: null,
      isTransforming: false,
    });
  }, [roomId, userId]);

  // ── Broadcast selection ───────────────────────────────────────
  const broadcastSelection = useCallback((objectId: string | null, isTransforming: boolean) => {
    if (!roomId) return;
    getCollabSocket().emit('collab:cursor', {
      roomId, userId,
      cursor: null,
      selectedId: objectId,
      isTransforming,
    });
  }, [roomId, userId]);

  return {
    peers,
    connected,
    isHost,
    broadcastOp,
    broadcastCursor,
    broadcastSelection,
    memberCount,
  };
}
