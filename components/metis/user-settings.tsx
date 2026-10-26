'use client';

import { useState } from 'react';
import { ArrowLeft, BookOpen, Search, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveUserPreferences } from '@/hooks/use-user-preferences';
import type { UserPreferences } from '@/lib/metis/user-preferences';
import skills from '@/lib/metis/reference-skills.json';
import styles from './user-settings.module.css';

function GeneralSettings({ preferences, connected, model }: { preferences: UserPreferences; connected: boolean; model: string }) {
  const [draft, setDraft] = useState(preferences);
  const changed = draft.fullName.trim() !== preferences.fullName || draft.defaultPanel !== preferences.defaultPanel;
  return <form className={styles.general} onSubmit={event => {
    event.preventDefault();
    if (!draft.fullName.trim()) return;
    try {
      saveUserPreferences({ ...draft, fullName: draft.fullName.trim() });
      toast.success('Settings saved');
    } catch { toast.error('Could not save settings in this browser. Please try again.'); }
  }}>
    <h2 className={styles.pageTitle}>General</h2>
    <section className={styles.section}>
      <h3>Profile</h3>
      <div className={styles.field}><Label htmlFor="settings-full-name">Full name</Label><Input id="settings-full-name" autoComplete="name" maxLength={80} required value={draft.fullName} onChange={event => setDraft({ ...draft, fullName: event.target.value })}/></div>
    </section>
    <section className={styles.section}>
      <h3>Workspace</h3>
      <div className={styles.field}><Label id="default-panel-label">Default side panel</Label><p>Shown when you open an experiment with a preview.</p>
        <Tabs value={draft.defaultPanel} onValueChange={value => setDraft({ ...draft, defaultPanel: value as UserPreferences['defaultPanel'] })}><TabsList className={styles.panelChoices} aria-labelledby="default-panel-label"><TabsTrigger value="conversation">Conversation</TabsTrigger><TabsTrigger value="prototype">Variants</TabsTrigger></TabsList></Tabs>
      </div>
    </section>
    <section className={styles.section}>
      <h3>AI connection</h3>
      <div className={styles.status}><span className={connected ? styles.liveDot : styles.demoDot}/><span>{connected ? model : 'Demo mode'}</span></div>
      <p>{connected ? 'Uses the AI connection configured for this workspace.' : 'Conversations use sample responses. No AI connection is required.'}</p>
    </section>
    <footer className={styles.save}><p>Settings and analysis history are saved in this browser.</p><Button type="submit" disabled={!changed || !draft.fullName.trim()}>Save changes</Button></footer>
  </form>;
}

function SkillsSettings() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = skills.find(skill => skill.id === selectedId);
  const filtered = skills.filter(skill => `${skill.name} ${skill.purpose}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (selected) return <div className={styles.skillReading}>
    <Button variant="ghost" className={styles.backButton} onClick={() => setSelectedId(null)}><ArrowLeft/>Skills</Button>
    <article className={styles.skillDetail} aria-label={selected.name}>
      <header><h3>{selected.name}</h3><p>{selected.purpose}</p><span>{selected.owner} · {selected.updated}</span></header>
      <div className={styles.markdown}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children }) => href?.startsWith('https://') || href?.startsWith('http://') ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <span title={href}>{children}</span>,
        img: ({ alt }) => <span>{alt}</span>,
      }}>{selected.body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')}</ReactMarkdown></div>
    </article>
  </div>;
  return <div className={styles.skills}>
    <h2 className={styles.pageTitle}>Skills</h2>
    <div className={styles.search}><Search size={16}/><Input aria-label="Search skills" placeholder="Search skills…" value={query} onChange={event => setQuery(event.target.value)}/></div>
    <div className={styles.skillList} aria-label="Skills">
      {filtered.map(skill => <button key={skill.id} type="button" onClick={() => setSelectedId(skill.id)}><strong>{skill.name}</strong><small>{skill.purpose}</small></button>)}
      {!filtered.length && <p className={styles.empty}>No skills match “{query}”.</p>}
    </div>
  </div>;
}

export function UserSettings({ preferences, connected, model }: { preferences: UserPreferences; connected: boolean; model: string }) {
  const [open, setOpen] = useState(false);
  const initials = preferences.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" className={styles.accountButton} aria-label={`${preferences.fullName} — Settings`}><span>{preferences.fullName}</span><span className={styles.avatar}>{initials}</span></Button></DialogTrigger>
    <DialogContent className={styles.dialog}>
      {open && <Tabs defaultValue="general" orientation="vertical" className={styles.settingsTabs}>
        <aside className={styles.sidebar}>
          <DialogHeader className={styles.header}><DialogTitle>Settings</DialogTitle><DialogDescription className="sr-only">Manage your profile, workspace preferences and skills.</DialogDescription></DialogHeader>
          <TabsList className={styles.navigation} aria-label="Settings sections"><TabsTrigger value="general"><UserRound/>General</TabsTrigger><TabsTrigger value="skills"><BookOpen/>Skills</TabsTrigger></TabsList>
        </aside>
        <TabsContent value="general" className={styles.tabContent}><GeneralSettings preferences={preferences} connected={connected} model={model}/></TabsContent>
        <TabsContent value="skills" className={styles.tabContent}><SkillsSettings/></TabsContent>
      </Tabs>}
    </DialogContent>
  </Dialog>;
}
