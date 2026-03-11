import { Instagram, Twitter, Linkedin, ExternalLink } from 'lucide-react';

interface ProfileAboutProps {
  bio: string | null;
  socialLinks: Record<string, string> | null;
}

export function ProfileAbout({ bio, socialLinks }: ProfileAboutProps) {
  const hasSocials = socialLinks && Object.values(socialLinks).some((v) => v);

  if (!bio && !hasSocials) return null;

  return (
    <div className="space-y-4">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ash-grey)' }}
      >
        About
      </h2>

      {bio && (
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--ash-grey)' }}
        >
          {bio}
        </p>
      )}

      {hasSocials && (
        <div className="flex flex-wrap gap-2">
          {socialLinks?.instagram && (
            <SocialBadge
              platform="instagram"
              username={socialLinks.instagram}
              icon={<Instagram className="h-4 w-4" />}
              url={`https://instagram.com/${socialLinks.instagram}`}
            />
          )}
          {socialLinks?.twitter && (
            <SocialBadge
              platform="twitter"
              username={socialLinks.twitter}
              icon={<Twitter className="h-4 w-4" />}
              url={`https://twitter.com/${socialLinks.twitter}`}
            />
          )}
          {socialLinks?.linkedin && (
            <SocialBadge
              platform="linkedin"
              username={socialLinks.linkedin}
              icon={<Linkedin className="h-4 w-4" />}
              url={`https://linkedin.com/in/${socialLinks.linkedin}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SocialBadge({
  platform,
  username,
  icon,
  url,
}: {
  platform: string;
  username: string;
  icon: React.ReactNode;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-600/50 transition-colors text-sm"
      style={{ color: 'var(--ash-grey)' }}
    >
      {icon}
      <span>@{username}</span>
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}
