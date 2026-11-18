
import type { Profile } from "@/data/profiles";

type ProfileCardProps = {
  profile: Profile;
};

export default function ProfileCard({
  profile,
}: ProfileCardProps) {
  return (
    <article className="w-full overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Profile image */}
      <div className="relative h-[clamp(190px,34dvh,300px)] overflow-hidden bg-[#f9e8f1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo}
          alt={`Profile picture of ${profile.name}`}
          className="h-full w-full object-cover object-center"
          draggable={false}
        />

        {/* Dark gradient makes the text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Name and location */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h2 className="text-[26px] font-extrabold tracking-tight">
            {profile.name}, {profile.age}
          </h2>

          <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
            <span>📍</span>
            <span>{profile.city}</span>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="space-y-3 px-4 py-4">
        {/* About */}
        <div>
          <h3 className="text-sm font-bold text-[#211b2a]">
            About me
          </h3>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            {profile.bio}
          </p>
        </div>

        {/* College */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <span>🎓</span>
          <span>{profile.college}</span>
        </div>

        {/* Interests */}
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-pink-100 bg-[#fff1f7] px-3 py-1 text-xs font-semibold text-[#d63379]"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
