import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";

const mockProfile = {
  firstName: "Sergei",
  lastName: "Karpushin",
  docId: "1234567",
  street: "",
  house: "",
  apartment: "",
  postalCode: "",
  city: "",
  email: "sergei@example.com",
};

const ProfilePage = () => {
  const { lang, setLang } = useLang();
  const i = t(lang);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(mockProfile.firstName);
  const [lastName, setLastName] = useState(mockProfile.lastName);
  const [docId, setDocId] = useState(mockProfile.docId);
  const [street, setStreet] = useState(mockProfile.street);
  const [house, setHouse] = useState(mockProfile.house);
  const [apartment, setApartment] = useState(mockProfile.apartment);
  const [postalCode, setPostalCode] = useState(mockProfile.postalCode);
  const [city, setCity] = useState(mockProfile.city);
  const [email, setEmail] = useState(mockProfile.email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const inputClass =
    "w-full rounded-xl border border-primary/40 bg-background px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
  const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate("/account")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4" />
          {i.back}
        </button>

        <h1 className="mb-6 text-2xl font-bold text-primary">{i.prof_title}</h1>

        {/* Language selector + Save */}
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
          <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98]">
            {i.prof_save}
          </button>
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
            <h2 className="mb-3 text-sm font-bold text-primary">{i.prof_myAddress}</h2>
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

          {/* Password */}
          <div className="pt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">{i.prof_newPassword}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">{i.prof_confirmPassword}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
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
