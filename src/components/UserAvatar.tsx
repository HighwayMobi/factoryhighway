import { useState, useRef, useEffect } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarProps {
  userId: number | null;
  className?: string;
}

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
        if (data?.avatar_path) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_path);
          setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
        }
      });
  }, [userId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/upload-avatar`,
        {
          method: "POST",
          headers: {
            "x-highway-token": getAuthToken() || "",
            "x-highway-user-id": String(userId),
          },
          body: form,
        }
      );

      const json = await res.json();
      if (json.url) {
        setAvatarUrl(json.url + "?t=" + Date.now());
      }
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
      ) : avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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
