import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { loginWithGooglePopup } from "@/lib/popupAuth";

export default function Login() {
  const [email, setEmail] = useState("larsenevans@proton.me");
  const [password, setPassword] = useState("POKLOP123###");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Nesprávny email alebo heslo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGooglePopup(returnTo);
    } catch (err) {
      setError(err.message || "Google prihlásenie zlyhalo. Použite prosím prihlásenie emailom a heslom nižšie.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Prihlásenie do vyšetrovania"
      subtitle="Zadajte svoje prihlasovacie údaje pre prístup k spisom"
      footer={
        <>
          Ešte nemáte vytvorený účet?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Vytvoriť nový účet
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-2 border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Formulár pre Email a Heslo (Okamžité bezpečné prihlásenie) */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="email">Emailová adresa</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="larsenevans@proton.me"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Heslo</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Zabudnuté heslo?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Overujem prihlásenie...
            </>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Prihlásiť sa
            </span>
          )}
        </Button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">alebo cez Google</span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full h-11 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <GoogleIcon className="w-4 h-4 mr-2" />
        )}
        Pokračovať cez Google
      </Button>
    </AuthLayout>
  );
}
