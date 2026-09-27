'use client';

import { Check, FileSpreadsheet, Folder, Hash, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { experimentOptions, scorecardsForGroup, selectedExperiment, selectedScorecard } from '@/lib/metis/experiment-catalog';

function experimentLabel(value: string) {
  if (!value) return 'Select experiment';
  const selected = selectedExperiment(value);
  if (selected) return selected.name;
  try { const url = new URL(value); return url.host + url.pathname; }
  catch { return value; }
}

export function ExperimentSelector({ value, onChange, open, onOpenChange, groupName, groupExperimentUrls = [] }: {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName?: string;
  groupExperimentUrls?: string[];
}) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const search = query.trim();
  const catalog = groupName ? scorecardsForGroup(groupName, groupExperimentUrls) : experimentOptions;
  const options = catalog.filter(option => `${option.name} ${option.id} ${option.group} ${option.url}`.toLowerCase().includes(search.toLowerCase()));
  const selected = groupName ? selectedScorecard(value, groupName, groupExperimentUrls) : selectedExperiment(value);
  const placeholder = groupName ? 'Search scorecards or paste ID…' : 'Search experiments or paste ID…';
  const isUrl = /^https?:\/\//i.test(search);
  const selectionLabel = groupName ? selected ? `${groupName} / ${selected.name}` : groupName : experimentLabel(value);

  function select(url: string) {
    onChange(url);
    onOpenChange(false);
    setError('');
    setQuery('');
  }

  function useIdentifier() {
    const match = groupName ? selectedScorecard(search, groupName, groupExperimentUrls) : selectedExperiment(search);
    if (match) { select(match.url); return; }
    if (groupName) { setError('No scorecard with this ID in this experiment group.'); return; }
    if (!isUrl) { setError('No experiment found for this ID.'); return; }
    try {
      const url = new URL(search);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      select(search);
    } catch { setError('Enter a valid experiment ID.'); }
  }

  return <div className="mx-3 -mb-4 rounded-t-2xl bg-muted pb-4" data-testid="experiment-context-bar">
    <Popover open={open} onOpenChange={next => { onOpenChange(next); if (next) { setQuery(''); setError(''); } }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="h-11 w-full justify-start gap-2 rounded-t-2xl rounded-b-none px-4 font-normal" aria-label={groupName ? `${selected ? 'Change' : 'Select'} scorecard in ${groupName}${selected ? `: ${selected.name}` : ''}` : value ? `Change experiment: ${experimentLabel(value)}` : 'Select experiment'} title={selectionLabel}>
          <Folder/><span className="flex min-w-0 flex-1 items-center gap-2">{groupName ? <><span className={selected ? 'max-w-[40%] truncate text-muted-foreground' : 'truncate'}>{groupName}</span>{selected && <><span aria-hidden="true" className="text-muted-foreground">/</span><span className="min-w-0 truncate" data-testid="selected-scorecard">{selected.name}</span></>}</> : <span className="truncate">{experimentLabel(value)}</span>}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} collisionPadding={16} className="w-96 max-w-[calc(100vw-2rem)] p-0" aria-label={groupName ? 'Choose a scorecard' : 'Choose an experiment'}>
        <Command shouldFilter={false}>
          <CommandInput aria-label={placeholder.replace('…', '')} placeholder={placeholder} value={query} onValueChange={next => { setQuery(next); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'experiment-picker-error' : undefined}/>
          <CommandList>
            {options.length > 0 && <CommandGroup heading={groupName ? 'Scorecards' : 'Your experiments'}>
              {options.map(option => <CommandItem key={option.url} value={option.url} onSelect={() => select(option.url)}>
                {groupName ? <FileSpreadsheet/> : <Folder/>}<span className="min-w-0 flex-1 truncate">{option.name}</span>{selected?.url === option.url && <Check aria-label="Selected"/>}
              </CommandItem>)}
            </CommandGroup>}
            {!search && options.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No scorecards in this experiment group yet.</p>}
            {search && <>
              {options.length > 0 && <CommandSeparator/>}
              <CommandGroup>
                <CommandItem value="use-identifier" onSelect={useIdentifier}>
                  {isUrl ? <Link2/> : <Hash/>}<div className="min-w-0 flex-1"><p>{isUrl ? 'Use this URL' : 'Use this ID'}</p><p className="truncate text-xs text-muted-foreground">{search}</p></div>
                </CommandItem>
              </CommandGroup>
            </>}
          </CommandList>
          {error && <p id="experiment-picker-error" role="alert" className="px-3 pb-3 text-sm text-destructive">{error}</p>}
        </Command>
      </PopoverContent>
    </Popover>
  </div>;
}
