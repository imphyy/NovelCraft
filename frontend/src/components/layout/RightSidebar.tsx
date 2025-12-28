import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, History, StickyNote, Link } from 'lucide-react';
import { AskAI } from '../AskAI';
import { Rewrite } from '../Rewrite';
import type { RewriteTool } from '@/types/ai';

interface RightSidebarProps {
  panel?: ReactNode;
  projectId?: string;
  selectedText?: string;
  onRewrite?: (tool: RewriteTool) => void;
}

export function RightSidebar({ panel, projectId, selectedText = '', onRewrite }: RightSidebarProps) {
  if (panel) {
    return (
      <aside className="flex flex-col h-full bg-muted/30 overflow-y-auto border-l border-border/10 font-sans">
        {panel}
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-muted/30 border-l border-border/10 font-sans">
      <Tabs defaultValue="ask" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-4 bg-transparent rounded-none border-b border-border/10 h-10">
          <TabsTrigger 
            value="ask" 
            title="Ask AI"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary/40 rounded-none border-r border-border/10 last:border-r-0 h-full text-muted-foreground/40 transition-all scale-90"
          >
            <Sparkles className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="rewrite" 
            title="Rewrite"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary/40 rounded-none border-r border-border/10 last:border-r-0 h-full text-muted-foreground/40 transition-all scale-90"
          >
            <History className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            title="Notes"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary/40 rounded-none border-r border-border/10 last:border-r-0 h-full text-muted-foreground/40 transition-all scale-90"
          >
            <StickyNote className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="citations" 
            title="Citations"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary/40 rounded-none border-r border-border/10 last:border-r-0 h-full text-muted-foreground/40 transition-all scale-90"
          >
            <Link className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="ask" className="mt-0 focus-visible:outline-none">
            {projectId ? (
              <AskAI projectId={projectId} />
            ) : (
              <div>
                <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground/50 uppercase tracking-widest">Ask the novel...</h3>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">Open a project to use AI features.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="rewrite" className="mt-0 focus-visible:outline-none">
            <Rewrite
              selectedText={selectedText}
              onRewrite={(tool) => onRewrite?.(tool)}
            />
          </TabsContent>
          <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
            <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground/50 uppercase tracking-widest">Notes</h3>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">Quick notes and ideas placeholder.</p>
          </TabsContent>
          <TabsContent value="citations" className="mt-0 focus-visible:outline-none">
            <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground/50 uppercase tracking-widest">Citations & Mentions</h3>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">References placeholder.</p>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
