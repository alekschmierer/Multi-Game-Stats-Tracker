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
import { getPlayerCOCData, getPlayerCRData, getPlayerLoLData } from "../lib/actions";
import GameForm from "@/components/GameNameForm";


export default function Home() {
  const [cocState, cocFormAction] = useActionState(getPlayerCOCData, null);
  const [crState, crFormAction] = useActionState(getPlayerCRData, null);
  const [lolState, lolFormAction] = useActionState(getPlayerLoLData, null);
  const [activeTab, setActiveTab] = useState("squad");

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
        <button onClick={() => setActiveTab("squad")}>Squad</button>
        <button onClick={() => setActiveTab("godgamer")}>God Gamer</button>
        <button onClick={() => setActiveTab("charts")}>Charts</button>
      </div>

      {/* Squad */}
      {activeTab === "squad" && (
        <div>
          <div className="border border-border/60 rounded-lg">
            <button
              onClick={() => toggle("me")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="text-left">
                <div className="font-bold">You</div>
              </div>

              <div className="font-bold">˅</div>
            </button>

            {expanded.me && (
              <div>
                <GameForm
                  action={cocFormAction}
                  state={cocState}
                  placeholder="Enter COC player tag (#)"
                />

                <GameForm
                  action={crFormAction}
                  state={crState}
                  placeholder="Enter CR player tag (#)"
                />

                <GameForm
                  action={lolFormAction}
                  state={lolState}
                  placeholder="Enter LoL Name#Tagline"
                />
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
