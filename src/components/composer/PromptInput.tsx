'use client';

import * as Tabs from '@radix-ui/react-tabs';
import * as Label from '@radix-ui/react-label';
import { useComposerStore } from '@/stores/composer-store';
import type { PromptMode } from '@/stores/composer-store';

// ============================================================================
// Types
// ============================================================================

export interface PromptInputProps {
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PromptInput({ className = '' }: PromptInputProps) {
  const prompt = useComposerStore((state) => state.prompt);
  const setPromptMode = useComposerStore((state) => state.setPromptMode);
  const setSinglePrompt = useComposerStore((state) => state.setSinglePrompt);
  const setObjectPrompt = useComposerStore((state) => state.setObjectPrompt);
  const setBackgroundPrompt = useComposerStore(
    (state) => state.setBackgroundPrompt
  );

  const handleModeChange = (value: string) => {
    setPromptMode(value as PromptMode);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs.Root
        value={prompt.mode}
        onValueChange={handleModeChange}
        className="w-full"
      >
        <Tabs.List className="flex gap-1 p-1 bg-neutral-800 rounded-lg mb-4">
          <Tabs.Trigger
            value="single"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 hover:text-neutral-200"
          >
            Single Prompt
          </Tabs.Trigger>
          <Tabs.Trigger
            value="split"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 hover:text-neutral-200"
          >
            Split Prompts
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="single" className="space-y-3">
          <div className="space-y-2">
            <Label.Root
              htmlFor="single-prompt"
              className="text-sm font-medium text-neutral-300"
            >
              Scene Description
            </Label.Root>
            <textarea
              id="single-prompt"
              value={prompt.single}
              onChange={(e) => setSinglePrompt(e.target.value)}
              placeholder="Describe your scene... e.g., 'crystal dragon on misty mountain'"
              className="w-full h-24 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-neutral-500">
              AI will automatically decompose this into object and background
              prompts.
            </p>
          </div>
        </Tabs.Content>

        <Tabs.Content value="split" className="space-y-4">
          <div className="space-y-2">
            <Label.Root
              htmlFor="object-prompt"
              className="text-sm font-medium text-neutral-300"
            >
              3D Object
            </Label.Root>
            <textarea
              id="object-prompt"
              value={prompt.object}
              onChange={(e) => setObjectPrompt(e.target.value)}
              placeholder="Describe the 3D object... e.g., 'low-poly golden trophy'"
              className="w-full h-20 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label.Root
              htmlFor="background-prompt"
              className="text-sm font-medium text-neutral-300"
            >
              Background
            </Label.Root>
            <textarea
              id="background-prompt"
              value={prompt.background}
              onChange={(e) => setBackgroundPrompt(e.target.value)}
              placeholder="Describe the background... e.g., 'solid dark blue gradient'"
              className="w-full h-20 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <p className="text-xs text-neutral-500">
            Split mode sends prompts directly to generation APIs without AI
            decomposition.
          </p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
