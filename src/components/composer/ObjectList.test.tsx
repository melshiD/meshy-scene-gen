import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ObjectList } from './ObjectList';
import { useComposerStore, MAX_OBJECTS } from '@/stores/composer-store';

describe('ObjectList', () => {
  beforeEach(() => {
    useComposerStore.getState().reset();
  });

  it('should render header with object count', () => {
    render(<ObjectList />);
    expect(screen.getByText(`Objects (1/${MAX_OBJECTS})`)).toBeInTheDocument();
  });

  it('should render Add button', () => {
    render(<ObjectList />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should render the default object', () => {
    render(<ObjectList />);
    expect(screen.getByText('Object 1')).toBeInTheDocument();
  });

  it('should add object when Add button is clicked', () => {
    render(<ObjectList />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Object 2')).toBeInTheDocument();
    expect(screen.getByText(`Objects (2/${MAX_OBJECTS})`)).toBeInTheDocument();
  });

  it('should select object when clicked', () => {
    // Add a second object
    useComposerStore.getState().addObject('Second Object');

    render(<ObjectList />);

    // Click on first object
    const firstObject = screen.getByText('Object 1');
    fireEvent.click(firstObject.closest('[role="button"]')!);

    expect(useComposerStore.getState().selectedObjectId).toBe(
      useComposerStore.getState().objects[0].id
    );
  });

  it('should disable Add button when at max objects', () => {
    // Add max objects
    for (let i = 0; i < MAX_OBJECTS - 1; i++) {
      useComposerStore.getState().addObject();
    }

    render(<ObjectList />);

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should show mesh status', () => {
    render(<ObjectList />);
    expect(screen.getByText('No mesh')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ObjectList className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  describe('object actions', () => {
    beforeEach(() => {
      useComposerStore.getState().addObject('Second Object');
    });

    it('should delete object when delete button is clicked', () => {
      render(<ObjectList />);

      // Hover over first object to reveal action buttons
      const firstObjectItem = screen.getByText('Object 1').closest('[role="button"]')!;
      fireEvent.mouseEnter(firstObjectItem);

      // Find delete button (title="Delete")
      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(useComposerStore.getState().objects.length).toBe(1);
      expect(screen.queryByText('Object 1')).not.toBeInTheDocument();
    });

    it('should duplicate object when duplicate button is clicked', () => {
      render(<ObjectList />);

      // Get initial count
      const initialCount = useComposerStore.getState().objects.length;

      // Click duplicate on first object
      const duplicateButtons = screen.getAllByTitle('Duplicate');
      fireEvent.click(duplicateButtons[0]);

      expect(useComposerStore.getState().objects.length).toBe(initialCount + 1);
      expect(screen.getByText('Object 1 (copy)')).toBeInTheDocument();
    });

    it('should toggle visibility when eye button is clicked', () => {
      render(<ObjectList />);

      const firstObjectId = useComposerStore.getState().objects[0].id;
      expect(useComposerStore.getState().objects[0].visible).toBe(true);

      // Click hide button
      const hideButtons = screen.getAllByTitle('Hide');
      fireEvent.click(hideButtons[0]);

      expect(
        useComposerStore.getState().objects.find(o => o.id === firstObjectId)?.visible
      ).toBe(false);
    });

    it('should toggle lock when lock button is clicked', () => {
      render(<ObjectList />);

      const firstObjectId = useComposerStore.getState().objects[0].id;
      expect(useComposerStore.getState().objects[0].locked).toBe(false);

      // Click lock button
      const lockButtons = screen.getAllByTitle('Lock');
      fireEvent.click(lockButtons[0]);

      expect(
        useComposerStore.getState().objects.find(o => o.id === firstObjectId)?.locked
      ).toBe(true);
    });
  });

  describe('selection highlight', () => {
    it('should highlight selected object', () => {
      useComposerStore.getState().addObject('Second Object');
      render(<ObjectList />);

      // First object should be selected by default (it was reselected when we added second)
      // Actually the second one is selected after adding
      const state = useComposerStore.getState();
      const selectedObject = state.objects.find(o => o.id === state.selectedObjectId);

      // Look for the selected object's container
      const selectedItem = screen.getByText(selectedObject!.name).closest('[role="button"]');
      expect(selectedItem).toHaveClass('bg-indigo-500/20');
    });
  });
});
