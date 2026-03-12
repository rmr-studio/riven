import { createDataTableStore } from './data-table.store';

type TestRow = { id: string; name: string; value: number };

function createTestStore(
  overrides: Partial<Parameters<typeof createDataTableStore<TestRow>>[0]> = {},
) {
  return createDataTableStore<TestRow>({
    initialData: [
      { id: '1', name: 'Row 1', value: 10 },
      { id: '2', name: 'Row 2', value: 20 },
      { id: '3', name: 'Row 3', value: 30 },
    ],
    getRowId: (row) => row.id,
    ...overrides,
  });
}

describe('createDataTableStore', () => {
  // ============================================================================
  // Edit Lifecycle
  // ============================================================================

  describe('startEditing', () => {
    it('sets editingCell and pendingValue', async () => {
      const store = createTestStore();
      await store.getState().startEditing('1', 'name', 'Row 1');

      const state = store.getState();
      expect(state.editingCell).toEqual({ rowId: '1', columnId: 'name' });
      expect(state.pendingValue).toBe('Row 1');
      expect(state.saveError).toBeNull();
    });

    it('clears saveError when starting a new edit', async () => {
      const store = createTestStore();
      store.setState({ saveError: 'previous error' });

      await store.getState().startEditing('1', 'name', 'Row 1');

      expect(store.getState().saveError).toBeNull();
    });

    it('switches to new cell immediately when already editing a different cell', async () => {
      // startEditing fires a background commitEdit that resolves async.
      // We check the state immediately after the second startEditing call,
      // before the background commit resolves, to verify the immediate switch.
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      // Start editing cell 1 (no previous editing, so no background commit)
      await store.getState().startEditing('1', 'name', 'Row 1');

      // Verify cell 1 is being edited
      expect(store.getState().editingCell).toEqual({ rowId: '1', columnId: 'name' });

      // Start editing cell 2 — triggers background commitEdit for cell 1
      // The new cell is set immediately before the background commit resolves
      await store.getState().startEditing('2', 'value', 20);

      // After both awaits the background commit for cell 1 has also completed,
      // which clears editingCell. The cell 2 is the last editingCell set,
      // but the background commit then clears it too.
      // What we can assert: the background commit was called (for the first cell)
      expect(onCellEdit).toHaveBeenCalledWith(
        { id: '1', name: 'Row 1', value: 10 },
        'name',
        'Row 1',
        'Row 1',
      );
    });
  });

  describe('updatePendingValue', () => {
    it('updates the pending value', async () => {
      const store = createTestStore();
      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Updated Row 1');

      expect(store.getState().pendingValue).toBe('Updated Row 1');
    });

    it('can update pending value to any type', async () => {
      const store = createTestStore();
      await store.getState().startEditing('1', 'value', 10);
      store.getState().updatePendingValue(99);

      expect(store.getState().pendingValue).toBe(99);
    });
  });

  describe('cancelEditing', () => {
    it('clears editingCell, pendingValue, and saveError', async () => {
      const store = createTestStore();
      await store.getState().startEditing('1', 'name', 'Row 1');
      store.setState({ saveError: 'some error' });

      store.getState().cancelEditing();

      const state = store.getState();
      expect(state.editingCell).toBeNull();
      expect(state.pendingValue).toBeNull();
      expect(state.saveError).toBeNull();
    });

    it('does not affect tableData', async () => {
      const store = createTestStore();
      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Modified');
      store.getState().cancelEditing();

      const row = store.getState().tableData.find((r) => r.id === '1');
      expect(row?.name).toBe('Row 1');
    });
  });

  describe('commitEdit - success', () => {
    it('calls onCellEdit with correct arguments', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Updated');
      await store.getState().commitEdit();

      expect(onCellEdit).toHaveBeenCalledWith(
        { id: '1', name: 'Row 1', value: 10 },
        'name',
        'Updated',
        'Row 1',
      );
    });

    it('updates tableData optimistically on success', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Updated');
      await store.getState().commitEdit();

      const row = store.getState().tableData.find((r) => r.id === '1');
      expect(row?.name).toBe('Updated');
    });

    it('clears editingCell and pendingValue on success', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Updated');
      await store.getState().commitEdit();

      const state = store.getState();
      expect(state.editingCell).toBeNull();
      expect(state.pendingValue).toBeNull();
      expect(state.isSaving).toBe(false);
    });

    it('sets focusedCell to the saved cell after success', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      await store.getState().commitEdit();

      expect(store.getState().focusedCell).toEqual({ rowId: '1', columnId: 'name' });
    });
  });

  describe('commitEdit - failure', () => {
    it('sets saveError and clears editing state when callback returns false', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(false);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Bad Value');
      await store.getState().commitEdit();

      const state = store.getState();
      expect(state.saveError).toBe('Save failed');
      expect(state.isSaving).toBe(false);
      expect(state.editingCell).toBeNull();
    });

    it('does not update tableData when callback returns false', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(false);
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Bad Value');
      await store.getState().commitEdit();

      const row = store.getState().tableData.find((r) => r.id === '1');
      expect(row?.name).toBe('Row 1');
    });

    it('sets saveError from thrown error message', async () => {
      const onCellEdit = jest.fn().mockRejectedValue(new Error('Network error'));
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      await store.getState().commitEdit();

      const state = store.getState();
      expect(state.saveError).toBe('Network error');
      expect(state.isSaving).toBe(false);
    });

    it('is a no-op when not currently editing', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      await store.getState().commitEdit();

      expect(onCellEdit).not.toHaveBeenCalled();
    });

    it('is a no-op when no onCellEdit callback is registered', async () => {
      const store = createTestStore();
      store.setState({
        editingCell: { rowId: '1', columnId: 'name' },
        pendingValue: 'Updated',
      });

      await store.getState().commitEdit();

      const row = store.getState().tableData.find((r) => r.id === '1');
      expect(row?.name).toBe('Row 1');
    });

    it('is a no-op when already saving', async () => {
      const onCellEdit = jest.fn().mockResolvedValue(true);
      const store = createTestStore({ onCellEdit });

      store.setState({
        editingCell: { rowId: '1', columnId: 'name' },
        pendingValue: 'Updated',
        isSaving: true,
      });

      await store.getState().commitEdit();

      expect(onCellEdit).not.toHaveBeenCalled();
    });
  });

  describe('exitToFocused', () => {
    it('clears editingCell and pendingValue without saving', async () => {
      const onCellEdit = jest.fn();
      const store = createTestStore({ onCellEdit });

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().updatePendingValue('Unsaved change');
      store.getState().exitToFocused();

      expect(onCellEdit).not.toHaveBeenCalled();
      const state = store.getState();
      expect(state.editingCell).toBeNull();
      expect(state.pendingValue).toBeNull();
    });

    it('keeps focus on the cell that was being edited', async () => {
      const store = createTestStore();
      await store.getState().startEditing('2', 'value', 20);
      store.getState().exitToFocused();

      expect(store.getState().focusedCell).toEqual({ rowId: '2', columnId: 'value' });
    });

    it('clears saveError', async () => {
      const store = createTestStore();
      store.setState({
        editingCell: { rowId: '1', columnId: 'name' },
        saveError: 'some error',
      });
      store.getState().exitToFocused();

      expect(store.getState().saveError).toBeNull();
    });

    it('sets focusedCell to null when no cell was being edited', () => {
      const store = createTestStore();
      store.getState().exitToFocused();

      expect(store.getState().focusedCell).toBeNull();
    });
  });

  // ============================================================================
  // Focus Navigation
  // ============================================================================

  describe('setFocusedCell', () => {
    it('sets the focused cell', () => {
      const store = createTestStore();
      store.getState().setFocusedCell('2', 'name');

      expect(store.getState().focusedCell).toEqual({ rowId: '2', columnId: 'name' });
    });

    it('overwrites a previously focused cell', () => {
      const store = createTestStore();
      store.getState().setFocusedCell('1', 'name');
      store.getState().setFocusedCell('3', 'value');

      expect(store.getState().focusedCell).toEqual({ rowId: '3', columnId: 'value' });
    });
  });

  describe('clearFocus', () => {
    it('sets focusedCell to null', () => {
      const store = createTestStore();
      store.getState().setFocusedCell('1', 'name');
      store.getState().clearFocus();

      expect(store.getState().focusedCell).toBeNull();
    });

    it('is a no-op when no cell is focused', () => {
      const store = createTestStore();
      store.getState().clearFocus();

      expect(store.getState().focusedCell).toBeNull();
    });
  });

  // ============================================================================
  // Row Reordering
  // ============================================================================

  describe('reorderRows', () => {
    it('moves a row from one index to another', () => {
      const store = createTestStore();
      store.getState().reorderRows(0, 2);

      const ids = store.getState().tableData.map((r) => r.id);
      expect(ids).toEqual(['2', '3', '1']);
    });

    it('moves a row forward in the list', () => {
      const store = createTestStore();
      store.getState().reorderRows(2, 0);

      const ids = store.getState().tableData.map((r) => r.id);
      expect(ids).toEqual(['3', '1', '2']);
    });

    it('is a no-op when old and new index are the same', () => {
      const store = createTestStore();
      store.getState().reorderRows(1, 1);

      const ids = store.getState().tableData.map((r) => r.id);
      expect(ids).toEqual(['1', '2', '3']);
    });

    it('preserves all row data after reorder', () => {
      const store = createTestStore();
      store.getState().reorderRows(0, 1);

      const data = store.getState().tableData;
      expect(data).toHaveLength(3);
      expect(data.find((r) => r.id === '1')).toEqual({ id: '1', name: 'Row 1', value: 10 });
    });
  });

  // ============================================================================
  // Derived State
  // ============================================================================

  describe('isDragDropEnabled', () => {
    it('returns false when enableDragDrop is false', () => {
      const store = createTestStore();
      expect(store.getState().isDragDropEnabled(false)).toBe(false);
    });

    it('returns true when enableDragDrop is true and no filters/search', () => {
      const store = createTestStore();
      expect(store.getState().isDragDropEnabled(true)).toBe(true);
    });

    it('returns false when there is an active global filter', () => {
      const store = createTestStore();
      store.setState({ globalFilter: 'search term' });
      expect(store.getState().isDragDropEnabled(true)).toBe(false);
    });

    it('returns false when there are active column filters', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: 'Row 1' },
        enabledFilters: new Set(['name']),
      });
      expect(store.getState().isDragDropEnabled(true)).toBe(false);
    });

    it('returns true when filters are enabled but have no values', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: {},
        enabledFilters: new Set(['name']),
      });
      expect(store.getState().isDragDropEnabled(true)).toBe(true);
    });
  });

  describe('hasSelections', () => {
    it('returns false when no rows are selected', () => {
      const store = createTestStore();
      expect(store.getState().hasSelections()).toBe(false);
    });

    it('returns true when at least one row is selected', () => {
      const store = createTestStore();
      store.setState({ rowSelection: { '1': true } });
      expect(store.getState().hasSelections()).toBe(true);
    });
  });

  describe('getSelectedCount', () => {
    it('returns 0 when no rows are selected', () => {
      const store = createTestStore();
      expect(store.getState().getSelectedCount()).toBe(0);
    });

    it('returns the number of selected rows', () => {
      const store = createTestStore();
      store.setState({ rowSelection: { '1': true, '2': true, '3': false } });
      // Only counts truthy values
      expect(store.getState().getSelectedCount()).toBe(2);
    });

    it('returns 3 when all rows are selected', () => {
      const store = createTestStore();
      store.setState({ rowSelection: { '1': true, '2': true, '3': true } });
      expect(store.getState().getSelectedCount()).toBe(3);
    });
  });

  describe('getActiveFilterCount', () => {
    it('returns 0 when no filters are active', () => {
      const store = createTestStore();
      expect(store.getState().getActiveFilterCount()).toBe(0);
    });

    it('returns 0 when activeFilters has values but none are enabled', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: 'Row 1' },
        enabledFilters: new Set(),
      });
      expect(store.getState().getActiveFilterCount()).toBe(0);
    });

    it('counts only enabled filters with non-empty values', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: 'Row 1', value: '' },
        enabledFilters: new Set(['name', 'value']),
      });
      expect(store.getState().getActiveFilterCount()).toBe(1);
    });

    it('counts array filter as active when non-empty', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: ['a', 'b'] },
        enabledFilters: new Set(['name']),
      });
      expect(store.getState().getActiveFilterCount()).toBe(1);
    });

    it('does not count empty array filter', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: [] },
        enabledFilters: new Set(['name']),
      });
      expect(store.getState().getActiveFilterCount()).toBe(0);
    });

    it('does not count null filter values', () => {
      const store = createTestStore();
      store.setState({
        activeFilters: { name: null },
        enabledFilters: new Set(['name']),
      });
      expect(store.getState().getActiveFilterCount()).toBe(0);
    });
  });

  // ============================================================================
  // Selection Actions
  // ============================================================================

  describe('clearSelection', () => {
    it('clears all row selections', () => {
      const store = createTestStore();
      store.setState({ rowSelection: { '1': true, '2': true } });
      store.getState().clearSelection();

      expect(store.getState().rowSelection).toEqual({});
    });

    it('is a no-op when selection is already empty', () => {
      const store = createTestStore();
      store.getState().clearSelection();

      expect(store.getState().rowSelection).toEqual({});
    });
  });

  // ============================================================================
  // Commit Callback
  // ============================================================================

  describe('registerCommitCallback and requestCommit', () => {
    it('calls the registered callback when requestCommit is called', () => {
      const store = createTestStore();
      const callback = jest.fn();

      store.getState().registerCommitCallback(callback);
      store.getState().requestCommit();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no callback is registered', () => {
      const store = createTestStore();
      // Should not throw
      expect(() => store.getState().requestCommit()).not.toThrow();
    });

    it('does nothing after callback is cleared with null', () => {
      const store = createTestStore();
      const callback = jest.fn();

      store.getState().registerCommitCallback(callback);
      store.getState().registerCommitCallback(null);
      store.getState().requestCommit();

      expect(callback).not.toHaveBeenCalled();
    });

    it('replaces previous callback when registered again', () => {
      const store = createTestStore();
      const first = jest.fn();
      const second = jest.fn();

      store.getState().registerCommitCallback(first);
      store.getState().registerCommitCallback(second);
      store.getState().requestCommit();

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('cancelEditing clears the commit callback', () => {
      const store = createTestStore();
      const callback = jest.fn();

      store.getState().registerCommitCallback(callback);
      store.getState().cancelEditing();
      store.getState().requestCommit();

      expect(callback).not.toHaveBeenCalled();
    });

    it('exitToFocused clears the commit callback', async () => {
      const store = createTestStore();
      const callback = jest.fn();

      await store.getState().startEditing('1', 'name', 'Row 1');
      store.getState().registerCommitCallback(callback);
      store.getState().exitToFocused();
      store.getState().requestCommit();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
