import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AskAI } from './AskAI';
import { aiAPI } from '@/api/client';

// Mock the API
vi.mock('@/api/client', () => ({
  aiAPI: {
    ask: vi.fn(),
  },
}));

describe('AskAI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(<AskAI projectId="test-project-id" />);

    expect(screen.getByText('Ask Your Novel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What color are Rhea's eyes/)).toBeInTheDocument();
    expect(screen.getByText('Ask')).toBeInTheDocument();
  });

  it('disables submit button when question is empty', () => {
    render(<AskAI projectId="test-project-id" />);

    const button = screen.getByRole('button', { name: /Ask/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when question is entered', async () => {
    const user = userEvent.setup();
    render(<AskAI projectId="test-project-id" />);

    const textarea = screen.getByPlaceholderText(/What color are Rhea's eyes/);
    await user.type(textarea, 'What is the main character name?');

    const button = screen.getByRole('button', { name: /Ask/i });
    expect(button).not.toBeDisabled();
  });

  it('displays answer and citations on successful API call', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        answer: 'The main character is Rhea.',
        citations: [
          {
            sourceType: 'chapter',
            sourceId: 'chapter-1',
            chunkId: 'chunk-1',
            content: 'Rhea walked through the forest...',
            similarity: 0.95,
          },
        ],
        tokensIn: 100,
        tokensOut: 50,
      },
    };

    vi.mocked(aiAPI.ask).mockResolvedValueOnce(mockResponse);

    render(<AskAI projectId="test-project-id" />);

    const textarea = screen.getByPlaceholderText(/What color are Rhea's eyes/);
    await user.type(textarea, 'Who is the main character?');

    const button = screen.getByRole('button', { name: /Ask/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeInTheDocument();
      expect(screen.getByText('The main character is Rhea.')).toBeInTheDocument();
    });

    expect(screen.getByText(/Sources \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/95.0% match/)).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();

    vi.mocked(aiAPI.ask).mockRejectedValueOnce({
      response: {
        data: {
          message: 'API key not configured',
        },
      },
    });

    render(<AskAI projectId="test-project-id" />);

    const textarea = screen.getByPlaceholderText(/What color are Rhea's eyes/);
    await user.type(textarea, 'Test question');

    const button = screen.getByRole('button', { name: /Ask/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/API key not configured/)).toBeInTheDocument();
    });
  });

  it('toggles canon-safe mode', async () => {
    const user = userEvent.setup();
    render(<AskAI projectId="test-project-id" />);

    const checkbox = screen.getByRole('checkbox', {
      name: /Canon-safe mode/i,
    });

    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('shows loading state while waiting for response', async () => {
    const user = userEvent.setup();

    vi.mocked(aiAPI.ask).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<AskAI projectId="test-project-id" />);

    const textarea = screen.getByPlaceholderText(/What color are Rhea's eyes/);
    await user.type(textarea, 'Test question');

    const button = screen.getByRole('button', { name: /Ask/i });
    await user.click(button);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
