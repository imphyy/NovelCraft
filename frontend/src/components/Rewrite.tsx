import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { REWRITE_TOOLS } from '@/types/ai';
import type { RewriteTool } from '@/types/ai';

interface RewriteProps {
  selectedText: string;
  onRewrite: (tool: RewriteTool) => void;
}

export function Rewrite({ selectedText, onRewrite }: RewriteProps) {
  if (!selectedText) {
    return (
      <div>
        <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground/50 uppercase tracking-widest">AI Rewrite Tools</h3>
        <p className="text-xs text-muted-foreground/70 leading-relaxed mb-4">
          Select text in the editor, then choose a rewrite tool below.
        </p>

        <div className="space-y-2">
          {REWRITE_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="px-3 py-2.5 bg-muted/5 border border-border/20 rounded-sm opacity-50"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{tool.icon}</span>
                <span className="text-xs font-medium text-foreground/80">
                  {tool.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[10px] font-semibold mb-3 text-muted-foreground/50 uppercase tracking-widest">Rewrite Selected Text</h3>
      <p className="text-xs text-muted-foreground/70 leading-relaxed mb-3">
        {selectedText.length} characters selected
      </p>

      <div className="mb-4">
        <div className="p-2.5 bg-muted/10 border border-border/20 rounded-sm text-[11px] max-h-32 overflow-y-auto">
          <p className="text-foreground/80 whitespace-pre-wrap">
            "{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}"
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {REWRITE_TOOLS.map((tool) => (
          <Button
            key={tool.id}
            onClick={() => onRewrite(tool.id)}
            variant="outline"
            className="justify-start h-auto py-2.5 w-full hover:border-primary/40 hover:bg-muted/10 transition-all"
          >
            <div className="text-left w-full">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{tool.icon}</span>
                <span className="font-medium text-xs">{tool.label}</span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                {tool.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
