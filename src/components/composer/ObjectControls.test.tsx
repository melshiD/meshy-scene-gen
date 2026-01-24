import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectControls } from './ObjectControls';
import { useComposerStore } from '@/stores/composer-store';

describe('ObjectControls', () => {
  beforeEach(() => {
    useComposerStore.getState().reset();
  });

  it('should render section title', () => {
    render(<ObjectControls />);
    expect(screen.getByText('Object Transform')).toBeInTheDocument();
  });

  it('should render position subsection', () => {
    render(<ObjectControls />);
    expect(screen.getByText('Position')).toBeInTheDocument();
  });

  it('should render scale subsection', () => {
    render(<ObjectControls />);
    expect(screen.getByText('Scale')).toBeInTheDocument();
  });

  it('should render rotation subsection', () => {
    render(<ObjectControls />);
    expect(screen.getByText('Rotation (radians)')).toBeInTheDocument();
  });

  it('should render scale control', () => {
    render(<ObjectControls />);
    expect(screen.getByText('Uniform Scale')).toBeInTheDocument();
  });

  it('should render rotation controls', () => {
    render(<ObjectControls />);
    expect(screen.getByText('X (Pitch)')).toBeInTheDocument();
    expect(screen.getByText('Y (Yaw)')).toBeInTheDocument();
    expect(screen.getByText('Z (Roll)')).toBeInTheDocument();
  });

  it('should display current scale value', () => {
    render(<ObjectControls />);

    // Default scale is 1.00
    expect(screen.getByText('1.00')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ObjectControls className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('should render sliders for each control', () => {
    render(<ObjectControls />);

    // Each control has a slider thumb
    const thumbs = screen.getAllByRole('slider');
    // Position (3) + Scale (1) + Rotation (3) = 7 sliders
    expect(thumbs.length).toBe(7);
  });
});
