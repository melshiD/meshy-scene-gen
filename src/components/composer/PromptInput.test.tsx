import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from './PromptInput';
import { useComposerStore } from '@/stores/composer-store';

describe('PromptInput', () => {
  beforeEach(() => {
    // Reset store before each test
    useComposerStore.getState().reset();
  });

  it('should render single prompt tab by default', () => {
    render(<PromptInput />);

    expect(screen.getByText('Single Prompt')).toBeInTheDocument();
    expect(screen.getByText('Split Prompts')).toBeInTheDocument();
  });

  it('should render scene description label in single mode', () => {
    render(<PromptInput />);

    expect(screen.getByLabelText('Scene Description')).toBeInTheDocument();
  });

  it('should show helper text for single prompt mode', () => {
    render(<PromptInput />);

    expect(
      screen.getByText(/AI will automatically decompose/)
    ).toBeInTheDocument();
  });

  it('should render tab buttons for mode switching', () => {
    render(<PromptInput />);

    // Both tabs should be clickable
    const singleTab = screen.getByText('Single Prompt');
    const splitTab = screen.getByText('Split Prompts');

    expect(singleTab).toHaveAttribute('role', 'tab');
    expect(splitTab).toHaveAttribute('role', 'tab');
  });

  it('should update store when typing in single prompt', () => {
    render(<PromptInput />);

    const textarea = screen.getByLabelText('Scene Description');
    fireEvent.change(textarea, { target: { value: 'crystal dragon' } });

    expect(useComposerStore.getState().prompt.single).toBe('crystal dragon');
  });

  it('should have correct placeholder text', () => {
    render(<PromptInput />);

    const textarea = screen.getByPlaceholderText(/Describe your scene/);
    expect(textarea).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PromptInput className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('PromptInput split mode', () => {
  beforeEach(() => {
    // Reset and set to split mode
    useComposerStore.getState().reset();
    useComposerStore.getState().setPromptMode('split');
  });

  it('should show object and background fields in split mode', () => {
    render(<PromptInput />);

    expect(screen.getByLabelText('3D Object')).toBeInTheDocument();
    expect(screen.getByLabelText('Background')).toBeInTheDocument();
  });

  it('should show helper text for split mode', () => {
    render(<PromptInput />);

    expect(
      screen.getByText(/Split mode sends prompts directly/)
    ).toBeInTheDocument();
  });

  it('should update store when typing in object prompt', () => {
    render(<PromptInput />);

    const textarea = screen.getByLabelText('3D Object');
    fireEvent.change(textarea, { target: { value: 'golden trophy' } });

    expect(useComposerStore.getState().prompt.object).toBe('golden trophy');
  });

  it('should update store when typing in background prompt', () => {
    render(<PromptInput />);

    const textarea = screen.getByLabelText('Background');
    fireEvent.change(textarea, { target: { value: 'blue gradient' } });

    expect(useComposerStore.getState().prompt.background).toBe('blue gradient');
  });
});
