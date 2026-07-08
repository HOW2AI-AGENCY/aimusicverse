import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
] as const;

export function LanguageSwitcher() {
  const { i18n: i18nInstance } = useTranslation();
  const currentLang = i18nInstance.language?.startsWith("ru") ? "ru" : "en";

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/50 w-fit">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            currentLang === lang.code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={lang.code === "ru" ? "Русский" : "English"}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
