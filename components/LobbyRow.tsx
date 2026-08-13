"use client";
import { useState, useActionState, useEffect, useRef } from "react";
import { getPlayerCOCData, getPlayerCRData, getPlayerRankedLoLData } from "../lib/actions";
import DataFormPanel from "./DataFormPanel";
import StatCard from "./StatCard";

interface LobbyRowProps {
  id?: string;
  displayName: string;
  data?: {
    coc?: any;
    cr?: any;
    lol?: any
  };
  onUpdate?: (id: string, newName: string, newData: any) => void;
  // Left undefined for your own account, which can't be removed from the lobby.
  onRemove?: (id: string) => void;
}

export default function LobbyRow({ id = "", displayName, data, onUpdate, onRemove }: LobbyRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localName, setLocalName] = useState(displayName);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const isFirstRender = useRef(true);

  const [cocState, cocFormAction] = useActionState(
    getPlayerCOCData, 
    data?.coc ? { data: data.coc, error: null, tag: "" } : (null as any)
  );
  const [crState, crFormAction] = useActionState(
    getPlayerCRData, 
    data?.cr ? { data: data.cr, error: null } : (null as any)
  );
  const [lolState, lolFormAction] = useActionState(
    getPlayerRankedLoLData, 
    data?.lol ? { data: data.lol, error: null } : (null as any)
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (onUpdate) {
      onUpdate(id, localName, {
        coc: cocState?.data,
        cr: crState?.data,
        lol: lolState?.data
      });
    }
  }, [localName, cocState, crState, lolState, id, onUpdate]);

  const hasData = !!cocState?.data || !!crState?.data || !!lolState?.data;
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden mb-4">
      <div className="flex items-stretch bg-card/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 min-w-0 flex justify-between items-center p-4 hover:bg-card/40 transition-colors"
        >
          <div className="text-left font-bold truncate">{localName}</div>
          <div className={`shrink-0 ml-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>

        {/* Two steps, so a stray click can't wipe tags you just typed */}
        {onRemove && (
          confirmingRemove ? (
            <div className="flex items-center gap-2 pr-4 pl-2">
              <button
                onClick={() => onRemove(id)}
                className="text-xs font-bold px-3 py-1.5 rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmingRemove(false)}
                className="text-xs px-3 py-1.5 rounded border border-border/60 hover:bg-card/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRemove(true)}
              title={`Remove ${localName || "this player"} from the lobby`}
              aria-label={`Remove ${localName || "this player"} from the lobby`}
              className="px-4 flex items-center text-foreground/40 hover:text-red-400 hover:bg-card/40 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-col lg:flex-row p-6 border-t border-border gap-6 items-stretch">
          <DataFormPanel
            className="w-full lg:w-72"
            displayName={localName}
            setDisplayName={setLocalName}
            cocFormAction={cocFormAction}
            cocState={cocState}
            crFormAction={crFormAction}
            crState={crState}
            lolFormAction={lolFormAction}
            lolState={lolState}
          />

          {!hasData ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px] border border-border rounded-xl opacity-60">
              Enter tags to load player stats...
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full items-stretch">
                {cocState?.data && <StatCard title="Clash of Clans" data={cocState.data} type="coc" />}
                {crState?.data && <StatCard title="Clash Royale" data={crState.data} type="cr" />}
                {lolState?.data && <StatCard title="League of Legends" data={lolState.data} type="lol" />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}