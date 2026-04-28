"use client"
import Image from "next/image";
/*
user server - code that should never be sent to users browser
use client - code needs to be interactive and run in users browser
useState - UI needs to remember something that changes based on user interaction.
useEffect - When something specifc changes, trigger this side effect. Runs after the HTML is updated
variables - const[variable, setVariable] = useState()
const [state (return value from the action), formAction (function you pass), isPending (A boolean that is true while action is running)] = useActionState(function to be called, initialState);

Example:
  useState for the number
  Button with onClick to change the number
  useEffect to log the number when it changes
  useServer function to log change to a txt file
*/
import { useState, useEffect, use, useActionState } from "react";
import { getPlayerCOCData, getPlayerCRData, getPlayerRankedLoLData } from "../lib/actions";
import GameForm from "@/components/GameNameForm";
import StatCard from "@/components/StatCard";


export default function Home() {
  const [cocState, cocFormAction] = useActionState(getPlayerCOCData, null);
  const [crState, crFormAction] = useActionState(getPlayerCRData, null);
  const [lolState, lolFormAction] = useActionState(getPlayerRankedLoLData, null);
  const [activeTab, setActiveTab] = useState("lobby");

  const [expanded, setExpanded] = useState<Record<ExpandKey, boolean>>({
    me: false,
    player1: false,
  });

  type ExpandKey = "me" | "player1";
  function toggle(key: ExpandKey) {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // The front end see this code
  return (
    <main>
      {/* mx-auto centers horizontally, max-w is the max width, px is the padding*/}
      <div className="mt-8 mx-auto max-w-6xl px-4 mb-6 text-center">
        <h1 className="font-[var(--font-rajdhani)] text-5xl font-black tracking-wider sm:text-7xl">
          <span className="text-foreground">GOD GAMER</span>
        </h1>
      </div>

      {/* Tabs (Buttons) Control Displayed Data */}
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={() => setActiveTab("lobby")}>Lobby</button>
        <button onClick={() => setActiveTab("godgamer")}>God Gamer</button>
        <button onClick={() => setActiveTab("charts")}>Charts</button>
      </div>

      {/* Lobby */}
      {activeTab === "lobby" && (
        <div className="max-w-6xl mx-auto px-4 w-full"> {/* Container to add side room */}
          <div className="border border-border/60 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle("me")}
              className="w-full flex justify-between items-center p-4 bg-card/20 hover:bg-card/40 transition-colors"
            >
              <div className="text-left">
                <div className="font-bold">My Account</div>
              </div>
              <div className={`transition-transform duration-300 ${expanded.me ? 'rotate-180' : ''}`}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-50"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {expanded.me && (
              <div className="flex flex-col lg:flex-row p-6 border-t border-border gap-6 items-stretch">
                {/* User and Forms */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="h-full space-y-4 p-4 border border-border rounded-xl bg-card/50 flex flex-col">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">Display Name</span>
                      <input
                        type="text"
                        placeholder="Display Name"
                        className="border border-border/40 bg-background/50 p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-foreground/20 italic"
                      />
                    </div>

                    {/* Game Forms */}
                    <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">Clash of Clans</span>
                        <GameForm action={cocFormAction} state={cocState} placeholder="Tag" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">Clash Royale</span>
                        <GameForm action={crFormAction} state={crState} placeholder="Tag" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">League of Legends</span>
                        <GameForm action={lolFormAction} state={lolState} placeholder="Name#Tag" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Cards */}
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full items-stretch">
                    {cocState?.data && (
                      <div className="flex flex-col h-full space-y-1">
                        <StatCard title="Clash of Clans" data={cocState.data} type="coc" />
                      </div>
                    )}
                    {crState?.data && (
                      <div className="flex flex-col h-full space-y-1">
                        <StatCard title="Clash Royale" data={crState.data} type="cr" />
                      </div>
                    )}
                    {lolState?.data && (
                      <div className="flex flex-col h-full space-y-1">
                        <StatCard title="League of Legends" data={lolState.data} type="lol" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* God Gamer Leaderboard */}
      {activeTab === "godgamer" && (
        <div>
          Leaderboard
        </div>
      )}

      {/* Charts */}
      {activeTab === "charts" && (
        <div>
          Charts
        </div>
      )}
    </main>
  );
}
