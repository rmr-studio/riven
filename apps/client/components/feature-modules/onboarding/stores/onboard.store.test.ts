import { useOnboardStore } from './onboard.store';

describe('onboard.store', () => {
  beforeEach(() => {
    useOnboardStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts at step 0', () => {
      expect(useOnboardStore.getState().currentStep).toBe(0);
    });

    it('starts with direction forward', () => {
      expect(useOnboardStore.getState().direction).toBe('forward');
    });

    it('starts with empty validatedData', () => {
      expect(useOnboardStore.getState().validatedData).toEqual({});
    });

    it('starts with empty liveData', () => {
      expect(useOnboardStore.getState().liveData).toEqual({});
    });

    it('starts with null formTrigger', () => {
      expect(useOnboardStore.getState().formTrigger).toBeNull();
    });
  });

  describe('goNext', () => {
    it('increments currentStep by 1', () => {
      useOnboardStore.getState().goNext();
      expect(useOnboardStore.getState().currentStep).toBe(1);
    });

    it('sets direction to forward', () => {
      useOnboardStore.getState().goBack();
      // direction is now backward - use goNext to change it
      useOnboardStore.setState({ currentStep: 1 });
      useOnboardStore.getState().goNext();
      expect(useOnboardStore.getState().direction).toBe('forward');
    });

    it('does not exceed max step index', () => {
      // Go to last step (index 3)
      useOnboardStore.setState({ currentStep: 3 });
      useOnboardStore.getState().goNext();
      expect(useOnboardStore.getState().currentStep).toBe(3);
    });

    it('clamps at ONBOARD_STEPS.length - 1', () => {
      useOnboardStore.setState({ currentStep: 100 });
      useOnboardStore.getState().goNext();
      // After goNext from 100, clamped to 3 (max index)
      expect(useOnboardStore.getState().currentStep).toBe(3);
    });
  });

  describe('goBack', () => {
    it('decrements currentStep by 1', () => {
      useOnboardStore.setState({ currentStep: 2 });
      useOnboardStore.getState().goBack();
      expect(useOnboardStore.getState().currentStep).toBe(1);
    });

    it('sets direction to backward', () => {
      useOnboardStore.setState({ currentStep: 1 });
      useOnboardStore.getState().goBack();
      expect(useOnboardStore.getState().direction).toBe('backward');
    });

    it('does not go below step 0', () => {
      useOnboardStore.getState().goBack();
      expect(useOnboardStore.getState().currentStep).toBe(0);
    });
  });

  describe('skip', () => {
    it('advances when current step is optional (templates = index 2)', () => {
      useOnboardStore.setState({ currentStep: 2 });
      useOnboardStore.getState().skip();
      expect(useOnboardStore.getState().currentStep).toBe(3);
    });

    it('sets direction to forward on optional step skip', () => {
      useOnboardStore.setState({ currentStep: 2 });
      useOnboardStore.getState().skip();
      expect(useOnboardStore.getState().direction).toBe('forward');
    });

    it('does NOT advance when current step is required (profile = index 0)', () => {
      useOnboardStore.getState().skip();
      expect(useOnboardStore.getState().currentStep).toBe(0);
    });

    it('does NOT advance when current step is required (workspace = index 1)', () => {
      useOnboardStore.setState({ currentStep: 1 });
      useOnboardStore.getState().skip();
      expect(useOnboardStore.getState().currentStep).toBe(1);
    });

    it('advances when current step is optional (team = index 3)', () => {
      useOnboardStore.setState({ currentStep: 3 });
      useOnboardStore.getState().skip();
      // Clamped at last step
      expect(useOnboardStore.getState().currentStep).toBe(3);
    });
  });

  describe('setStepData', () => {
    it('stores data under the correct stepId key', () => {
      const profileData = { name: 'John', avatar: 'url' };
      useOnboardStore.getState().setStepData('profile', profileData);
      expect(useOnboardStore.getState().validatedData.profile).toEqual(profileData);
    });

    it('merges multiple step data entries without overwriting others', () => {
      useOnboardStore.getState().setStepData('profile', { name: 'John' });
      useOnboardStore.getState().setStepData('workspace', { name: 'Acme' });
      expect(useOnboardStore.getState().validatedData.profile).toEqual({ name: 'John' });
      expect(useOnboardStore.getState().validatedData.workspace).toEqual({ name: 'Acme' });
    });
  });

  describe('reset', () => {
    it('returns to initial state after modifications', () => {
      useOnboardStore.setState({ currentStep: 3, direction: 'backward' });
      useOnboardStore.getState().setStepData('profile', { name: 'John' });
      useOnboardStore.getState().reset();

      const state = useOnboardStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.direction).toBe('forward');
      expect(state.validatedData).toEqual({});
    });
  });

  describe('setLiveData', () => {
    it('stores data under the correct stepId key', () => {
      useOnboardStore.getState().setLiveData('profile', { displayName: 'John' });
      expect(useOnboardStore.getState().liveData['profile']).toEqual({ displayName: 'John' });
    });

    it('merges multiple step data entries without overwriting others', () => {
      useOnboardStore.getState().setLiveData('profile', { displayName: 'John' });
      useOnboardStore.getState().setLiveData('workspace', { name: 'Acme' });
      expect(useOnboardStore.getState().liveData['profile']).toEqual({ displayName: 'John' });
      expect(useOnboardStore.getState().liveData['workspace']).toEqual({ name: 'Acme' });
    });

    it('overwrites existing step data on re-call', () => {
      useOnboardStore.getState().setLiveData('profile', { displayName: 'John' });
      useOnboardStore.getState().setLiveData('profile', { displayName: 'Jane' });
      expect(useOnboardStore.getState().liveData['profile']).toEqual({ displayName: 'Jane' });
    });
  });

  describe('registerFormTrigger', () => {
    it('stores the trigger function', () => {
      const trigger = async () => true;
      useOnboardStore.getState().registerFormTrigger(trigger);
      expect(useOnboardStore.getState().formTrigger).not.toBeNull();
    });

    it('replaces a previously registered trigger', () => {
      const first = async () => true;
      const second = async () => false;
      useOnboardStore.getState().registerFormTrigger(first);
      useOnboardStore.getState().registerFormTrigger(second);
      expect(useOnboardStore.getState().formTrigger).toBe(second);
    });
  });

  describe('clearFormTrigger', () => {
    it('sets formTrigger to null', () => {
      useOnboardStore.getState().registerFormTrigger(async () => true);
      useOnboardStore.getState().clearFormTrigger();
      expect(useOnboardStore.getState().formTrigger).toBeNull();
    });
  });

  describe('reset (extended)', () => {
    it('clears liveData on reset', () => {
      useOnboardStore.getState().setLiveData('profile', { displayName: 'John' });
      useOnboardStore.getState().reset();
      expect(useOnboardStore.getState().liveData).toEqual({});
    });

    it('clears formTrigger on reset', () => {
      useOnboardStore.getState().registerFormTrigger(async () => true);
      useOnboardStore.getState().reset();
      expect(useOnboardStore.getState().formTrigger).toBeNull();
    });
  });
});
