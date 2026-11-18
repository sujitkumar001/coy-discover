
"use client";

import { useState } from "react";
import MatchesView from "@/components/MatchesView";
import SwipeDeck from "@/components/SwipeDeck";

type Tab = "home" | "discover" | "matches";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");

  return (
    <main className="h-dvh overflow-hidden bg-[#faf8fc] text-[#18131f]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden bg-white shadow-xl">

        {/* Fixed header */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h1 className="text-3xl font-black tracking-tight">
            coy<span className="text-pink-500">.</span>
          </h1>

          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
            {activeTab === "home"
              ? "Home"
              : activeTab === "discover"
              ? "Discover"
              : "Matches"}
          </span>
        </header>

        {/* Home */}
        {activeTab === "home" && (
          <section className="min-h-0 flex-1 bg-white" />
        )}

        {/* Discover */}
        {activeTab === "discover" && <SwipeDeck />}

        {/* Matches */}
        {activeTab === "matches" && <MatchesView />}

        {/* Fixed bottom navigation */}
        <nav
          aria-label="Main navigation"
          className="grid shrink-0 grid-cols-3 border-t border-gray-100 bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {(
            [
              { id: "home", icon: "⌂", label: "Home" },
              { id: "discover", icon: "♡", label: "Discover" },
              { id: "matches", icon: "♥", label: "Matches" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-pink-50 text-pink-600"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl leading-none">
                {tab.icon}
              </span>

              <span className="text-xs font-semibold">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

      </div>
    </main>
  );
}
