import { createEditorStore } from './editor-store';
import { EditorActions } from '../lib/reducer/actions';
import { ContainerNode, TextNode } from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestContainer(id = 'root', content = 'Hello'): ContainerNode {
  const textNode: TextNode = {
    id: `text-${id}`,
    type: 'paragraph',
    content,
    attributes: {},
  };
  return {
    id,
    type: 'container',
    children: [textNode],
  };
}

// ============================================================================
// createEditorStore — factory isolation
// ============================================================================

describe('createEditorStore', () => {
  it('creates a store with default initial state when no args provided', () => {
    const store = createEditorStore();
    const state = store.getState();

    expect(state.history).toBeDefined();
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.historyIndex).toBe(0);
    expect(state.activeNodeId).toBeDefined();
  });

  it('creates a store with the provided initial container', () => {
    const container = createTestContainer('test-root', 'Test content');
    const store = createEditorStore(container);
    const state = store.getState();

    expect(state.history[0].id).toBe('test-root');
    expect(state.history[0].children).toHaveLength(1);
    expect((state.history[0].children[0] as TextNode).content).toBe('Test content');
  });

  it('two stores created from the factory do not share state', () => {
    const container1 = createTestContainer('root-1', 'Store 1');
    const container2 = createTestContainer('root-2', 'Store 2');

    const store1 = createEditorStore(container1);
    const store2 = createEditorStore(container2);

    // Verify initial isolation
    expect(store1.getState().history[0].id).toBe('root-1');
    expect(store2.getState().history[0].id).toBe('root-2');

    // Dispatch to store1 — update the text node content
    store1.getState().dispatch(
      EditorActions.updateNode('text-root-1', { content: 'Modified in store 1' }),
    );

    // store1 changed
    const s1Container = store1.getState().history[store1.getState().historyIndex];
    expect((s1Container.children[0] as TextNode).content).toBe('Modified in store 1');

    // store2 unchanged
    const s2Container = store2.getState().history[store2.getState().historyIndex];
    expect((s2Container.children[0] as TextNode).content).toBe('Store 2');
  });

  it('dispatch updates the store state', () => {
    const container = createTestContainer('root', 'Original');
    const store = createEditorStore(container);

    const textNode = store.getState().history[0].children[0] as TextNode;

    store.getState().dispatch(
      EditorActions.updateNode(textNode.id, { content: 'Updated' }),
    );

    const updatedContainer = store.getState().history[store.getState().historyIndex];
    const updatedNode = updatedContainer.children[0] as TextNode;
    expect(updatedNode.content).toBe('Updated');
  });

  it('getNode returns the correct node by ID', () => {
    const container = createTestContainer('root', 'Find me');
    const store = createEditorStore(container);

    const node = store.getState().getNode('text-root');
    expect(node).toBeDefined();
    expect((node as TextNode).content).toBe('Find me');
  });

  it('getNode returns undefined for non-existent ID', () => {
    const store = createEditorStore();
    const node = store.getState().getNode('non-existent-id');
    expect(node).toBeUndefined();
  });

  it('getContainer returns the current container from history', () => {
    const container = createTestContainer('root', 'Container test');
    const store = createEditorStore(container);

    const result = store.getState().getContainer();
    expect(result.id).toBe('root');
    expect(result.children).toHaveLength(1);
  });
});

// ============================================================================
// Selection manager
// ============================================================================

describe('selectionManager', () => {
  it('getSelection returns null initially', () => {
    const store = createEditorStore();
    expect(store.getState().selectionManager.getSelection()).toBeNull();
  });

  it('setSelection updates selection and notifies subscribers', () => {
    const store = createEditorStore();
    const callback = jest.fn();

    store.getState().selectionManager.subscribe(callback);

    const selection = { nodeId: 'test', start: 0, end: 5, type: 'text' as const };
    store.getState().selectionManager.setSelection(selection as any);

    expect(callback).toHaveBeenCalledWith(selection);
    expect(store.getState().selectionManager.getSelection()).toEqual(selection);
  });

  it('unsubscribe stops notifications', () => {
    const store = createEditorStore();
    const callback = jest.fn();

    const unsubscribe = store.getState().selectionManager.subscribe(callback);
    unsubscribe();

    store.getState().selectionManager.setSelection(null);
    expect(callback).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Store subscriptions
// ============================================================================

describe('store subscriptions', () => {
  it('subscribe notifies on state changes', () => {
    const container = createTestContainer('root', 'Watch me');
    const store = createEditorStore(container);
    const callback = jest.fn();

    store.subscribe(callback);

    store.getState().dispatch(
      EditorActions.updateNode('text-root', { content: 'Changed' }),
    );

    expect(callback).toHaveBeenCalled();
  });

  it('multiple stores have independent subscriptions', () => {
    const store1 = createEditorStore(createTestContainer('root-1'));
    const store2 = createEditorStore(createTestContainer('root-2'));

    const cb1 = jest.fn();
    const cb2 = jest.fn();

    store1.subscribe(cb1);
    store2.subscribe(cb2);

    store1.getState().dispatch(
      EditorActions.updateNode('text-root-1', { content: 'Only store 1' }),
    );

    expect(cb1).toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });
});
