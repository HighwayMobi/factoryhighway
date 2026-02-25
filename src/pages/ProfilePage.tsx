import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { fetchUser } from "@/lib/api";

const ProfilePage = () => {
  const { lang, setLang } = useLang();
  const i = t(lang);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [docId, setDocId] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = newPassword === "" || confirmPassword === "" || newPassword === confirmPassword;

  useEffect(() => {
    fetchUser()
      .then(({ data }) => {
        const c = data.client;
        setFirstName(c.first_name || "");
        setLastName(c.second_name || "");
        setDocId(c.passport_number || "");
        setStreet(c.street || "");
        setHouse(c.house || "");
        setApartment(c.apartment || "");
        setPostalCode(c.postal_code || "");
        setCity(c.city || "");
        setEmail(c.email || "");
        if (c.lang === "en" || c.lang === "ru") {
          setLang(c.lang);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <InternalHeader lang={lang} onLangChange={setLang} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate("/account")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {i.back}
        </button>

        <h1 className="mb-6 text-2xl font-bold text-foreground">{i.prof_title}</h1>

        {/* Language selector */}
        <div className="mb-6 space-y-3">
          <label className={labelClass}>{i.prof_language}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "ru" | "en")}
            className={inputClass}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Personal info */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{i.prof_firstName}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{i.prof_lastName}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{i.prof_docId}</label>
            <input value={docId} onChange={(e) => setDocId(e.target.value)} className={inputClass} />
          </div>

          {/* Address */}
          <div className="pt-2">
            <h2 className="mb-3 text-sm font-bold text-foreground">{i.prof_myAddress}</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{i.prof_street}</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_house}</label>
                <input value={house} onChange={(e) => setHouse(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_apartment}</label>
                <input value={apartment} onChange={(e) => setApartment(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_postalCode}</label>
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_city}</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>{i.prof_emailNotifications}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          {/* Save button */}
          <div className="pt-2">
            <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98]">
              {i.prof_save}
            </button>
          </div>

          {/* Password */}
          <div className="pt-4 space-y-4">
            <div>
              <label className={labelClass}>{i.prof_newPassword}</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass + " pr-10"} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>{i.prof_confirmPassword}</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass + " pr-10"} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-1.5 text-xs text-destructive">{i.prof_passwordMismatch}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 pb-8">
            <button className="w-full rounded-xl border border-primary py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]">
              {i.prof_update}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
