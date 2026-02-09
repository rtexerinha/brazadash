import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

function BrazilFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-label="Brazilian flag">
      <rect width="640" height="480" fill="#009b3a" />
      <polygon points="320,40 600,240 320,440 40,240" fill="#fedf00" />
      <circle cx="320" cy="240" r="100" fill="#002776" />
      <path d="M220,240 Q320,190 420,240" fill="none" stroke="#fff" strokeWidth="12" />
    </svg>
  );
}

function USFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-label="US flag">
      <rect width="640" height="480" fill="#fff" />
      <rect y="0" width="640" height="37" fill="#b22234" />
      <rect y="74" width="640" height="37" fill="#b22234" />
      <rect y="148" width="640" height="37" fill="#b22234" />
      <rect y="222" width="640" height="37" fill="#b22234" />
      <rect y="296" width="640" height="37" fill="#b22234" />
      <rect y="370" width="640" height="37" fill="#b22234" />
      <rect y="444" width="640" height="37" fill="#b22234" />
      <rect width="260" height="259" fill="#3c3b6e" />
      <g fill="#fff">
        <circle cx="26" cy="20" r="8" />
        <circle cx="78" cy="20" r="8" />
        <circle cx="130" cy="20" r="8" />
        <circle cx="182" cy="20" r="8" />
        <circle cx="234" cy="20" r="8" />
        <circle cx="52" cy="45" r="8" />
        <circle cx="104" cy="45" r="8" />
        <circle cx="156" cy="45" r="8" />
        <circle cx="208" cy="45" r="8" />
      </g>
    </svg>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "en" ? "pt" : "en")}
      data-testid="button-language-toggle"
      title={language === "en" ? "Switch to Portuguese" : "Mudar para Ingles"}
      aria-label={language === "en" ? "Switch to Portuguese" : "Switch to English"}
    >
      <div className="h-5 w-5 rounded-sm overflow-hidden ring-1 ring-black/10 dark:ring-white/20">
        {language === "en" ? (
          <BrazilFlag className="h-full w-full" />
        ) : (
          <USFlag className="h-full w-full" />
        )}
      </div>
    </Button>
  );
}
