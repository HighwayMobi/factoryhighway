import { useState, useRef } from "react";
import { User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_KEY = "highway_user_avatar";

export const getUserAvatar = () => localStorage.getItem(AVATAR_KEY);

const UserAvatar = ({ className }: { className?: string }) => {
  const [avatar, setAvatar] = useState<string | null>(getUserAvatar);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(AVATAR_KEY, result);
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
        className
      )}
    >
      {avatar ? (
        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <User className="h-6 w-6 text-primary" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-4 w-4 text-white" />
      </div>
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
