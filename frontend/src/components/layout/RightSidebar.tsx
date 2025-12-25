import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, History, StickyNote, Link } from 'lucide-react';

interface RightSidebarProps {
  panel?: ReactNode;
}

export function RightSidebar({ panel }: RightSidebarProps) {
  if (panel) {
    return (
      <aside className="flex flex-col h-full bg-card/40 overflow-y-auto">
        {panel}
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-card/40">
      <Tabs defaultValue="ask" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-4 bg-muted/30 rounded-none border-b border-border/50 h-12">
          <TabsTrigger 
            value="ask" 
            title="Ask AI"
            className="data-[state=active]:bg-card data-[state=active]:shadow-none rounded-none border-r border-border/30 last:border-r-0 h-full"
          >
            <Sparkles className="h-4 w-4 opacity-70" />
          </TabsTrigger>
          <TabsTrigger 
            value="rewrite" 
            title="Rewrite"
            className="data-[state=active]:bg-card data-[state=active]:shadow-none rounded-none border-r border-border/30 last:border-r-0 h-full"
          >
            <History className="h-4 w-4 opacity-70" />
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            title="Notes"
            className="data-[state=active]:bg-card data-[state=active]:shadow-none rounded-none border-r border-border/30 last:border-r-0 h-full"
          >
            <StickyNote className="h-4 w-4 opacity-70" />
          </TabsTrigger>
          <TabsTrigger 
            value="citations" 
            title="Citations"
            className="data-[state=active]:bg-card data-[state=active]:shadow-none rounded-none border-r border-border/30 last:border-r-0 h-full"
          >
            <Link className="h-4 w-4 opacity-70" />
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="ask" className="mt-0 focus-visible:outline-none">
            <h3 className="text-sm font-semibold mb-2 text-foreground/80">Ask the novel...</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">AI chat placeholder. Ask questions about your characters or plot.</p>
          </TabsContent>
          <TabsContent value="rewrite" className="mt-0 focus-visible:outline-none">
            <h3 className="text-sm font-semibold mb-2 text-foreground/80">AI Rewrite</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">Select text in the editor to see rewrite suggestions.</p>
          </TabsContent>
          <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
            <h3 className="text-sm font-semibold mb-2 text-foreground/80">Notes</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">Quick notes and ideas.</p>
          </TabsContent>
          <TabsContent value="citations" className="mt-0 focus-visible:outline-none">
            <h3 className="text-sm font-semibold mb-2 text-foreground/80">Citations & Mentions</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">References to wiki pages found in current context.</p>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
