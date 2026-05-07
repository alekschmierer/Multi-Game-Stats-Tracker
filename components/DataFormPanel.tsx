"use client";
import GameForm from "@/components/GameNameForm";
import { useState } from "react";
type DataFormPanelProps = {
    displayName: string;
    setDisplayName: (name: string) => void;
    cocFormAction: any;
    cocState: any;
    crFormAction: any;
    crState: any;
    lolFormAction: any;
    lolState: any;
    className?: string;
  };

  export default function DataFormPanel({
  displayName,
  setDisplayName,
  cocFormAction,
  cocState,
  crFormAction,
  crState,
  lolFormAction,
  lolState,
  className = "",
}: DataFormPanelProps) {

  return (
    <div className={`w-full shrink-0 ${className}`}>
      <div className="h-full space-y-4 p-4 border border-border rounded-xl bg-card/50 flex flex-col">

        {/* Display Name */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
            Display Name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            className="border border-border/40 bg-background/50 p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-foreground/20 italic"
          />
        </div>

        {/* Game Forms */}
        <div className="space-y-4 flex-1">

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
              Clash of Clans
            </span>
            <GameForm action={cocFormAction} state={cocState} placeholder="Tag" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
              Clash Royale
            </span>
            <GameForm action={crFormAction} state={crState} placeholder="Tag" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
              League of Legends
            </span>
            <GameForm action={lolFormAction} state={lolState} placeholder="Name#Tag" />
          </div>

        </div>

      </div>
    </div>
  );
}