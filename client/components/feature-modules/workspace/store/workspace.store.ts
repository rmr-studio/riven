import type { Workspace } from "@/lib/types/workspace";
import { createStore } from "zustand";

type WorkspaceState = {
  selectedWorkspaceId?: string;
};

type WorkspaceActions = {
  setSelectedWorkspace: (workspace: Workspace) => void;
};

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

export type WorkspaceStoreApi = ReturnType<typeof createWorkspaceStore>;

export const workspaceInitState: WorkspaceState = {
  selectedWorkspaceId: undefined,
};

export const createWorkspaceStore = (initState: WorkspaceState = workspaceInitState) => {
  return createStore<WorkspaceStore>()((set) => ({
    ...initState,
    setSelectedWorkspace: (workspace: Workspace) =>
      set(() => {
        localStorage.setItem('selectedWorkspace', workspace.id);
        return {
          selectedWorkspaceId: workspace.id,
        };
      }),
  }));
};
