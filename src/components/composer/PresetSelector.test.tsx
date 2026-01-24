import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetSelector } from './PresetSelector';
import { useComposerStore } from '@/stores/composer-store';

describe('PresetSelector', () => {
  beforeEach(() => {
    useComposerStore.getState().reset();
  });

  it('should render title', () => {
    render(<PresetSelector />);
    expect(screen.getByText('Scene Preset')).toBeInTheDocument();
  });

  it('should render current preset name', () => {
    render(<PresetSelector />);
    // Default preset is 'product' with name 'Product Shot'
    // There are multiple elements with this text (dropdown and info panel)
    const elements = screen.getAllByText('Product Shot');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render Reset button', () => {
    render(<PresetSelector />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should render Save As button', () => {
    render(<PresetSelector />);
    expect(screen.getByText('Save As...')).toBeInTheDocument();
  });

  it('should disable Reset button when not dirty', () => {
    render(<PresetSelector />);

    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeDisabled();
  });

  it('should enable Reset button when dirty', () => {
    // Make the store dirty
    useComposerStore.getState().setObjectScale(2);

    render(<PresetSelector />);

    const resetButton = screen.getByText('Reset');
    expect(resetButton).not.toBeDisabled();
  });

  it('should show Modified indicator when dirty', () => {
    useComposerStore.getState().setObjectScale(2);

    render(<PresetSelector />);
    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('should open save dialog when Save As clicked', () => {
    render(<PresetSelector />);

    fireEvent.click(screen.getByText('Save As...'));

    expect(screen.getByText('Save Preset')).toBeInTheDocument();
    expect(screen.getByLabelText('Preset Name')).toBeInTheDocument();
  });

  it('should close save dialog on Cancel', () => {
    render(<PresetSelector />);

    // Open dialog
    fireEvent.click(screen.getByText('Save As...'));
    expect(screen.getByText('Save Preset')).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Save Preset')).not.toBeInTheDocument();
  });

  it('should call onSavePreset with name when Save clicked', () => {
    const onSavePreset = vi.fn();
    render(<PresetSelector onSavePreset={onSavePreset} />);

    // Open dialog
    fireEvent.click(screen.getByText('Save As...'));

    // Enter name
    const input = screen.getByLabelText('Preset Name');
    fireEvent.change(input, { target: { value: 'My Custom Preset' } });

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSavePreset).toHaveBeenCalledWith('My Custom Preset');
  });

  it('should disable Save button when name is empty', () => {
    render(<PresetSelector />);

    fireEvent.click(screen.getByText('Save As...'));

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });

  it('should call resetToPreset when Reset clicked', () => {
    // Make some changes
    useComposerStore.getState().setObjectScale(5);
    expect(useComposerStore.getState().isDirty).toBe(true);

    render(<PresetSelector />);

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // After reset, scale should be back to default (1)
    expect(useComposerStore.getState().object.scale).toBe(1);
    expect(useComposerStore.getState().isDirty).toBe(false);
  });

  it('should display preset info', () => {
    render(<PresetSelector />);

    // Tags showing preset details
    expect(screen.getByText('studio')).toBeInTheDocument();
    expect(screen.getByText('FOV 45°')).toBeInTheDocument();
    expect(screen.getByText('Scale 1x')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PresetSelector className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });
});
