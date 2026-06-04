'use client';

import { useState, useCallback, createContext, useContext } from 'react';

export type Workspace = {
  id: string;
  name: string;
  plan: string;
};

type WorkspaceState = {
  currentWorkspace: Workspace | null;
  setWorkspace: (ws: Workspace) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

// Simple hook-based store (no external deps needed)
export function useWorkspaceStore(): WorkspaceState {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);

  return {
    currentWorkspace,
    setWorkspace: setCurrentWorkspace,
    sidebarOpen,
    setSidebarOpen,
    commandOpen,
    setCommandOpen,
  };
}
