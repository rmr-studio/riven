import React from 'react';
import { createStore, type StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import { EditorAction } from '../lib/reducer/actions';
import { createInitialState, editorReducer } from '../lib/reducer/editor-reducer';
import { ContainerNode, EditorNode, EditorState, SelectionInfo, TextNode } from '../types';

// ============================================================================
// Store interface
// ============================================================================

interface EditorStore extends EditorState {
  // Actions
  dispatch: (action: EditorAction) => void;

  // Optimized selectors that don't cause re-renders
  getNode: (nodeId: string) => EditorNode | undefined;
  getContainer: () => ContainerNode;
  isNodeActive: (nodeId: string) => boolean;
  getActiveNodeId: () => string | null;
  getContainerChildrenIds: () => string[];

  // Selection management (optimized to avoid re-renders)
  selectionManager: {
    getSelection: () => SelectionInfo | null;
    setSelection: (selection: SelectionInfo | null) => void;
    subscribe: (callback: (selection: SelectionInfo | null) => void) => () => void;
  };

  // Internal selection state (not reactive)
  _selection: SelectionInfo | null;
  _selectionSubscribers: Set<(selection: SelectionInfo | null) => void>;
}

export type EditorStoreApi = StoreApi<EditorStore>;

// ============================================================================
// Helper
// ============================================================================

function findNodeById(container: ContainerNode, nodeId: string): EditorNode | undefined {
  if (container.id === nodeId) return container;

  for (const child of container.children) {
    if (child.id === nodeId) return child;

    if ('children' in child && Array.isArray(child.children)) {
      const found = findNodeById(child as ContainerNode, nodeId);
      if (found) return found;
    }
  }

  return undefined;
}

// Static empty Set to avoid creating new instances
const EMPTY_SELECTED_BLOCKS = new Set<string>();

// ============================================================================
// Factory function — creates an independent store instance
// ============================================================================

export function createEditorStore(
  initialContainer?: ContainerNode,
  initialState?: EditorState,
): EditorStoreApi {
  const initial = initialState
    ? initialState
    : initialContainer
      ? createInitialState(initialContainer)
      : createInitialState();

  return createStore<EditorStore>()(
    subscribeWithSelector((set, get) => {
      const selectionSubscribers = new Set<(selection: SelectionInfo | null) => void>();

      return {
        ...initial,

        _selection: null,
        _selectionSubscribers: selectionSubscribers,

        dispatch: (action: EditorAction) => {
          const currentState = get();
          const newState = editorReducer(currentState, action);
          set(newState);
        },

        getNode: (nodeId: string) => {
          const container = get().history[get().historyIndex];
          return findNodeById(container, nodeId);
        },

        getContainer: () => {
          return get().history[get().historyIndex];
        },

        isNodeActive: (nodeId: string) => {
          return get().activeNodeId === nodeId;
        },

        getActiveNodeId: () => {
          return get().activeNodeId;
        },

        getContainerChildrenIds: () => {
          const container = get().history[get().historyIndex];
          return container.children.map((child) => child.id);
        },

        selectionManager: {
          getSelection: () => get()._selection,

          setSelection: (selection: SelectionInfo | null) => {
            set({ _selection: selection });
            const subscribers = get()._selectionSubscribers;
            subscribers.forEach((callback) => callback(selection));
          },

          subscribe: (callback: (selection: SelectionInfo | null) => void) => {
            const subscribers = get()._selectionSubscribers;
            subscribers.add(callback);
            return () => {
              subscribers.delete(callback);
            };
          },
        },
      };
    }),
  );
}

// ============================================================================
// Context + context hook
// ============================================================================

const EditorStoreContext = React.createContext<EditorStoreApi | undefined>(undefined);

function useEditorStoreContext<T>(selector: (state: EditorStore) => T): T {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('Editor hooks must be used within an EditorProvider');
  }
  return useStore(store, selector);
}

/**
 * Returns the raw store API for non-reactive access (e.g., in callbacks or memo comparisons).
 * Use this instead of the old `useEditorStore.getState()` pattern.
 */
export function useEditorStoreApi(): EditorStoreApi {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStoreApi must be used within an EditorProvider');
  }
  return store;
}

// ============================================================================
// Selector hooks — same signatures as before, now context-based
// ============================================================================

/**
 * Hook for blocks to subscribe only to their specific node data.
 * Prevents re-renders when other nodes change via structural sharing.
 */
