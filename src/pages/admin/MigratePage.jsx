import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { migrarTodosDados, verificarMigracao } from "../../scripts/migrateData";

export default function MigratePage() {
  const [status, setStatus] = useState("idle"); // idle, running, success, error
  const [log, setLog] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [verificacao, setVerificacao] = useState(null);
  const navigate = useNavigate();

  const adicionarLog = (mensagem, tipo = "info") => {
    setLog((prev) => [...prev, { mensagem, tipo, timestamp: new Date() }]);
  };

  const handleVerificar = async () => {
    adicionarLog("🔍 Verificando status da migração...", "info");
    
    try {
      const result = await verificarMigracao();
      setVerificacao(result);
      
      if (result) {
        adicionarLog("✅ Verificação concluída", "success");
      } else {
        adicionarLog("⚠️ Não foi possível verificar", "warning");
      }
    } catch (error) {
      adicionarLog(`❌ Erro na verificação: ${error.message}`, "error");
    }
  };

  const handleMigrar = async () => {
    if (status === "running") return;

    // Confirmar ação
    const confirmar = window.confirm(
      "⚠️ ATENÇÃO!\n\n" +
      "Esta ação irá:\n" +
      "- Criar/sobrescrever 44 modalidades\n" +
      "- Criar/sobrescrever 16 equipes\n" +
      "- Configurar o sistema\n" +
      "- Inicializar rankings\n\n" +
      "Deseja continuar?"
    );

    if (!confirmar) return;

    setStatus("running");
    setLog([]);
    setResultado(null);
    
    adicionarLog("🚀 Iniciando migração completa...", "info");

    try {
      // Interceptar console.log e console.error
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        const mensagem = args.join(" ");
        adicionarLog(mensagem, "info");
        originalLog(...args);
      };
      
      console.error = (...args) => {
        const mensagem = args.join(" ");
        adicionarLog(mensagem, "error");
        originalError(...args);
      };

      const result = await migrarTodosDados();

      // Restaurar console
      console.log = originalLog;
      console.error = originalError;

      if (result.success) {
        setStatus("success");
        setResultado(result.resultados);
        adicionarLog("✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO!", "success");
      } else {
        setStatus("error");
        setResultado(result.resultados);
        
        // Mostrar detalhes dos erros
        if (result.resultados.modalidades.error) {
          adicionarLog(`❌ Erro modalidades: ${result.resultados.modalidades.error}`, "error");
        }
        if (result.resultados.equipes.error) {
          adicionarLog(`❌ Erro equipes: ${result.resultados.equipes.error}`, "error");
        }
        if (result.resultados.configuracoes.error) {
          adicionarLog(`❌ Erro configurações: ${result.resultados.configuracoes.error}`, "error");
        }
        if (result.resultados.ranking.error) {
          adicionarLog(`❌ Erro rankings: ${result.resultados.ranking.error}`, "error");
        }
        
        adicionarLog("⚠️ Migração concluída com erros", "error");
      }
    } catch (error) {
      setStatus("error");
      adicionarLog(`❌ Erro crítico: ${error.message}`, "error");
      adicionarLog(`Stack trace: ${error.stack}`, "error");
      console.error("Erro na migração:", error);
    }
  };

  const getLogColor = (tipo) => {
    switch (tipo) {
      case "success":
        return "#00b894";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f9ca24";
      default:
        return "var(--text)";
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <button
          onClick={() => navigate("/admin")}
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: "0.875rem",
            marginBottom: "16px",
          }}
        >
          ← Voltar ao Dashboard
        </button>

        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "8px",
            background: "linear-gradient(135deg, var(--primary), #2dd4bf)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🗄️ Migração de Dados
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Popula o Firestore com dados iniciais do sistema
        </p>
      </div>

      {/* Alerta de Permissões */}
      {status === "error" && resultado && (
        resultado.configuracoes?.error?.includes("permissions") ||
        resultado.ranking?.error?.includes("permissions") ||
        resultado.modalidades?.error?.includes("permissions") ||
        resultado.equipes?.error?.includes("permissions")
      ) && (
        <div
          className="card"
          style={{
            padding: "20px",
            marginBottom: "32px",
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
            border: "2px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", marginBottom: "12px", color: "#ef4444" }}>
            🔐 Erro de Permissão Detectado
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "12px", lineHeight: "1.6" }}>
            O Firestore está bloqueando as operações de escrita. Você precisa configurar as Security Rules.
          </p>
          <div style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
            <strong style={{ color: "#fbbf24" }}>📋 Passos para corrigir:</strong>
            <ol style={{ marginTop: "8px", marginLeft: "20px", fontSize: "0.875rem", lineHeight: "1.8" }}>
              <li>Acesse: <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>Firebase Console</a></li>
              <li>Selecione o projeto: <strong>semanadajuventudeifrs</strong></li>
              <li>Menu → <strong>Firestore Database</strong> → Aba <strong>Rules</strong></li>
              <li>Substitua pelas regras do arquivo: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>FIRESTORE_SECURITY_RULES.txt</code></li>
              <li>Clique em <strong>Publicar</strong></li>
              <li>Aguarde 1-2 minutos e tente novamente</li>
            </ol>
          </div>
          <button
            onClick={() => {
              const rulesUrl = "https://console.firebase.google.com/project/semanadajuventudeifrs/firestore/rules";
              window.open(rulesUrl, "_blank");
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            🔗 Abrir Firebase Console
          </button>
        </div>
      )}

      {/* Cards de Ação */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {/* Card Verificar */}
        <div
          className="card"
          style={{
            padding: "24px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", marginBottom: "12px", color: "#3b82f6" }}>
            🔍 Verificar Status
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
            Verifica se os dados já foram migrados
          </p>
          <button
            onClick={handleVerificar}
            disabled={status === "running"}
            className="btn"
            style={{
              width: "100%",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#3b82f6",
              opacity: status === "running" ? 0.5 : 1,
            }}
          >
            Verificar
          </button>
        </div>

        {/* Card Migrar */}
        <div
          className="card"
          style={{
            padding: "24px",
            background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.05))",
            border: "1px solid rgba(45, 212, 191, 0.2)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", marginBottom: "12px", color: "var(--primary)" }}>
            🚀 Executar Migração
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
            Migra todas as modalidades, equipes e configurações
          </p>
          <button
            onClick={handleMigrar}
            disabled={status === "running"}
            className="btn btn--primary"
            style={{
              width: "100%",
              opacity: status === "running" ? 0.5 : 1,
            }}
          >
            {status === "running" ? "⏳ Migrando..." : "Iniciar Migração"}
          </button>
        </div>
      </div>

      {/* Resultado da Verificação */}
      {verificacao && (
        <div
          className="card"
          style={{
            padding: "24px",
            marginBottom: "32px",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", marginBottom: "16px" }}>
            📊 Status Atual
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>
                Modalidades
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                {verificacao.modalidades.migrado ? "✅" : "❌"} {verificacao.modalidades.count}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>
                Equipes
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                {verificacao.equipes.migrado ? "✅" : "❌"} {verificacao.equipes.count}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>
                Configurações
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                {verificacao.configuracoes.migrado ? "✅" : "❌"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>
                Rankings
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                {verificacao.ranking.migrado ? "✅" : "❌"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div
          className="card"
          style={{
            padding: "24px",
            background: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", marginBottom: "16px" }}>
            📝 Log de Execução
          </h3>
          <div
            style={{
              backgroundColor: "#000",
              borderRadius: "8px",
              padding: "16px",
              maxHeight: "400px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "0.875rem",
            }}
          >
            {log.map((item, index) => (
              <div
                key={index}
                style={{
                  color: getLogColor(item.tipo),
                  marginBottom: "8px",
                  lineHeight: "1.5",
                }}
              >
                {item.mensagem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado Final */}
      {resultado && status !== "running" && (
        <div
          className="card"
          style={{
            padding: "24px",
            marginTop: "32px",
            background:
              status === "success"
                ? "linear-gradient(135deg, rgba(0, 184, 148, 0.1), rgba(0, 184, 148, 0.05))"
                : "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
            border:
              status === "success"
                ? "1px solid rgba(0, 184, 148, 0.3)"
                : "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              marginBottom: "16px",
              color: status === "success" ? "#00b894" : "#ef4444",
            }}
          >
            {status === "success" ? "✨ Migração Bem-Sucedida!" : "⚠️ Migração com Erros"}
          </h3>
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              Modalidades:{" "}
              <strong>{resultado.modalidades.success ? "✅" : "❌"}</strong>
              {resultado.modalidades.count && ` (${resultado.modalidades.count})`}
            </div>
            <div>
              Equipes: <strong>{resultado.equipes.success ? "✅" : "❌"}</strong>
              {resultado.equipes.count && ` (${resultado.equipes.count})`}
            </div>
            <div>
              Configurações: <strong>{resultado.configuracoes.success ? "✅" : "❌"}</strong>
            </div>
            <div>
              Rankings: <strong>{resultado.ranking.success ? "✅" : "❌"}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
