import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/session-context";
import { getGoogleLoginUrl, login } from "@/services/auth";

const LOGIN_ERROR_MESSAGES = {
  conta_pendente: "Sua conta foi criada e aguarda ativação pelo administrador.",
  conta_inativa: "Conta inativa. Entre em contato com a administração.",
  dominio_nao_permitido: "Use seu e-mail institucional @amaitajai.org.br.",
  google_auth_falhou: "Não foi possível concluir o login com Google. Tente novamente.",
  google_nao_configurado: "Login Google ainda não está configurado neste ambiente.",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setUser } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) {
      setError(LOGIN_ERROR_MESSAGES[queryError] ?? "Não foi possível entrar. Tente novamente.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ email: email.trim(), password });
      setUser(data?.user ?? null);
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Não foi possível entrar. Verifique suas credenciais.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleLoginUrl();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 overflow-hidden bg-ama-blue-dark text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ama-blue/45 via-ama-blue-dark to-[#02243a]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-ama-cyan/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-black/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col px-12 py-14">
          <div className="my-auto max-w-md space-y-6">
            <div className="space-y-2">
              <CardDescription className="text-sm font-semibold tracking-wide text-ama-cyan uppercase">
                Sistema de gestão
              </CardDescription>
              <CardTitle className="text-5xl leading-none tracking-tight">
                AMA Itajaí
              </CardTitle>
            </div>

            <CardTitle className="text-4xl leading-tight tracking-tight text-white">
              Incluir é amar
              <br />
              <span className="text-ama-cyan">em AÇÃO!</span>
            </CardTitle>

            <CardDescription className="max-w-md text-base leading-relaxed text-white/80">
              Plataforma institucional para a equipe interna acompanhar
              atendimentos, rotinas e informações com segurança.
            </CardDescription>
          </div>

          <CardDescription className="text-xs text-white/50">
            © AMA Itajaí — gestão interna
          </CardDescription>
        </div>
      </aside>

      <main className="flex w-full flex-1 flex-col items-center justify-center bg-gradient-to-b from-ama-light to-white px-6 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-ama-cyan/30 bg-white/95 shadow-xl shadow-ama-blue/10 backdrop-blur">
          <CardHeader className="text-center lg:text-left">
            <CardTitle className="text-2xl tracking-tight text-ama-text">
              Entrar no sistema
            </CardTitle>
            <CardDescription>
              Use sua conta Google institucional ou e-mail e senha cadastrados.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error ? (
              <CardDescription
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </CardDescription>
            ) : null}

            <GoogleSignInButton onClick={handleGoogleLogin} disabled={loading} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@amaitajai.org.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Insira sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-0 right-0 h-10 px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={loading}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="h-11 w-full"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar com e-mail e senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
