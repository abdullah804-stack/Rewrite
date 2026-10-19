"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-surface-base rounded-xl shadow-2xl border border-surface-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command 
              className="w-full"
              loop
            >
              <div className="flex items-center px-4 border-b border-surface-border">
                <svg className="w-4 h-4 text-text-secondary mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <Command.Input 
                  autoFocus
                  placeholder="Type a command or search..." 
                  className="w-full h-12 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
                />
                <div className="text-[10px] text-text-secondary border border-surface-border px-1.5 py-0.5 rounded font-mono shrink-0">
                  esc
                </div>
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="text-sm text-text-secondary p-4 text-center">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigate" className="text-xs font-medium text-text-secondary px-2 py-1.5">
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/quick"))}
                    className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Quick rewrite
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/workspace"))}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    Workspace
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/tools"))}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Free tools
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/profiles"))}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    Voice profiles
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/dashboard"))}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    Dashboard
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push("/settings"))}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-text-primary rounded-lg cursor-pointer aria-selected:bg-surface-raised"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Settings
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}