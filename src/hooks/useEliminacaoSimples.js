import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { getEquipes } from '../api/equipes';

/**
 * Hook para gerenciar sistema de eliminação simples com persistência no Firebase
 * 
 * Estrutura do documento no Firestore:
 * eliminacao-simples/{modalidadeId} = {
 *   modalidadeId: string,
 *   numEquipes: number,
 *   equipes: Array<{ id, nome }>,
 *   confrontos: {
 *     oitavas: Array<{ id, equipeA, equipeB, fase, jogo }>,
 *     quartas: Array<...>,
 *     semis: Array<...>,
 *     final: Object
 *   },
 *   resultados: {
 *     [confrontoId]: { scoreA, scoreB, vencedor }
 *   },
 *   status: "inscricoes" | "oitavas" | "quartas" | "semis" | "final" | "concluido",
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 * 
 * @param {string} modalidadeId - ID da modalidade
 * @param {number} numEquipes - Número de equipes (padrão: 16)
 * @returns {Object} Estado e funções do sistema
 */
export function useEliminacaoSimples(modalidadeId, numEquipes = 16) {
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState([]);
  const [todasEquipes, setTodasEquipes] = useState([]); // Lista completa das equipes do sistema
  const [equipesLocal, setEquipesLocal] = useState(
    Array(numEquipes).fill("").map((_, i) => ({ id: `slot-${i}`, nome: "" }))
  );
  const [confrontosOitavas, setConfrontosOitavas] = useState([]);
  const [confrontosQuartas, setConfrontosQuartas] = useState([]);
  const [confrontosSemis, setConfrontosSemis] = useState([]);
  const [confrontoFinal, setConfrontoFinal] = useState(null);
  const [resultados, setResultados] = useState({});
  const [status, setStatus] = useState("inscricoes");

  // ========================================
  // CARREGAR DADOS DO FIREBASE
  // ========================================
  
  useEffect(() => {
    const carregarDados = async () => {
      if (!modalidadeId) {
        setLoading(false);
        return;
      }

      try {
        // Carregar lista de todas as equipes do sistema
        const responseEquipes = await getEquipes();
        if (responseEquipes.success) {
          setTodasEquipes(responseEquipes.data);
        }

        const docRef = doc(db, 'eliminacao-simples', modalidadeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          
          // Restaurar estado do Firebase
          if (dados.equipes?.length > 0) {
            setEquipes(dados.equipes);
          }
          
          if (dados.equipesLocal?.length > 0) {
            setEquipesLocal(dados.equipesLocal);
          }
          
          if (dados.confrontos) {
            setConfrontosOitavas(dados.confrontos.oitavas || []);
            setConfrontosQuartas(dados.confrontos.quartas || []);
            setConfrontosSemis(dados.confrontos.semis || []);
            setConfrontoFinal(dados.confrontos.final || null);
          }
          
          if (dados.resultados) {
            setResultados(dados.resultados);
          }
          
          if (dados.status) {
            setStatus(dados.status);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da eliminação simples:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [modalidadeId]);

  // ========================================
  // SALVAR NO FIREBASE
  // ========================================
  
  const salvarNoFirebase = useCallback(async (dadosAtualizados) => {
    if (!modalidadeId) return;

    try {
      const docRef = doc(db, 'eliminacao-simples', modalidadeId);
      const docSnap = await getDoc(docRef);

      const timestamp = new Date().toISOString();
      
      if (docSnap.exists()) {
        // Atualizar documento existente
        await updateDoc(docRef, {
          ...dadosAtualizados,
          updatedAt: timestamp
        });
      } else {
        // Criar novo documento
        await setDoc(docRef, {
          modalidadeId,
          numEquipes,
          equipes: [],
          equipesLocal: Array(numEquipes).fill("").map((_, i) => ({ id: i, nome: "" })),
          confrontos: {
            oitavas: [],
            quartas: [],
            semis: [],
            final: null
          },
          resultados: {},
          status: "inscricoes",
          ...dadosAtualizados,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      throw error;
    }
  }, [modalidadeId, numEquipes]);

  // ========================================
  // FUNÇÕES DE MANIPULAÇÃO
  // ========================================

  const handleEquipeChange = useCallback((idx, equipeObj) => {
    setEquipesLocal(prev => {
      const newEquipesLocal = prev.map((eq, i) => i === idx ? equipeObj : eq);
      
      // Salvar no Firebase
      salvarNoFirebase({ equipesLocal: newEquipesLocal });
      
      return newEquipesLocal;
    });
  }, [salvarNoFirebase]);

  const embaralharEquipes = useCallback((equipesParaEmbaralhar) => {
    return [...equipesParaEmbaralhar].sort(() => Math.random() - 0.5);
  }, []);

  const handleSalvarEquipes = useCallback(async () => {
    const equipesPreenchidas = equipesLocal.filter(eq => eq.id && eq.nome && eq.nome.trim() !== "");
    
    if (equipesPreenchidas.length < numEquipes) {
      alert(`Selecione todas as ${numEquipes} equipes antes de salvar!`);
      return;
    }
  const _id = (modalidadeId || '').toLowerCase();
  const isCSGO = /cs[_-]?go/i.test(_id);
    // Para CSGO, preservar a ordem informada pelo admin (sem embaralhar)
    const equipesEmbaralhadas = isCSGO ? equipesPreenchidas : embaralharEquipes(equipesPreenchidas);
    
    // Gera confrontos das oitavas (16 times = 8 jogos)
    const oitavas = [];
    for (let i = 0; i < equipesEmbaralhadas.length; i += 2) {
      oitavas.push({
        id: `oitava-${i / 2 + 1}`,
        equipeA: equipesEmbaralhadas[i],
        equipeB: equipesEmbaralhadas[i + 1],
        fase: 'Oitavas de Final',
        jogo: i / 2 + 1
      });
    }

    setEquipes(equipesEmbaralhadas);
    setConfrontosOitavas(oitavas);
    setStatus("oitavas");

    // Salvar no Firebase
    await salvarNoFirebase({
      equipes: equipesEmbaralhadas,
      equipesLocal,
      confrontos: {
        oitavas,
        quartas: [],
        semis: [],
        final: null
      },
      status: "oitavas"
    });

    alert(isCSGO ? "Oitavas salvas com a ordem informada!" : "Equipes salvas e confrontos das oitavas gerados!");
  }, [equipesLocal, numEquipes, embaralharEquipes, salvarNoFirebase]);

  const saveResultado = useCallback(async (confrontoId, scoreA, scoreB) => {
    const vencedor = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null;
    
    const novoResultado = {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      vencedor,
      timestamp: new Date().toISOString()
    };

    setResultados(prev => {
      const novosResultados = {
        ...prev,
        [confrontoId]: novoResultado
      };

      // Salvar no Firebase
      salvarNoFirebase({
        resultados: novosResultados
      });

      return novosResultados;
    });
  }, [salvarNoFirebase]);

  // ========================================
  // LÓGICA DE AVANÇO AUTOMÁTICO
  // ========================================

  // Gera confrontos das quartas quando todas oitavas tiverem resultado
  useEffect(() => {
    if (confrontosOitavas.length === 8) {
      const vencedores = [];
      confrontosOitavas.forEach(confronto => {
        const resultado = resultados[confronto.id];
        if (!resultado) return;
        
        if (resultado.scoreA > resultado.scoreB) {
          vencedores.push(confronto.equipeA);
        } else if (resultado.scoreB > resultado.scoreA) {
          vencedores.push(confronto.equipeB);
        }
      });

      if (vencedores.length === 8 && confrontosQuartas.length === 0) {
        const quartas = [];
        for (let i = 0; i < vencedores.length; i += 2) {
          quartas.push({
            id: `quarta-${i / 2 + 1}`,
            equipeA: vencedores[i],
            equipeB: vencedores[i + 1],
            fase: 'Quartas de Final',
            jogo: i / 2 + 1
          });
        }
        
        setConfrontosQuartas(quartas);
        setStatus("quartas");

        // Salvar no Firebase
        salvarNoFirebase({
          confrontos: {
            oitavas: confrontosOitavas,
            quartas,
            semis: confrontosSemis,
            final: confrontoFinal
          },
          status: "quartas"
        });
      }
    }
  }, [confrontosOitavas, resultados, confrontosQuartas.length, confrontosSemis, confrontoFinal, salvarNoFirebase]);

  // Gera confrontos das semis quando todas quartas tiverem resultado
  useEffect(() => {
    if (confrontosQuartas.length === 4) {
      const vencedores = [];
      confrontosQuartas.forEach(confronto => {
        const resultado = resultados[confronto.id];
        if (!resultado) return;
        
        if (resultado.scoreA > resultado.scoreB) {
          vencedores.push(confronto.equipeA);
        } else if (resultado.scoreB > resultado.scoreA) {
          vencedores.push(confronto.equipeB);
        }
      });

      if (vencedores.length === 4 && confrontosSemis.length === 0) {
        const semis = [];
        for (let i = 0; i < vencedores.length; i += 2) {
          semis.push({
            id: `semi-${i / 2 + 1}`,
            equipeA: vencedores[i],
            equipeB: vencedores[i + 1],
            fase: 'Semifinal',
            jogo: i / 2 + 1
          });
        }
        
        setConfrontosSemis(semis);
        setStatus("semis");

        // Salvar no Firebase
        salvarNoFirebase({
          confrontos: {
            oitavas: confrontosOitavas,
            quartas: confrontosQuartas,
            semis,
            final: confrontoFinal
          },
          status: "semis"
        });
      }
    }
  }, [confrontosQuartas, resultados, confrontosSemis.length, confrontosOitavas, confrontoFinal, salvarNoFirebase]);

  // Gera confronto da final quando ambas semis tiverem resultado
  useEffect(() => {
    if (confrontosSemis.length === 2) {
      const vencedores = [];
      confrontosSemis.forEach(confronto => {
        const resultado = resultados[confronto.id];
        if (!resultado) return;
        
        if (resultado.scoreA > resultado.scoreB) {
          vencedores.push(confronto.equipeA);
        } else if (resultado.scoreB > resultado.scoreA) {
          vencedores.push(confronto.equipeB);
        }
      });

      if (vencedores.length === 2 && !confrontoFinal) {
        const final = {
          id: 'final',
          equipeA: vencedores[0],
          equipeB: vencedores[1],
          fase: 'Final',
          jogo: 1
        };
        
        setConfrontoFinal(final);
        setStatus("final");

        // Salvar no Firebase
        salvarNoFirebase({
          confrontos: {
            oitavas: confrontosOitavas,
            quartas: confrontosQuartas,
            semis: confrontosSemis,
            final
          },
          status: "final"
        });
      }
    }
  }, [confrontosSemis, resultados, confrontoFinal, confrontosOitavas, confrontosQuartas, salvarNoFirebase]);

  // Marcar como concluído e calcular ranking quando final tiver resultado
  useEffect(() => {
    if (confrontoFinal && resultados[confrontoFinal.id]) {
      if (status !== "concluido") {
        setStatus("concluido");
        salvarNoFirebase({ status: "concluido" });
        
        // Calcular e salvar ranking automaticamente
        const calcularRankingAsync = async () => {
          const { verificarECalcularRanking } = require('../services/rankingEliminacaoService');
          await verificarECalcularRanking(modalidadeId);
        };
        
        calcularRankingAsync();
      }
    }
  }, [confrontoFinal, resultados, status, salvarNoFirebase, modalidadeId]);

  // ========================================
  // RETORNO DO HOOK
  // ========================================

  return {
    loading,
    // Estado
    equipes,
    equipesLocal,
    todasEquipes, // Nova propriedade
    confrontosOitavas,
    confrontosQuartas,
    confrontosSemis,
    confrontoFinal,
    resultados,
    status,
    // Funções
    handleEquipeChange,
    handleSalvarEquipes,
    saveResultado,
    setEquipesLocal,
    setResultados
  };
}
