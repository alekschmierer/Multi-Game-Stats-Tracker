"use client"
import Image from "next/image";
/*
user server - code that should never be sent to users browser
use client - code needs to be interactive and run in users browser
useState - UI needs to remember something that changes based on user interaction.
useEffect - When something specifc changes, trigger this side effect. Runs after the HTML is updated
variables - const[variable, setVariable] = useState()
const [state (return value from the action), formAction (function you pass), isPending (A boolean that is true while action is running)] = useActionState(function to be called, initialState);

  useEffect to log the number when it changes
  useServer function to log change to a txt file
*/
import { getGameScore } from "@/lib/getGameScore";
import { useState, useCallback } from "react";
import { getPlayerRankedLoLData, getPlayerByCOCTag, getPlayerByCRTag } from "../lib/actions";
import { PlayerData, LobbyPlayer } from "@/interfaces/interface";
import LobbyRow from "@/components/LobbyRow";
import ChartsPanel from "@/components/charts/ChartsPanel";
import ErrorBoundary from "@/components/ErrorBoundary";


export default function Home() {
  const [myAccount, setMyAccount] = useState<{ displayName: string; data: PlayerData }>({
    displayName: "",
    data: { coc: null, cr: null, lol: null }
  });
  const [friendName, setFriendName] = useState("");
  const [friendCocTag, setFriendCocTag] = useState("");
  const [friendCrTag, setFriendCrTag] = useState("");
  const [friendLolTag, setFriendLolTag] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [addFriendErrors, setAddFriendErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("lobby");

  const [friendPopUp, setFriendPopUp] = useState(false);

  const [expanded, setExpanded] = useState<Record<ExpandKey, boolean>>({
    me: false,
    player: false,
  });
  type ExpandKey = "me" | "player";
  function toggle(key: ExpandKey) {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }


  const [lobbyList, setLobbyList] = useState<LobbyPlayer[]>([]);

  // Some IDs are generated in contexts where crypto.randomUUID isn't available.
  const newId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  const addNewPlayer = async () => {
    if (!friendName.trim()) return;
    setIsAddingFriend(true);
    setAddFriendErrors([]);

    const friendData: PlayerData = { coc: null, cr: null, lol: null };
    const problems: string[] = [];

    try {
      // One game failing shouldn't stop the other two from loading, so each
      // lookup records its error and the player still gets added with whatever
      // came back.
      if (friendCocTag.trim()) {
        const res = await getPlayerByCOCTag(friendCocTag.trim());
        friendData.coc = res?.data ?? null;
        if (res?.error) problems.push(res.error);
      }
      if (friendCrTag.trim()) {
        const res = await getPlayerByCRTag(null, friendCrTag.trim());
        friendData.cr = res?.data ?? null;
        if (res?.error) problems.push(res.error);
      }
      if (friendLolTag.trim()) {
        const fd = new FormData();
        fd.append('playerTag', friendLolTag.trim());
        const res = await getPlayerRankedLoLData(null, fd);
        friendData.lol = res?.data ?? null;
        if (res?.error) problems.push(res.error);
      }

      const newEntry = {
        id: newId(),
        displayName: friendName,
        data: friendData,
      };

      setLobbyList((prevList) => [...prevList, newEntry]);
      setAddFriendErrors(problems);

      // Keep the modal open when something went wrong so the message is readable.
      if (problems.length === 0) {
        setFriendName("");
        setFriendCocTag("");
        setFriendCrTag("");
        setFriendLolTag("");
        setFriendPopUp(false);
      }
    } catch (err: any) {
      // The actions return errors rather than throwing, so reaching here means
      // something unexpected happened - still no crash, just a message.
      console.error("Adding a friend failed:", err);
      setAddFriendErrors([err?.message ?? "Could not add that player."]);
    } finally {
      // Always runs, so the button can never stay stuck on "Loading Match Data...".
      setIsAddingFriend(false);
    }
  };

  const handleUpdateMyAccount = useCallback((_: string, name: string, data: any) => {
    setMyAccount({ displayName: name, data });
  }, []);

  const handleUpdateFriend = useCallback((id: string, name: string, data: any) => {
    setLobbyList(prev => prev.map(p => p.id === id ? { ...p, displayName: name, data } : p));
  }, []);

  const allPlayers = [
    myAccount,
    ...lobbyList
  ].filter(player => player.displayName || player.data.coc || player.data.cr || player.data.lol);

  const leaderboard = allPlayers
    .map((player) => {
      const score =
        (getGameScore("lol", player.data?.lol) || 0) +
        (getGameScore("cr", player.data?.cr) || 0) +
        (getGameScore("coc", player.data?.coc) || 0);
      
      return {
        ...player,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);


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
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="flex justify-end mb-4">
            <button onClick={() => setFriendPopUp(!friendPopUp)} className="border border-border/60 rounded-lg px-4 py-2 bg-card/20 hover:bg-card/40 transition-colors">
              + Add Friend
            </button>
          </div>
          {friendPopUp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">

              {/* Gray Overlay */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setFriendPopUp(false)}
              />

              {/* Modal */}
              <div className="relative bg-background border border-border/60 rounded-lg p-6 w-full max-w-md">

                <button
                  onClick={() => setFriendPopUp(false)}
                  className="absolute top-3 right-3 text-foreground/60 hover:text-foreground text-xl leading-none"
                >
                  ×
                </button>

                <h1 className="text-center font-bold text-lg mb-6">
                  Add A Friend To The Lobby
                </h1>

                <div className="flex flex-col items-center w-full">
                  <div className="w-full max-w-xs sm:max-w-sm space-y-4">

                    <div className="space-y-4 w-full p-4 border border-border rounded-xl bg-card/50 flex flex-col">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
                          Friend's Display Name
                        </span>
                        <input
                          type="text"
                          value={friendName}
                          onChange={(e) => setFriendName(e.target.value)}
                          placeholder="Friend's Display Name"
                          className="border border-border/40 bg-background/50 p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-foreground/20 italic"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
                          Clash of Clans
                        </span>
                        <input
                          type="text"
                          value={friendCocTag}
                          onChange={(e) => setFriendCocTag(e.target.value)}
                          placeholder="Tag"
                          className="border p-2 rounded w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
                          Clash Royale
                        </span>
                        <input
                          type="text"
                          value={friendCrTag}
                          onChange={(e) => setFriendCrTag(e.target.value)}
                          placeholder="Tag"
                          className="border p-2 rounded w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">
                          League of Legends
                        </span>
                        <input
                          type="text"
                          value={friendLolTag}
                          onChange={(e) => setFriendLolTag(e.target.value)}
                          placeholder="Name#Tag"
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>

                    {/* Whatever the lookups couldn't fetch, said plainly */}
                    {addFriendErrors.length > 0 && (
                      <div className="w-full p-3 border border-red-500/40 bg-red-500/10 rounded-lg text-xs space-y-1">
                        {addFriendErrors.map((message, i) => (
                          <p key={i} className="break-words">{message}</p>
                        ))}
                      </div>
                    )}

                    {/*Adds friend to lobby*/}
                    <button
                      onClick={addNewPlayer}
                      disabled={isAddingFriend}
                      className="w-full bg-foreground text-background rounded-lg py-3 font-semibold hover:opacity-90 transition shadow-md disabled:opacity-50"
                    >
                      {isAddingFriend ? "Loading Match Data..." : "Add to Lobby"}
                    </button>

                  </div>
                </div>
              </div>

            </div>
          )}

          {/*Logic For Displaying Each Player Row and their Account Data*/}
          {/* Boundaries are per row so one unreadable account can't blank the lobby */}
          <ErrorBoundary label="Your account">
            <LobbyRow
              id="me"
              displayName={myAccount.displayName}
              data={myAccount.data}
              onUpdate={handleUpdateMyAccount}
            />
          </ErrorBoundary>
          <div className="space-y-4">
            {lobbyList.map((player) => (
              <ErrorBoundary key={player.id} label={player.displayName || "This player"}>
                <LobbyRow
                  id={player.id}
                  displayName={player.displayName}
                  data={player.data}
                  onUpdate={handleUpdateFriend}
                />
              </ErrorBoundary>
            ))}
          </div>
        </div>
      )}

      {/* God Gamer Leaderboard */}
      {activeTab === "godgamer" && (
        <ErrorBoundary label="The leaderboard">
        <div className="flex flex-col items-center space-y-3">
          {leaderboard.length === 0 ? (
            <p>No players on the leaderboard yet, add a player to the lobby.</p>
          ) : (
            leaderboard.map((player, index) => (
              <div
                key={`${player.displayName}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background w-full max-w-2xl"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold w-8">
                    #{index + 1}
                  </span>

                  <div>
                    <p className="font-semibold">
                      {player.displayName}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Score: {player.score}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </ErrorBoundary>
      )}

      {/* Charts */}
      {activeTab === "charts" && (
        <ErrorBoundary label="The charts">
          <ChartsPanel allPlayers={allPlayers} />
        </ErrorBoundary>
      )}
    </main>
  );
}
