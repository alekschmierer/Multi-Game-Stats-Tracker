"use client";

import { Component, ReactNode } from "react";

/*
  React unmounts the whole tree when a render throws, so without a boundary one
  bad player document blanks the entire page. This catches the throw, shows it in
  place, and leaves the rest of the app usable. Wrap each tab separately so a
  broken chart can't take the lobby down with it.
*/

type Props = {
  children: ReactNode;
  // Shown in the fallback so it's obvious which part failed.
  label?: string;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="max-w-2xl mx-auto my-6 p-4 border border-red-500/40 bg-red-500/10 rounded-lg text-sm">
        <p className="font-bold mb-1">
          {this.props.label ? `${this.props.label} couldn't be displayed` : "Something went wrong"}
        </p>
        <p className="text-muted-foreground mb-3 break-words">{error.message}</p>
        <button
          onClick={this.reset}
          className="border border-border/60 rounded px-3 py-1 hover:bg-card/40 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