export function useBlockNode(nodeId: string) {
  return useEditorStoreContext((state) => {
    const container = state.history[state.historyIndex];
    return findNodeById(container, nodeId);
  });
}

/**
 * Hook to check if a specific node is active.
 * Only re-renders when the active status of THIS node changes.
 */
export function useIsNodeActive(nodeId: string): boolean {
  return useEditorStoreContext((state) => state.activeNodeId === nodeId);
}

/**
 * Hook to get the current active node ID.
 * Only re-renders when the active node ID changes.
 */
export function useActiveNodeId(): string | null {
  return useEditorStoreContext((state) => state.activeNodeId);
}

/**
 * Hook to get the current container's children IDs.
 * Uses useShallow to prevent unnecessary re-renders from array recreation.
 */
export function useContainerChildrenIds(): string[] {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useContainerChildrenIds must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => {
      const container = state.history[state.historyIndex];
      return container.children.map((child) => child.id);
    }),
  );
}

/**
 * Hook to get the current container.
 * Use sparingly — prefer more specific hooks when possible.
 */
export function useContainer(): ContainerNode {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useContainer must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => state.history[state.historyIndex]),
  );
}

/**
 * Hook to get the current container (non-reactive, for use in callbacks).
 */
export function useContainerGetter(): () => ContainerNode {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useContainerGetter must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => () => state.history[state.historyIndex]),
  );
}

/**
 * Hook to get the dispatch function.
 * This never changes so no re-renders.
 */
export function useEditorDispatch() {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorDispatch must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => state.dispatch),
  );
}

/**
 * Hook to get the full editor state.
 * Use only when you need the complete state (like for toolbars).
 */
export function useEditorState(): EditorState {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorState must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => ({
      history: state.history,
      historyIndex: state.historyIndex,
      activeNodeId: state.activeNodeId,
      currentSelection: state.currentSelection,
      version: state.version,
      coverImage: state.coverImage,
      hasSelection: state.currentSelection !== null,
      selectionKey: state.version ? parseInt(state.version.split('.').join('')) : 0,
      selectedBlocks: EMPTY_SELECTED_BLOCKS,
    })),
  );
}

/**
 * Hook for selection management (optimized to avoid re-renders).
 */
export function useSelectionManager() {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useSelectionManager must be used within an EditorProvider');
  }
  return useStore(
    store,
    useShallow((state: EditorStore) => state.selectionManager),
  );
}

/**
 * Hook to subscribe to selection changes (for toolbar/UI updates).
 */
export function useSelection(): SelectionInfo | null {
  const selectionManager = useSelectionManager();
  const [selection, setSelection] = React.useState<SelectionInfo | null>(
    selectionManager.getSelection(),
  );

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe(setSelection);
    return unsubscribe;
  }, [selectionManager]);

  return selection;
}

// ============================================================================
// Provider component
// ============================================================================

export interface EditorProviderProps {
  children: React.ReactNode;
  initialContainer?: ContainerNode;
  initialState?: EditorState;
  onChange?: (state: EditorState) => void;
  debug?: boolean;
}

export function EditorProvider({
  children,
  initialContainer,
  initialState,
  onChange,
  debug = false,
}: EditorProviderProps) {
  const storeRef = React.useRef<EditorStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createEditorStore(initialContainer, initialState);
  }

  // Subscribe to state changes for onChange callback
  React.useEffect(() => {
    if (!onChange || !storeRef.current) return;

    return storeRef.current.subscribe((state) => {
      const editorState: EditorState = {
        history: state.history,
        historyIndex: state.historyIndex,
        activeNodeId: state.activeNodeId,
        currentSelection: state.currentSelection,
        version: state.version,
        coverImage: state.coverImage,
        hasSelection: state.currentSelection !== null,
        selectionKey: state.version ? parseInt(state.version.split('.').join('')) : 0,
        selectedBlocks: new Set<string>(),
      };
      onChange(editorState);
    });
  }, [onChange]);

  // Debug logging
  React.useEffect(() => {
    if (!debug || !storeRef.current) return;

    let prevState = storeRef.current.getState();
    return storeRef.current.subscribe((state) => {
      console.group('🎬 [Mina Editor] State Change');
      console.log('Previous:', prevState);
      console.log('Current:', state);
      console.groupEnd();
      prevState = state;
    });
  }, [debug]);

  return (
    <EditorStoreContext.Provider value={storeRef.current}>
      {children}
    </EditorStoreContext.Provider>
  );
}
