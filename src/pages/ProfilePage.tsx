import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Globe, Lock, User, MapPin, Mail } from "lucide-react";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { fetchUser, apiFetch } from "@/lib/api";

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

  // Editable sections
  const [selectedLang, setSelectedLang] = useState(lang);
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
          setSelectedLang(c.lang);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        if (err.message?.includes("401")) {
          navigate("/");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const readonlyInputClass =
    "w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed";
  const editableInputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
  const sectionTitle = "flex items-center gap-2 text-base font-bold text-foreground mb-4";

  const [savingLang, setSavingLang] = useState(false);

  const handleSaveLang = async () => {
    setSavingLang(true);
    try {
      await apiFetch("api/lang", {
        method: "PUT",
        body: JSON.stringify({ lang: selectedLang }),
      });
      setLang(selectedLang);
    } catch (err) {
      console.error("Failed to save language:", err);
    } finally {
      setSavingLang(false);
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword || !passwordsMatch) return;
    // TODO: API call to change password
  };

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

        {/* ── Personal Info (read-only) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-4">
          <div className={sectionTitle}>
            <User className="h-5 w-5 text-primary" />
            {i.prof_personalInfo ?? "Личные данные"}
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{i.prof_firstName}</label>
              <input value={firstName} readOnly className={readonlyInputClass} />
            </div>
            <div>
              <label className={labelClass}>{i.prof_lastName}</label>
              <input value={lastName} readOnly className={readonlyInputClass} />
            </div>
            <div>
              <label className={labelClass}>{i.prof_docId}</label>
              <input value={docId} readOnly className={readonlyInputClass} />
            </div>
          </div>
        </div>

        {/* ── Address (read-only) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-4">
          <div className={sectionTitle}>
            <MapPin className="h-5 w-5 text-primary" />
            {i.prof_myAddress}
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{i.prof_street}</label>
              <input value={street} readOnly className={readonlyInputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{i.prof_house}</label>
                <input value={house} readOnly className={readonlyInputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_apartment}</label>
                <input value={apartment} readOnly className={readonlyInputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{i.prof_postalCode}</label>
                <input value={postalCode} readOnly className={readonlyInputClass} />
              </div>
              <div>
                <label className={labelClass}>{i.prof_city}</label>
                <input value={city} readOnly className={readonlyInputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Email (read-only) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-4">
          <div className={sectionTitle}>
            <Mail className="h-5 w-5 text-primary" />
            {i.prof_emailNotifications}
          </div>
          <input value={email} readOnly className={readonlyInputClass} />
        </div>

        {/* ── Language (editable) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-4">
          <div className={sectionTitle}>
            <Globe className="h-5 w-5 text-primary" />
            {i.prof_language}
          </div>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as "ru" | "en")}
            className={editableInputClass}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
          <button
            onClick={handleSaveLang}
            disabled={savingLang || selectedLang === lang}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {savingLang ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : i.prof_save}
          </button>
        </div>

        {/* ── Change Password (editable) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-8">
          <div className={sectionTitle}>
            <Lock className="h-5 w-5 text-primary" />
            {i.prof_changePassword ?? "Смена пароля"}
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{i.prof_newPassword}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={editableInputClass + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>{i.prof_confirmPassword}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={editableInputClass + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-1.5 text-xs text-destructive">{i.prof_passwordMismatch}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={!newPassword || !confirmPassword || !passwordsMatch}
            className="mt-4 w-full rounded-xl border border-primary py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {i.prof_changePassword ?? "Сменить пароль"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
