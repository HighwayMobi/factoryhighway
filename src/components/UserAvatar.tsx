import { useState, useRef, useEffect } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: number | null;
  className?: string;
}

const AVATAR_API_BASE = "/api/avatar";

const UserAvatar = ({ userId, className }: UserAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load current avatar URL from external API
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`${AVATAR_API_BASE}/${userId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        return json?.url as string | undefined;
      })
      .then((url) => {
        if (cancelled) return;
        if (url && /^https?:\/\//i.test(url)) {
          setAvatarUrl(url);
        }
      })
      .catch(() => {
        /* no avatar yet */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("client_id", String(userId));
      form.append("file", file);

      const res = await fetch(`${AVATAR_API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        console.error("Avatar upload failed:", res.status, await res.text());
        return;
      }

      const json = await res.json();
      const url: string | undefined = json?.url;
      if (!url) {
        console.error("Avatar API: no url in response", json);
        return;
      }

      // Cache-bust to force refresh
      setAvatarUrl(url + "?t=" + Date.now());
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
        className
      )}
    >
      {uploading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : avatarUrl && avatarUrl.trim() !== "" ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-full w-full object-cover"
          onError={() => setAvatarUrl(null)}
        />
      ) : (
        <User className="h-6 w-6 text-primary" />
      )}
      {!uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-4 w-4 text-white" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </button>
  );
};

export default UserAvatar;
