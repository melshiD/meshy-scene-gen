'use client';

import { useComposerStore, MAX_OBJECTS } from '@/stores/composer-store';
import type { SceneObject } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ObjectListProps {
  className?: string;
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 4h9M5.5 4V2.5a1 1 0 011-1h1a1 1 0 011 1V4M11 4v7.5a1 1 0 01-1 1H4a1 1 0 01-1-1V4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4.5"
        y="4.5"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2L17 6v8l-7 4-7-4V6l7-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 10v8M10 10l7-4M10 10L3 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2l10 10M5.5 5.5A2 2 0 008.5 8.5M1 7s2.5-4 6-4c.7 0 1.4.15 2 .4M13 7s-1.2 2-3.5 3.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="6"
          width="9"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M4.5 6V4.5a2.5 2.5 0 015 0V6"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2.5"
        y="6"
        width="9"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M4.5 6V4.5a2.5 2.5 0 015 0"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// Object List Item
// ============================================================================

interface ObjectListItemProps {
  object: SceneObject;
  isSelected: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

function ObjectListItem({
  object,
  isSelected,
  canDelete,
  canDuplicate,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onToggleLock,
}: ObjectListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`
        group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${isSelected
          ? 'bg-indigo-500/20 border border-indigo-500/50'
          : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800 hover:border-neutral-700'
        }
      `}
    >
      {/* Icon / Thumbnail */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center
          ${isSelected ? 'bg-indigo-500/30 text-indigo-400' : 'bg-neutral-700 text-neutral-400'}
          ${!object.visible ? 'opacity-50' : ''}
        `}
      >
        <CubeIcon />
      </div>

      {/* Name and status */}
      <div className={`flex-1 min-w-0 ${!object.visible ? 'opacity-50' : ''}`}>
        <div className="text-sm font-medium text-white truncate">
          {object.name}
        </div>
        <div className="text-xs text-neutral-500 truncate">
          {object.meshUrl ? 'Mesh loaded' : 'No mesh'}
          {object.status && object.status !== 'completed' && ` • ${object.status}`}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={`
            p-1.5 rounded hover:bg-neutral-700 transition-colors
            ${object.visible ? 'text-neutral-400' : 'text-neutral-600'}
          `}
          title={object.visible ? 'Hide' : 'Show'}
        >
          <EyeIcon visible={object.visible} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={`
            p-1.5 rounded hover:bg-neutral-700 transition-colors
            ${object.locked ? 'text-amber-500' : 'text-neutral-400'}
          `}
          title={object.locked ? 'Unlock' : 'Lock'}
        >
          <LockIcon locked={object.locked} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          disabled={!canDuplicate}
          className="p-1.5 rounded text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Duplicate"
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={!canDelete}
          className="p-1.5 rounded text-neutral-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ObjectList({ className = '' }: ObjectListProps) {
  const objects = useComposerStore((state) => state.objects);
  const selectedObjectId = useComposerStore((state) => state.selectedObjectId);
  const addObject = useComposerStore((state) => state.addObject);
  const removeObject = useComposerStore((state) => state.removeObject);
  const duplicateObject = useComposerStore((state) => state.duplicateObject);
  const selectObject = useComposerStore((state) => state.selectObject);
  const updateObject = useComposerStore((state) => state.updateObject);

  const canAddObject = objects.length < MAX_OBJECTS;
  const canDeleteObject = objects.length > 1;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Objects ({objects.length}/{MAX_OBJECTS})
        </h3>
        <button
          type="button"
          onClick={() => addObject()}
          disabled={!canAddObject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <PlusIcon />
          Add
        </button>
      </div>

      {/* Object List */}
      <div className="space-y-2">
        {objects.map((object) => (
          <ObjectListItem
            key={object.id}
            object={object}
            isSelected={object.id === selectedObjectId}
            canDelete={canDeleteObject}
            canDuplicate={canAddObject}
            onSelect={() => selectObject(object.id)}
            onDelete={() => removeObject(object.id)}
            onDuplicate={() => duplicateObject(object.id)}
            onToggleVisibility={() =>
              updateObject(object.id, { visible: !object.visible })
            }
            onToggleLock={() =>
              updateObject(object.id, { locked: !object.locked })
            }
          />
        ))}
      </div>

      {/* Help text */}
      {objects.length === 0 && (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No objects in scene. Click &quot;Add&quot; to create one.
        </div>
      )}
    </div>
  );
}
