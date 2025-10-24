import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { getModalidadeById } from "../api/modalidades";
import { getResultadosPorModalidade, saveResultado, getChaves, saveChaves } from "../api/resultados";
import { getEquipesInscritas } from "../api/modalidades";
import { useAuth } from "../context/AuthContext";

/**
 * HOC para carregar dados do Firestore antes de renderizar ModalidadeDetalhe
 * Envolve o componente original e injeta os dados via props
 * 
 * Funcionalidade de salvamento é habilitada APENAS para usuários autenticados (admins)
 */
export function withModalidadeData(WrappedComponent) {
  return function ModalidadeDetalheWithData(props) {
    const { id } = useParams();
    const { user } = useAuth(); // Verificar se usuário está logado
    const isAdmin = !!user; // Se tem usuário logado, é admin
    const [modalidade, setModalidade] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [equipesInscritas, setEquipesInscritas] = useState([]);
    const [chavesData, setChavesData] = useState(null); // Dados das chaves do Firestore
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para dados das eliminatórias
    const [confrontosQuartas, setConfrontosQuartas] = useState([]);
    const [confrontosSemis, setConfrontosSemis] = useState([]);
    const [confrontosFinal, setConfrontosFinal] = useState(null);
    const [resultadosEliminatorias, setResultadosEliminatorias] = useState({});
    
    // Estados para controle de salvamento
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    
    // Dados originais para detectar mudanças
    const [originalResultados, setOriginalResultados] = useState([]);
    const [originalChavesData, setOriginalChavesData] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          // 1. Buscar modalidade
          const modalidadeResult = await getModalidadeById(id);
          if (!modalidadeResult.success) {
            setError(modalidadeResult.error || "Modalidade não encontrada");
            setLoading(false);
            return;
          }
          setModalidade(modalidadeResult.data);

          // 2. Buscar resultados
          const resultadosResult = await getResultadosPorModalidade(id);
          if (resultadosResult.success) {
            const resultadosData = resultadosResult.data || [];
            setResultados(resultadosData);
            setOriginalResultados(JSON.parse(JSON.stringify(resultadosData))); // Deep copy
          }

          // 3. Buscar equipes inscritas
          const inscricoesResult = await getEquipesInscritas(id);
          if (inscricoesResult.success) {
            setEquipesInscritas(inscricoesResult.data?.equipes || []);
          }

          // 4. Buscar chaves (se for modalidade com chaves)
          const sistemasComChaves = ["chaves+eliminacao", "chaves"];
          if (sistemasComChaves.includes(modalidadeResult.data?.sistema)) {
            const chavesResult = await getChaves(id);
            if (chavesResult.success && chavesResult.data) {
              // Só setar chavesData se realmente houver chaves preenchidas
              // Se chaves estiver vazio, deixar null para que o componente gere as chaves iniciais
              const hasChaves = chavesResult.data.chaves && chavesResult.data.chaves.length > 0;
              
              if (hasChaves) {
                setChavesData(chavesResult.data);
                setOriginalChavesData(JSON.parse(JSON.stringify(chavesResult.data)));
                
                // IMPORTANTE: Carregar resultados dos jogos das chaves
                // Os resultados ficam em chavesResult.data.resultadosJogos[]
                if (chavesResult.data.resultadosJogos && chavesResult.data.resultadosJogos.length > 0) {
                  console.log(`📊 Carregando ${chavesResult.data.resultadosJogos.length} resultados de jogos das chaves`);
                  
                  // Converter array para objeto com chaves "chaveIdx-jogoIdx"
                  const resultadosObj = {};
                  chavesResult.data.resultadosJogos.forEach(resultado => {
                    const key = `${resultado.chaveIdx}-${resultado.jogoIdx}`;
                    resultadosObj[key] = {
                      equipeA: resultado.equipeA,
                      equipeB: resultado.equipeB,
                      scoreA: resultado.scoreA,
                      scoreB: resultado.scoreB,
                    };
                  });
                  
                  console.log(`✅ Resultados convertidos para objeto:`, resultadosObj);
                  setResultados(resultadosObj);
                  setOriginalResultados(JSON.parse(JSON.stringify(resultadosObj)));
                }

                // NOVO: Carregar dados das eliminatórias (confrontos e resultados)
                console.log('🔍 Verificando dados das eliminatórias...');
                
                // Carregar confrontos das eliminatórias
                if (chavesResult.data.confrontosQuartas && chavesResult.data.confrontosQuartas.length > 0) {
                  console.log(`📥 Carregando ${chavesResult.data.confrontosQuartas.length} confrontos das quartas`);
                  setConfrontosQuartas(chavesResult.data.confrontosQuartas);
                }
                
                if (chavesResult.data.confrontosSemis && chavesResult.data.confrontosSemis.length > 0) {
                  console.log(`📥 Carregando ${chavesResult.data.confrontosSemis.length} confrontos das semis`);
                  setConfrontosSemis(chavesResult.data.confrontosSemis);
                }
                
                if (chavesResult.data.confrontosFinal) {
                  console.log(`📥 Carregando confronto da final`);
                  setConfrontosFinal(chavesResult.data.confrontosFinal);
                }

                // Carregar resultados das eliminatórias
                if (chavesResult.data.resultadosEliminatorias) {
                  // Pode ser array ou objeto
                  if (Array.isArray(chavesResult.data.resultadosEliminatorias) && chavesResult.data.resultadosEliminatorias.length > 0) {
                    console.log(`📥 Carregando ${chavesResult.data.resultadosEliminatorias.length} resultados das eliminatórias (array)`);
                    
                    // Converter array para objeto { confrontoId: { scoreA, scoreB } }
                    const resultadosObj = {};
                    chavesResult.data.resultadosEliminatorias.forEach(r => {
                      resultadosObj[r.id] = { 
                        scoreA: r.scoreA, 
                        scoreB: r.scoreB,
                        equipeA: r.equipeA,
                        equipeB: r.equipeB,
                        fase: r.fase
                      };
                    });
                    setResultadosEliminatorias(resultadosObj);
                    console.log('✅ Resultados das eliminatórias carregados:', resultadosObj);
                  } else if (typeof chavesResult.data.resultadosEliminatorias === 'object' && Object.keys(chavesResult.data.resultadosEliminatorias).length > 0) {
                    console.log(`📥 Carregando ${Object.keys(chavesResult.data.resultadosEliminatorias).length} resultados das eliminatórias (objeto)`);
                    setResultadosEliminatorias(chavesResult.data.resultadosEliminatorias);
                    console.log('✅ Resultados das eliminatórias carregados:', chavesResult.data.resultadosEliminatorias);
                  }
                }
              } else {
                // Não setar nada, deixar null para que o componente gere as chaves vazias
                setChavesData(null);
                setOriginalChavesData(null);
              }
            }
          }

        } catch (err) {
          console.error("Erro ao carregar modalidade:", err);
          setError("Erro ao conectar com o servidor");
        } finally {
          setLoading(false);
        }
      };

      if (id) {
        fetchData();
      }
    }, [id]);

    // Detectar mudanças nos resultados ou chaves
    useEffect(() => {
      const resultadosChanged = JSON.stringify(resultados) !== JSON.stringify(originalResultados);
      
      // Detectar mudanças nas chaves
      let chavesChanged = false;
      
      if (chavesData && originalChavesData) {
        // Caso 1: Ambos existem - comparar conteúdo
        chavesChanged = JSON.stringify(chavesData) !== JSON.stringify(originalChavesData);
      } else if (chavesData && !originalChavesData) {
        // Caso 2: Chaves foram criadas (não existiam antes)
        // Verificar se há dados preenchidos nas chaves
        const hasFilledChaves = chavesData.chaves && chavesData.chaves.some(chave => 
          chave.equipes && chave.equipes.some(equipe => equipe && equipe.trim() !== "")
        );
        chavesChanged = hasFilledChaves;
      }
      
      setHasUnsavedChanges(resultadosChanged || chavesChanged);
    }, [resultados, originalResultados, chavesData, originalChavesData]);

    // Função para salvar alterações
    const handleSaveChanges = useCallback(async () => {
      if (!hasUnsavedChanges) {
        alert("Não há alterações para salvar");
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      try {
        let allSuccess = true;

        // Salvar todos os resultados modificados ou novos
        if (resultados.length > 0) {
          console.log("💾 Salvando resultados no Firebase...", resultados.length, "resultados");
          
          const savePromises = resultados.map(async (resultado) => {
            // Verificar se este resultado foi modificado ou é novo
            const original = originalResultados.find(r => r.id === resultado.id);
            if (!original || JSON.stringify(original) !== JSON.stringify(resultado)) {
              console.log("  → Salvando resultado:", resultado.id);
              return await saveResultado(resultado);
            }
            return { success: true };
          });

          const results = await Promise.all(savePromises);
          const successCount = results.filter(r => r.success).length;
          console.log(`✅ ${successCount}/${results.length} resultados salvos com sucesso`);
          allSuccess = allSuccess && results.every(r => r.success);
        }

        // Salvar chaves se foram modificadas ou criadas
        if (chavesData) {
          // Caso 1: Chaves foram modificadas
          const chavesModificadas = originalChavesData && 
            JSON.stringify(chavesData) !== JSON.stringify(originalChavesData);
          
          // Caso 2: Chaves foram criadas (não existiam antes)
          const chavesCriadas = !originalChavesData && 
            chavesData.chaves && 
            chavesData.chaves.some(chave => 
              chave.equipes && chave.equipes.some(equipe => equipe && equipe.trim() !== "")
            );
          
          if (chavesModificadas || chavesCriadas) {
            console.log("💾 Salvando chaves no Firebase...", chavesData);
            const chavesResult = await saveChaves(id, chavesData);
            allSuccess = allSuccess && chavesResult.success;
            
            if (chavesResult.success) {
              console.log("✅ Chaves salvas com sucesso!");
            } else {
              console.error("❌ Erro ao salvar chaves:", chavesResult.error);
            }
          }
        }

        if (allSuccess) {
          console.log('');
          console.log('🎉 ========================================');
          console.log('🎉 SALVAMENTO CONCLUÍDO COM SUCESSO!');
          console.log('🎉 ========================================');
          console.log('📦 Dados salvos no Firebase:');
          if (chavesData && chavesData.chaves) {
            console.log(`   ✓ ${chavesData.chaves.length} chaves`);
          }
          if (resultados.length > 0) {
            console.log(`   ✓ ${resultados.length} resultados de jogos`);
          }
          console.log('🎉 ========================================');
          console.log('');
          
          setSaveSuccess(true);
          setHasUnsavedChanges(false);
          setOriginalResultados(JSON.parse(JSON.stringify(resultados)));
          if (chavesData) {
            setOriginalChavesData(JSON.parse(JSON.stringify(chavesData)));
          }
          
          // Limpar mensagem de sucesso após 3 segundos
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setSaveError("Alguns dados não puderam ser salvos");
        }

      } catch (err) {
        console.error("Erro ao salvar alterações:", err);
        setSaveError("Erro ao salvar alterações. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
    }, [resultados, originalResultados, chavesData, originalChavesData, hasUnsavedChanges, id]);

    // Alertar ao sair da página
    useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = "Você tem alterações não salvas. Deseja realmente sair?";
          return e.returnValue;
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Loading state
    if (loading) {
      return (
        <section className="modalidade-detalhe">
          <Header />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <Loader />
          </div>
        </section>
      );
    }

    // Error state
    if (error) {
      return (
        <section className="modalidade-detalhe">
          <Header />
          <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
            <Alert type="error" message={error} />
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn--primary"
              style={{ marginTop: "20px" }}
            >
              Tentar Novamente
            </button>
          </div>
        </section>
      );
    }

    // Não encontrou modalidade
    if (!modalidade) {
      return (
        <section className="modalidade-detalhe">
          <Header />
          <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>❌ Modalidade não encontrada</h2>
            <p style={{ color: "var(--muted)" }}>
              A modalidade que você está procurando não existe ou foi removida.
            </p>
          </div>
        </section>
      );
    }

    // Renderizar componente original com dados injetados
    return (
      <>
        {/* Mensagem de sucesso - APENAS PARA ADMINS */}
        {isAdmin && saveSuccess && (
          <div style={{
            position: "fixed",
            top: "70px",
            right: "20px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            padding: "12px 20px",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#155724",
            fontWeight: "500"
          }}>
            <span>✅</span>
            Alterações salvas com sucesso!
          </div>
        )}

        {/* Mensagem de erro ao salvar - APENAS PARA ADMINS */}
        {isAdmin && saveError && (
          <div style={{
            position: "fixed",
            top: "70px",
            right: "20px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            padding: "12px 20px",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#721c24",
            fontWeight: "500"
          }}>
            <span>❌</span>
            {saveError}
            <button
              onClick={() => setSaveError(null)}
              style={{
                marginLeft: "10px",
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: "#721c24"
              }}
            >
              ×
            </button>
          </div>
        )}

        <WrappedComponent
          {...props}
          modalidade={modalidade}
          resultados={resultados}
          equipesInscritas={equipesInscritas}
          setResultados={setResultados}
          chavesData={chavesData}
          setChavesData={setChavesData}
          confrontosQuartasInicial={confrontosQuartas}
          confrontosSemisInicial={confrontosSemis}
          confrontosFinalInicial={confrontosFinal?.final || confrontosFinal}
          resultadosEliminatoriasInicial={resultadosEliminatorias}
          isAdmin={isAdmin}
          hasUnsavedChanges={hasUnsavedChanges}
          onSaveChanges={handleSaveChanges}
          isSaving={isSaving}
        />

        {/* Botão de salvar no FINAL da página - APENAS PARA ADMINS */}
        {isAdmin && hasUnsavedChanges && (
          <div style={{
            backgroundColor: "#fff3cd",
            border: "2px solid #ffc107",
            borderRadius: "8px",
            padding: "20px",
            margin: "40px auto",
            maxWidth: "800px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <span style={{ fontWeight: "600", color: "#856404", fontSize: "1.1rem" }}>
                Você tem alterações não salvas
              </span>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="btn btn--primary"
              style={{
                padding: "12px 24px",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600"
              }}
            >
              {isSaving ? (
                <>
                  <span className="spinner-small"></span>
                  Salvando...
                </>
              ) : (
                <>
                  💾 Salvar Alterações
                </>
              )}
            </button>
          </div>
        )}
      </>
    );
  };
}

export default withModalidadeData;
