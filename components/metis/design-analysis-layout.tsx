'use client';

import { useState, type ReactNode } from 'react';
import { Add24Regular, List24Regular, ShieldTask24Regular, Mic24Regular, DeviceEq24Regular, Home24Filled, Search24Regular, Library24Regular, ChevronUpDown24Regular, ChatHintHalf24Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignVector } from './design-vector';
import type { WorkspacePanelTab } from './workspace-panel';
import styles from './design-analysis-layout.module.css';

// Figma's iOS-native glass/status components have no web implementation in this
// repository. The phone uses native HTML plus the mapped Fluent React icons.
function PreviewPhone({ children, label }: { children: ReactNode; label: string }) {
  return <div className={styles.phone} aria-label={label}>
    <div className={styles.rim}><div className={styles.edge}><div className={styles.bezel}><div className={styles.screen}>
      {children}
    </div></div></div></div>
    <i className={styles.actionKey}/><i className={styles.volumeUp}/><i className={styles.volumeDown}/><i className={styles.power}/>
  </div>;
}

function ControlScreen() {
  return <>
      <div className={styles.statusBar}><strong>9:41</strong><div className={styles.statusIcons}><span>▴▴▴</span><span>◔</span><i/></div></div>
      <div className={styles.toolbar}><span className={styles.glassIcon}><List24Regular/></span><div className={styles.phoneSegment}><span>Chat</span><span>Cowork</span></div><span className={styles.shield}><ShieldTask24Regular/></span></div>
      <div className={styles.greeting}>Elvia, how’s it going?</div>
      <div className={styles.suggestions}>{['Plan my day', 'Search in my org', 'Triage my inbox'].map(text => <Button key={text} variant="secondary" tabIndex={-1} aria-disabled="true">{text}</Button>)}</div>
      <div className={styles.phoneComposer}><Add24Regular/><span>Message Copilot</span><Mic24Regular/><i><DeviceEq24Regular/></i></div>
      <div className={styles.phoneNav}><div className={styles.navPill}><span><Home24Filled/>Home</span><span><Search24Regular/>Search</span><span><Library24Regular/>Library</span><span><ChevronUpDown24Regular/>More</span></div><div className={styles.chatIcon}><ChatHintHalf24Regular/></div></div>
  </>;
}

function VariantsPreview() {
  const [variant, setVariant] = useState('control');
  return <div className={styles.variantContent}>
    <Tabs value={variant} onValueChange={setVariant}><TabsList className={styles.variantTabs} aria-label="Experiment variant"><TabsTrigger value="control">Control</TabsTrigger><TabsTrigger value="treatment">Treatment</TabsTrigger></TabsList></Tabs>
    <div className={styles.previewStage}><PreviewPhone label={`${variant === 'control' ? 'Control' : 'Treatment'} variant preview`}>{variant === 'control' ? <ControlScreen/> : <iframe className={styles.treatmentScreen} src="/demos/copilot-ios/screen.html?variant=treatment" title="Copilot iOS — Treatment" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer"/>}</PreviewPhone></div>
  </div>;
}

export function DesignAnalysisLayout({ children, composer, conversation, open, activeTab, narrow, onOpenChange, onTabChange }: {
  children: ReactNode; composer: ReactNode; conversation: ReactNode; open: boolean; activeTab: WorkspacePanelTab; narrow: boolean;
  onOpenChange: (open: boolean) => void; onTabChange: (tab: WorkspacePanelTab) => void;
}) {
  return <div className={styles.viewport} data-design-analysis>
    <div className={styles.layout} data-open={open} data-narrow={narrow}>
      <main className={styles.report} inert={narrow && open || undefined} aria-hidden={narrow && open || undefined}>{children}{composer}</main>
      {!open && <Button id="toggle-workspace-panel" variant="ghost" className={styles.expand} aria-label="Expand workspace panel" onClick={() => onOpenChange(true)}><DesignVector file="13307"/></Button>}
      {open && <aside id="experiment-workspace-panel" className={styles.aside} aria-label="Experiment workspace">
        <div className={styles.panel} data-tab={activeTab}>
          <div className={styles.panelHeader}><Tabs value={activeTab} onValueChange={value => onTabChange(value as WorkspacePanelTab)}><TabsList variant="line" className={styles.workspaceTabs} aria-label="Workspace panel"><TabsTrigger value="conversation">Conversation</TabsTrigger><TabsTrigger value="prototype">Variants</TabsTrigger></TabsList></Tabs><Button variant="ghost" className={styles.collapse} aria-label="Collapse workspace panel" onClick={() => onOpenChange(false)}><DesignVector file="13307"/></Button><div className={styles.headerLine}><DesignVector file="4e717" fit/></div></div>
          {activeTab === 'prototype' ? <VariantsPreview/> : <div className={styles.conversation}>{conversation}</div>}
        </div>
      </aside>}
    </div>
  </div>;
}
