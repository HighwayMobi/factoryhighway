import { useState, useRef, useEffect } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarProps {
  userId: number | null;
  className?: string;
}

const AVATAR_API_URL = "https://avatars.highway.mobi/api/upload/avatar";
const AVATAR_API_KEY = "8415ead183d47c07c463e07625c257d4cb67668ae064b1c56199ba185e6755c8";

const UserAvatar = ({ userId, className }: UserAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load avatar URL from DB on mount
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_avatars")
      .select("avatar_path")
      .eq("highway_user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const path = data?.avatar_path;
        // Only accept full external URLs; ignore legacy storage paths like "2/avatar.png"
        if (path && /^https?:\/\//i.test(path)) {
          setAvatarUrl(path);
        }
      });
  }, [userId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(AVATAR_API_URL, {
        method: "POST",
        headers: { "X-Api-Key": AVATAR_API_KEY },
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

      // Persist URL via edge function (service role bypasses RLS)
      const { error: saveError } = await supabase.functions.invoke("save-avatar-url", {
        body: { highway_user_id: userId, url },
      });

      if (saveError) {
        console.error("Failed to save avatar url:", saveError);
      }

      setAvatarUrl(url + "?t=" + Date.now());
      // Reset input so same file can be re-uploaded
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
