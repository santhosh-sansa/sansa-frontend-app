/**
 * SANSA AI — LWW-CRDT (Last-Write-Wins Conflict-free Replicated Data Type)
 *
 * Model:
 *   • Canvas = Set of objects, each identified by a stable __id
 *   • Each object property is a LWW-Register<T>
 *     – Register holds { val, clk: { t (Lamport timestamp), uid (userId) } }
 *   • Merge rule: higher Lamport clock wins; equal clock → lexicographically
 *     higher userId wins (deterministic tiebreaker)
 *
 * Convergence guarantee:
 *   merge(A, B) == merge(B, A)          (commutativity)
 *   merge(A, merge(B, C)) == merge(merge(A, B), C)  (associativity)
 *   merge(A, A) == A                    (idempotency)
 */

// ─── Clock ────────────────────────────────────────────────────

export interface LamportClock {
  t: number;   // logical timestamp
  uid: string; // userId — tiebreaker
}

/** Returns true if clock `a` should win over clock `b` */
export function clockWins(a: LamportClock, b: LamportClock): boolean {
  if (a.t !== b.t) return a.t > b.t;
  return a.uid > b.uid;
}

// ─── Register & Object state ──────────────────────────────────

export interface LWWRegister<T = unknown> {
  val: T;
  clk: LamportClock;
}

/** All serialisable Fabric.js properties we track per object */
export interface ObjectProps {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  rx?: number;
  ry?: number;
  radius?: number;
  src?: string;
  __label?: string;
  [key: string]: unknown;
}

export interface CRDTObject {
  /** LWW register per property */
  props: Record<string, LWWRegister>;
  /** Tombstone — deleted objects stay in state so late removes converge */
  deleted: LWWRegister<boolean>;
}

/** Full CRDT canvas state */
export type CRDTState = Map<string, CRDTObject>;

// ─── Operations (sent over the wire) ──────────────────────────

export type OpKind = 'upsert' | 'remove';

export interface CollabOp {
  kind: OpKind;
  /** Fabric __id */
  objectId: string;
  /** For 'upsert': changed properties */
  props?: Partial<ObjectProps>;
  /** Sender's clock at time of operation */
  clk: LamportClock;
}

// ─── Awareness (cursor / presence) ───────────────────────────

export interface UserPresence {
  userId: string;
  name: string;
  color: string;
  /** Canvas-space cursor position */
  cursor: { x: number; y: number } | null;
  /** Currently selected object __id */
  selectedId: string | null;
  /** Is the user currently moving/resizing? */
  isTransforming: boolean;
  updatedAt: number;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Deterministic color for a userId */
const PRESENCE_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4',
];
export function presenceColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return PRESENCE_COLORS[h % PRESENCE_COLORS.length];
}

// ─── Core CRDT operations ─────────────────────────────────────

/**
 * Apply a remote op to local CRDT state (mutates state in-place).
 * Returns true if the state actually changed (so the caller can re-render).
 */
export function applyOp(state: CRDTState, op: CollabOp): boolean {
  let changed = false;

  if (op.kind === 'remove') {
    const obj = state.get(op.objectId);
    if (!obj) {
      // Object not known locally — create tombstone
      state.set(op.objectId, {
        props: {},
        deleted: { val: true, clk: op.clk },
      });
      return true;
    }
    if (clockWins(op.clk, obj.deleted.clk)) {
      obj.deleted = { val: true, clk: op.clk };
      changed = true;
    }
    return changed;
  }

  // upsert
  if (!op.props) return false;
  let obj = state.get(op.objectId);

  if (!obj) {
    obj = { props: {}, deleted: { val: false, clk: { t: 0, uid: '' } } };
    state.set(op.objectId, obj);
    changed = true;
  }

  // Un-delete if the upsert clock beats the delete clock
  if (obj.deleted.val && clockWins(op.clk, obj.deleted.clk)) {
    obj.deleted = { val: false, clk: op.clk };
    changed = true;
  }

  for (const [key, val] of Object.entries(op.props)) {
    const existing = obj.props[key];
    if (!existing || clockWins(op.clk, existing.clk)) {
      obj.props[key] = { val, clk: op.clk };
      changed = true;
    }
  }

  return changed;
}

/**
 * Merge a remote full state snapshot into local state.
 * Used on initial room join to sync existing canvas.
 */
export function mergeState(local: CRDTState, remote: CRDTState): CRDTState {
  for (const [id, remoteObj] of remote.entries()) {
    const localObj = local.get(id);
    if (!localObj) {
      local.set(id, structuredClone(remoteObj));
      continue;
    }
    // Merge deleted register
    if (clockWins(remoteObj.deleted.clk, localObj.deleted.clk)) {
      localObj.deleted = remoteObj.deleted;
    }
    // Merge each property register
    for (const [key, reg] of Object.entries(remoteObj.props)) {
      const existing = localObj.props[key];
      if (!existing || clockWins(reg.clk, existing.clk)) {
        localObj.props[key] = reg;
      }
    }
  }
  return local;
}

/**
 * Materialise CRDT state into plain object array (Fabric.js ready).
 * Excludes deleted objects.
 */
export function materialise(state: CRDTState): Array<{ __id: string } & ObjectProps> {
  const objects: Array<{ __id: string } & ObjectProps> = [];
  for (const [id, obj] of state.entries()) {
    if (obj.deleted.val) continue;
    const flat: Record<string, unknown> = { __id: id };
    for (const [key, reg] of Object.entries(obj.props)) {
      flat[key] = reg.val;
    }
    objects.push(flat as { __id: string } & ObjectProps);
  }
  return objects;
}

/**
 * Serialise CRDTState to a plain JSON-safe object (for DB storage / wire).
 */
export function serialiseState(state: CRDTState): Record<string, CRDTObject> {
  const out: Record<string, CRDTObject> = {};
  for (const [id, obj] of state.entries()) out[id] = obj;
  return out;
}

/**
 * Deserialise a plain object back to CRDTState.
 */
export function deserialiseState(raw: Record<string, CRDTObject>): CRDTState {
  return new Map(Object.entries(raw));
}

/**
 * Build a CRDT state from a Fabric.js canvas JSON (initial load).
 * All objects get clock { t: 0, uid: '' } — any real op will beat it.
 */
export function stateFromFabricObjects(
  objects: Array<{ __id?: string } & Record<string, unknown>>,
  uid = '',
): CRDTState {
  const state: CRDTState = new Map();
  const seedClk: LamportClock = { t: 0, uid };
  for (const obj of objects) {
    const id = (obj.__id as string) ?? `obj-${Math.random().toString(36).slice(2)}`;
    const props: Record<string, LWWRegister> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === '__id') continue;
      props[k] = { val: v, clk: seedClk };
    }
    state.set(id, { props, deleted: { val: false, clk: { t: -1, uid: '' } } });
  }
  return state;
}
