'use client';

import { ChevronDown } from 'lucide-react';
import { PromptInputAction } from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { analysisModes, isAnalysisMode, type AnalysisMode } from '@/lib/metis/analysis-modes';

export function AnalysisModeSelect({ value, onChange, disabled = false }: {
  value: AnalysisMode;
  onChange: (value: AnalysisMode) => void;
  disabled?: boolean;
}) {
  const selected = analysisModes.find(mode => mode.id === value)!;
  return <DropdownMenu>
    <PromptInputAction tooltip="Analysis mode">
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} aria-label={`Analysis mode: ${selected.label}`}>
          {selected.label}<ChevronDown/>
        </Button>
      </DropdownMenuTrigger>
    </PromptInputAction>
    <DropdownMenuContent align="start" side="top" onClick={event => event.stopPropagation()}>
      <DropdownMenuRadioGroup value={value} onValueChange={mode => { if (isAnalysisMode(mode)) onChange(mode); }}>
        {analysisModes.map(mode => <DropdownMenuRadioItem key={mode.id} value={mode.id}>{mode.label}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
