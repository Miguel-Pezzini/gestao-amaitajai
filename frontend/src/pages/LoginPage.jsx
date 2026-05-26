import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { login } from "@/services/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
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
              Informe e-mail e senha cadastrados pela administração.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <CardDescription
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </CardDescription>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Insira seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Insira sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-ama-blue text-white hover:bg-ama-blue-dark"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
