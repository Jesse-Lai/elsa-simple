'use client';
import { ChevronRight, Plus, PanelLeftClose, FolderOpen, Library, SquarePen } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarSeparator, useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getDataset } from '@/lib/metis/datasets';
import { reportReadout } from '@/lib/metis/report-copy';
import type { AnalysisBranch } from '@/lib/metis/types';

export function Navigation({ selectedBranchId, branches, selectBranch, home, newConversation, libraryActive, openLibrary }: { selectedBranchId?: string; branches: AnalysisBranch[]; selectBranch: (id: string)=>void; home: ()=>void; newConversation: (groupName: string)=>void; libraryActive: boolean; openLibrary: ()=>void }) {
  const { toggleSidebar, setOpenMobile, isMobile } = useSidebar();
  const conversations = branches.filter(b => !b.parentId).map(b => {
    const data = getDataset(b.experimentId);
    const artifact = b.artifacts.filter(a => a.kind === 'report').at(-1);
    const config = artifact?.config ?? b.runs.find(run => run.id === artifact?.runId)?.config ?? b.config;
    const name = data.caseStudy?.id === 'bebop-5pct' ? 'bebop analysis' : data.caseStudy
      ? artifact?.origin === 'ai' ? artifact.report?.headline ?? data.caseStudy.headline : data.caseStudy.headline
      : artifact?.report ? reportReadout(artifact.report, data, config, artifact.origin).headline : b.name;
    return {...b, groupName: b.groupName ?? data.experiment.group, name};
  });
  const groupNames = [...new Set(conversations.map(b => b.groupName))];
  const groups = groupNames.map(name => ({name, conversations: conversations.filter(b => b.groupName === name)}));
  return <Sidebar collapsible={isMobile ? 'offcanvas' : 'none'} className="h-full w-full min-w-0">
    <SidebarHeader className="gap-5 px-4 pt-0 pb-6">
      <div className="flex h-14 shrink-0 items-center justify-between"><Button variant="ghost" className="px-0" onClick={home} aria-label="ELSA home"><span className="text-2xl font-semibold tracking-tight">ELSA</span></Button><Button size="icon-sm" variant="ghost" onClick={toggleSidebar} aria-label="Collapse navigation"><PanelLeftClose/></Button></div>
      <Button onClick={()=>{home();setOpenMobile(false);}} variant="outline" className="w-full max-w-60 self-start"><Plus aria-hidden="true"/><span className="leading-none">New experiment</span></Button>
    </SidebarHeader>
    <SidebarContent className="gap-2"><SidebarGroup className="px-2 py-0"><SidebarMenu><SidebarMenuItem>
      <SidebarMenuButton isActive={libraryActive} aria-current={libraryActive ? 'page' : undefined} onClick={()=>{openLibrary();setOpenMobile(false);}} className="h-9 bg-transparent hover:bg-transparent active:bg-transparent data-[active=true]:bg-sidebar-accent"><Library className="-translate-x-0.5"/><span>Experiment library</span></SidebarMenuButton>
    </SidebarMenuItem></SidebarMenu></SidebarGroup><SidebarGroup><SidebarGroupLabel>Analyses</SidebarGroupLabel>
      <SidebarMenu>{groups.map(group => <Collapsible key={group.name} defaultOpen className="group/experiment-group" asChild>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild><SidebarMenuButton title={group.name}><ChevronRight className="group-data-[state=open]/experiment-group:rotate-90"/><FolderOpen/><span>{group.name}</span></SidebarMenuButton></CollapsibleTrigger>
          <SidebarMenuAction showOnHover aria-label={`New conversation in ${group.name}`} title="New conversation" onClick={()=>{newConversation(group.name);setOpenMobile(false);}}><SquarePen/></SidebarMenuAction>
          <CollapsibleContent><SidebarMenuSub>{group.conversations.map(conversation => <SidebarMenuSubItem key={conversation.id} className="min-w-0">
            <SidebarMenuSubButton asChild className="w-full" isActive={selectedBranchId === conversation.id}>
              <button aria-current={selectedBranchId === conversation.id ? 'page' : undefined} title={conversation.name} onClick={()=>{selectBranch(conversation.id);setOpenMobile(false);}}><span className="min-w-0 flex-1 truncate text-left">{conversation.name}</span></button>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>)}</SidebarMenuSub></CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>)}</SidebarMenu>
    </SidebarGroup></SidebarContent>
    <SidebarFooter className="p-4"><SidebarSeparator/><div className="flex items-center gap-3 py-2"><Avatar><AvatarFallback>JL</AvatarFallback></Avatar><div className="min-w-0"><p className="text-sm font-medium">Jesse Lai</p><p className="text-xs text-muted-foreground">Local workspace</p></div></div></SidebarFooter>
  </Sidebar>;
}
