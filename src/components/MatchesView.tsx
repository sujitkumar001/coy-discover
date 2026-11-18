"use client";

import { useEffect, useState } from "react";
import { Heart, RefreshCw, MapPin } from "lucide-react";
import type { Profile } from "@/data/profiles";

type Match = {
  id: number;
  profile: Profile;
};

export default function MatchesView() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/matches", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load your matches.");
        }

        const data = await response.json();

        if (!Array.isArray(data.matches)) {
          throw new Error("Invalid matches response.");
        }

        if (!cancelled) {
          setMatches(data.matches);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#faf8fc] px-4 py-5">
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#211b2a]">
            Your Matches
          </h2>

          {!loading && !error && (
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600">
              {matches.length} matches
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Connections where you both liked each other.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[260px] items-center justify-center gap-3">
          <RefreshCw
            size={24}
            className="animate-spin text-pink-500"
          />
          <p className="text-sm text-gray-500">
            Loading matches...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-4 rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-pink-100 p-5">
            <Heart size={38} className="text-pink-500" />
          </div>

          <h3 className="text-lg font-bold">
            No matches yet
          </h3>

          <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
            When you and someone like each other,
            your connection will appear here.
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((match) => (
            <article
              key={match.id}
              className="flex items-center gap-4 rounded-2xl border border-pink-100 bg-white p-3 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.profile.photo}
                alt={`Profile of ${match.profile.name}`}
                className="h-20 w-20 shrink-0 rounded-xl bg-pink-50 object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-[#211b2a]">
                  {match.profile.name}, {match.profile.age}
                </h3>

                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={13} />
                  {match.profile.city}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {match.profile.interests.slice(0, 2).map(
                    (interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-pink-50 px-2 py-1 text-[10px] font-medium text-pink-600"
                      >
                        {interest}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="self-start rounded-full bg-pink-50 p-2">
                <Heart
                  size={17}
                  className="fill-pink-500 text-pink-500"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}