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
import { getPlayerByCOCTag, getPlayerByCRTag, getPUUIDBySummonerNameTag } from "./actions";

export default function Home() {
  const [cocState, cocFormAction] = useActionState(getPlayerByCOCTag, null);
  const [crState, crFormAction] = useActionState(getPlayerByCRTag, null);
  const [lolState, lolFormAction] = useActionState(getPUUIDBySummonerNameTag, null);


  // The front end see this code
  return (
    <main>
      <h1>Hello World!</h1>
      <form action={cocFormAction}>
        <input
          name="playerTag"
          type='text'
          placeholder='Enter COC player tag (#)'
        />
      </form>
      {cocState?.error && (
        <div>
          <p>Error: {cocState.error}</p>
        </div>
      )}
      {cocState?.data && (
        <div>
          <pre>
            {JSON.stringify(cocState.data, null, 2)}
          </pre>
        </div>
      )}

      <form action={crFormAction}>
        <input
          name="playerTag"
          type='text'
          placeholder='Enter CR player tag (#)'
        />
      </form>
      {crState?.error && (
        <div>
          <p>Error: {crState.error}</p>
        </div>
      )}
      {crState?.data && (
        <div>
          <pre>
            {JSON.stringify(crState.data, null, 2)}
          </pre>
        </div>
      )}

      <form action={lolFormAction}>
        <input
          name="summonerNameTag"
          type='text'
          placeholder='Enter LoL Name#Tagline'
        />
      </form>
      {lolState?.error && (
        <div>
          <p>Error: {lolState.error}</p>
        </div>
      )}
      {lolState?.data && (
        <div>
          <pre>
            {JSON.stringify(lolState.data, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
