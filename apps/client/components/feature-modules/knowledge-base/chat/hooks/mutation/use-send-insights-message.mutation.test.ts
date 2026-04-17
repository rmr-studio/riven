import { useSendInsightsMessage } from '@/components/feature-modules/knowledge-base/chat/hooks/mutation/use-send-insights-message.mutation';
import { act, renderHook } from '@testing-library/react';

const storeSendMessage = jest.fn();

jest.mock(
  '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider',
  () => ({
    useChatActions: () => ({
      sendMessage: storeSendMessage,
      retryMessage: jest.fn(),
      resetSession: jest.fn(),
    }),
  }),
);

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

import { toast } from 'sonner';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSendInsightsMessage', () => {
  it('forwards content to the store action', async () => {
    storeSendMessage.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSendInsightsMessage());

    await act(async () => {
      await result.current('hello');
    });

    expect(storeSendMessage).toHaveBeenCalledWith('hello');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows a toast when the store action throws', async () => {
    storeSendMessage.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useSendInsightsMessage());

    await act(async () => {
      await result.current('hello');
    });

    expect(toast.error).toHaveBeenCalledWith('network');
  });
});
