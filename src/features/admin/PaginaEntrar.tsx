import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { entrar } from "@/data/autenticacao";
import { useUsuario } from "@/hooks/useUsuario";
import { Botao } from "@/ui/Botao";
import { CabecalhoDaPagina } from "@/ui/Pagina";

const campo =
  "mt-1 block min-h-11 w-full rounded-md border border-cal bg-papel px-3 focus:border-campo-escuro";

export function PaginaEntrar() {
  const { usuario } = useUsuario();
  const navegar = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/admin" replace />;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setErro(null);
    setEnviando(true);
    try {
      await entrar(String(dados.get("email")), String(dados.get("senha")));
      navegar("/admin", { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabecalhoDaPagina titulo="Entrar" tituloDaAba="Entrar">
        Acesso da organização para lançar a pontuação das modalidades.
      </CabecalhoDaPagina>
      <form onSubmit={enviar} className="max-w-sm space-y-4" noValidate>
        <label className="block font-semibold">
          E-mail
          <input name="email" type="email" autoComplete="username" required className={campo} />
        </label>
        <label className="block font-semibold">
          Senha
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className={campo}
          />
        </label>
        {erro && (
          <p role="alert" className="font-semibold text-campea">
            {erro}
          </p>
        )}
        <Botao type="submit" disabled={enviando} className="w-full">
          <LogIn aria-hidden className="size-4" />
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
      </form>
    </>
  );
}
