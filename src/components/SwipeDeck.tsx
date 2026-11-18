"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Heart, X, RefreshCw } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import type { Profile } from "@/data/profiles";

type Action = "LIKE" | "PASS";

type Match = {
  id: number;
  profile: Profile;
};

type SwipeResult = {
  matched: boolean;
  match: Match | null;
};

export default function SwipeDeck() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState<Match | null>(null);

  const busy = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/feed", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load profiles.");
      }

      const data = (await response.json()) as {
        profiles: Profile[];
      };

      if (!Array.isArray(data.profiles)) {
        throw new Error("Invalid feed response.");
      }

      setProfiles(data.profiles);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadFeed());
  }, [loadFeed]);

  const currentProfile = profiles[0];

  async function handleSwipe(action: Action) {
    if (!currentProfile || busy.current || match) return;

    busy.current = true;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: currentProfile.id,
          action,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          await loadFeed();
          return;
        }

        const failure = await response.json().catch(() => null);

        throw new Error(
          failure?.error || "Unable to save swipe."
        );
      }

      const result = (await response.json()) as SwipeResult;
      const direction = action === "LIKE" ? 1 : -1;

      await controls.start({
        x: direction * 500,
        rotate: direction * 16,
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      });

      setProfiles((previous) =>
        previous.filter((p) => p.id !== currentProfile.id)
      );

      controls.set({
        x: 0,
        rotate: 0,
        opacity: 1,
      });

      scrollRef.current?.scrollTo({
        top: 0,
        behavior: "instant",
      });

      if (result.matched && result.match) {
        setMatch(result.match);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your action."
      );

      await controls.start({
        x: 0,
        rotate: 0,
        opacity: 1,
      });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <RefreshCw
          className="animate-spin text-pink-500"
          size={28}
        />
        <span className="ml-3 text-sm text-gray-500">
          Finding profiles...
        </span>
      </div>
    );
  }

  if (!currentProfile && !error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-full bg-pink-50 p-5">
          <Heart size={42} className="text-pink-500" />
        </div>

        <h2 className="text-xl font-bold">
          You&apos;re all caught up!
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
          You&apos;ve discovered all available profiles.
          Check back later for new connections.
        </p>
      </div>
    );
  }

  if (!currentProfile && error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void loadFeed()}
          className="rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-32 pt-4"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Discover</h2>
            <p className="mt-1 text-xs text-gray-500">
              Swipe right to like, left to pass.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
            {profiles.length} left
          </span>
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <motion.div
          key={currentProfile.id}
          drag={saving || match ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.85}
          dragMomentum={false}
          animate={controls}
          initial={{ x: 0, rotate: 0, opacity: 1 }}
          style={{ touchAction: "pan-y" }}
          onDragEnd={(_event, info) => {
            if (Math.abs(info.offset.x) > 100) {
              void handleSwipe(
                info.offset.x > 0 ? "LIKE" : "PASS"
              );
            } else {
              void controls.start({
                x: 0,
                rotate: 0,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 350,
                },
              });
            }
          }}
        >
          <ProfileCard profile={currentProfile} />
        </motion.div>
      </div>

      {/* Floating actions: no white action bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-10">
        <button
          type="button"
          disabled={saving || !!match}
          aria-label="Pass profile"
          onClick={() => void handleSwipe("PASS")}
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white text-red-500 shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <X size={30} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          disabled={saving || !!match}
          aria-label="Like profile"
          onClick={() => void handleSwipe("LIKE")}
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f6338b] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <Heart size={29} fill="currentColor" />
        </button>
      </div>

      {/* Mutual-match popup */}
      {match && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New match"
          className="absolute inset-0 z-30 flex items-center justify-center bg-[#211329]/80 px-5"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mb-3 text-5xl">💕</div>

            <h2 className="text-3xl font-extrabold text-pink-500">
              It&apos;s a match!
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              You and {match.profile.name} liked each other!
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.profile.photo}
              alt={match.profile.name}
              className="mx-auto mt-5 h-28 w-28 rounded-full border-4 border-pink-100 object-cover"
            />

            <h3 className="mt-3 text-lg font-bold">
              {match.profile.name}, {match.profile.age}
            </h3>

            <button
              type="button"
              onClick={() => setMatch(null)}
              className="mt-6 w-full rounded-full bg-[#f6338b] px-5 py-3 font-semibold text-white transition-transform active:scale-95"
            >
              Keep discovering
            </button>
          </div>
        </div>
      )}
    </section>
  );
}