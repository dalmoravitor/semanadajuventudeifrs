import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { getEquipes } from '../api/equipes';

/**
 * ========================================
 * HOOK PARA COMPETIÇÃO DE SUDOKU
 * ========================================
 * 
 * REGRAS OFICIAIS:
 * 
 * 1. PRIMEIRA FASE (Classificatória):
 *    - 16 equipes divididas em 3 subdivisões (5, 5, 6 equipes)
 *    - RODADA 1: Cada subdivisão resolve 1 sudoku (máx 10min)
 *    - RODADA 2: Cada subdivisão resolve mais 1 sudoku (máx 10min)
 *    - Penalidades: ≤3 erros = 15min FIXOS | >3 erros ou NC = 16min FIXOS
 *    - Classificam: 2 melhores de cada subdivisão pelo SOMATÓRIO (rodada1 + rodada2)
 *    - Total: 6 classificados
 *    - Eliminados: 10 equipes (classificação 7º a 16º)
 * 
 * 2. SEGUNDA FASE (Semifinal):
 *    - 6 equipes classificadas jogam juntas
 *    - Cada equipe resolve 3 sudokus (máx 15min cada)
 *    - Penalidades: ≤3 erros = 22min FIXOS | >3 erros ou NC = 25min FIXOS
 *    - Classificam: 3 melhores pelo somatório dos 3 sudokus
 *    - OBS: Tempos da primeira fase NÃO contam (apenas como critério de desempate)
 *    - Eliminados: 3 equipes (classificação 4º a 6º)
 * 
 * 3. FASE FINAL:
 *    - 3 finalistas
 *    - Recebem 2 sudokus simultâneos
 *    - Erro = desclassificação imediata
 *    - Rodadas sucessivas até classificar 1º, 2º, 3º
 * 
 * 4. CLASSIFICAÇÃO GERAL:
 *    - 1º a 3º: Pela fase final
 *    - 4º a 6º: Pela semifinal (eliminados da semifinal)
 *    - 7º a 16º: Pela primeira fase (eliminados da primeira fase)
 * 
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Object} Estado e funções do sistema
 */

export function useSudoku(modalidadeId) {
  const [loading, setLoading] = useState(true);
  const [todasEquipes, setTodasEquipes] = useState([]);
  const [faseAtual, setFaseAtual] = useState('primeira'); // 'primeira' | 'semifinal' | 'final' | 'concluido'
  
  const [dados, setDados] = useState({
    primeiraFase: {
      subdivisoes: [
        { 
          nome: 'Subdivisão 1 (5 equipes)', 
          equipes: [], 
          rodada1: {}, // { equipeId: { tempo, erros, tempoPenalizado } }
          rodada2: {}, // { equipeId: { tempo, erros, tempoPenalizado } }
          somatorios: {} // { equipeId: rodada1 + rodada2 }
        },
        { 
          nome: 'Subdivisão 2 (5 equipes)', 
          equipes: [], 
          rodada1: {},
          rodada2: {},
          somatorios: {}
        },
        { 
          nome: 'Subdivisão 3 (6 equipes)', 
          equipes: [], 
          rodada1: {},
          rodada2: {},
          somatorios: {}
        }
      ],
      classificados: [], // 6 equipes (2 de cada subdivisão)
      eliminados: [] // 10 equipes (7º a 16º)
    },
    semifinal: {
      equipes: [], // 6 equipes
      resultados: {}, // { equipeId: { sudoku1: {...}, sudoku2: {...}, sudoku3: {...}, somatorio } }
      classificados: [], // 3 equipes
      eliminados: [] // 3 equipes (4º a 6º)
    },
    final: {
      equipes: [], // 3 equipes
      rodadas: [], // [{ resultados: {...}, eliminados: [...] }]
      classificacaoFinal: [] // [1º, 2º, 3º]
    },
    classificacaoGeral: [] // 1º a 16º (ordem final completa)
  });

  // ========================================
  // CARREGAR DADOS DO FIRESTORE
  // ========================================
  
  useEffect(() => {
    const carregarDados = async () => {
      if (!modalidadeId) {
        setLoading(false);
        return;
      }

      try {
        // Carregar todas as equipes do sistema
        const responseEquipes = await getEquipes();
        if (responseEquipes.success) {
          setTodasEquipes(responseEquipes.data);
        }

        // Carregar dados salvos no Firestore
        const docRef = doc(db, 'sudoku', modalidadeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const dadosFirestore = docSnap.data();
          
          if (dadosFirestore.faseAtual) {
            setFaseAtual(dadosFirestore.faseAtual);
          }
          
          if (dadosFirestore.primeiraFase || dadosFirestore.semifinal || dadosFirestore.final) {
            setDados(prev => ({
              primeiraFase: dadosFirestore.primeiraFase || prev.primeiraFase,
              semifinal: dadosFirestore.semifinal || prev.semifinal,
              final: dadosFirestore.final || prev.final,
              classificacaoGeral: dadosFirestore.classificacaoGeral || []
            }));
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do Sudoku:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [modalidadeId]);

  // ========================================
  // AUTO-CLASSIFICAÇÃO PRIMEIRA FASE
  // ========================================
  
  useEffect(() => {
    if (loading || faseAtual !== 'primeira') return;

    // Verificar se TODAS as subdivisões completaram RODADA 1 E RODADA 2
    const todasCompletas = dados.primeiraFase.subdivisoes.every(subdivisao => {
      if (subdivisao.equipes.length === 0) return false;
      
      return subdivisao.equipes.every(equipe => {
        return subdivisao.rodada1[equipe.id] !== undefined &&
               subdivisao.rodada2[equipe.id] !== undefined;
      });
    });

    // Se completas e ainda não calculou somatórios
    const primeiraSubdivisao = dados.primeiraFase.subdivisoes[0];
    const jáCalculou = primeiraSubdivisao.equipes.length > 0 && 
                       Object.keys(primeiraSubdivisao.somatorios).length > 0;

    if (todasCompletas && !jáCalculou) {
      console.log('📊 Primeira Fase completa! Calculando somatórios e classificando...');
      
      setDados(prev => {
        const novosDados = { ...prev };
        const todosClassificados = [];
        const todosEliminados = [];
        
        // Para cada subdivisão
        novosDados.primeiraFase.subdivisoes.forEach(subdivisao => {
          // Calcular somatórios (rodada1 + rodada2)
          subdivisao.equipes.forEach(equipe => {
            const tempo1 = subdivisao.rodada1[equipe.id]?.tempoPenalizado || 0;
            const tempo2 = subdivisao.rodada2[equipe.id]?.tempoPenalizado || 0;
            subdivisao.somatorios[equipe.id] = tempo1 + tempo2;
          });
          
          // Ordenar por somatório e classificar 2 melhores
          const resultadosOrdenados = subdivisao.equipes
            .map(equipe => ({
              equipe,
              somatorio: subdivisao.somatorios[equipe.id]
            }))
            .sort((a, b) => a.somatorio - b.somatorio);
          
          const classificados = resultadosOrdenados.slice(0, 2);
          const eliminados = resultadosOrdenados.slice(2);
          
          todosClassificados.push(...classificados.map(r => r.equipe));
          todosEliminados.push(...eliminados.map(r => ({ ...r.equipe, somatorio: r.somatorio })));
        });
        
        // Ordenar eliminados por somatório (para classificação 7º-16º)
        todosEliminados.sort((a, b) => a.somatorio - b.somatorio);
        
        novosDados.primeiraFase.classificados = todosClassificados;
        novosDados.primeiraFase.eliminados = todosEliminados;
        
        // Salvar no Firestore
        salvarNoFirebase({
          primeiraFase: novosDados.primeiraFase
        });
        
        return novosDados;
      });
    }
  }, [dados, loading, faseAtual]);

  // ========================================
  // AUTO-CLASSIFICAÇÃO SEMIFINAL
  // ========================================
  
  useEffect(() => {
    if (loading || faseAtual !== 'semifinal') return;

    // Verificar se todas as equipes completaram os 3 sudokus
    const todasCompletas = dados.semifinal.equipes.length > 0 && 
      dados.semifinal.equipes.every(equipe => {
        const resultado = dados.semifinal.resultados[equipe.id];
        return resultado && 
               resultado.sudoku1 && 
               resultado.sudoku2 && 
               resultado.sudoku3 && 
               resultado.somatorio !== undefined;
      });

    // Se completas e ainda não classificou
    if (todasCompletas && dados.semifinal.classificados.length === 0) {
      console.log('🏆 Semifinal completa! Classificando automaticamente...');
      
      setDados(prev => {
        const novosDados = { ...prev };
        
        // Buscar somatórios da primeira fase para critério de desempate
        const getSomatoriosPrimeiraFase = () => {
          const mapaSomatorios = {};
          novosDados.primeiraFase.subdivisoes.forEach(subdivisao => {
            Object.assign(mapaSomatorios, subdivisao.somatorios);
          });
          return mapaSomatorios;
        };
        
        const somatoriosPrimeiraFase = getSomatoriosPrimeiraFase();
        
        const resultadosOrdenados = novosDados.semifinal.equipes
          .map(equipe => ({
            equipe,
            somatorio: novosDados.semifinal.resultados[equipe.id].somatorio,
            somatorioDesempate: somatoriosPrimeiraFase[equipe.id] || Infinity
          }))
          .sort((a, b) => {
            // Ordenar por somatório da semifinal
            if (a.somatorio !== b.somatorio) {
              return a.somatorio - b.somatorio;
            }
            // Em caso de empate, usar somatório da primeira fase como critério de desempate
            return a.somatorioDesempate - b.somatorioDesempate;
          });
        
        novosDados.semifinal.classificados = resultadosOrdenados.slice(0, 3).map(r => r.equipe);
        novosDados.semifinal.eliminados = resultadosOrdenados.slice(3).map(r => r.equipe);
        
        // Salvar no Firestore
        salvarNoFirebase({
          semifinal: novosDados.semifinal
        });
        
        return novosDados;
      });
    }
  }, [dados, loading, faseAtual]);

  // ========================================
  // SALVAR NO FIRESTORE
  // ========================================
  
  const salvarNoFirebase = useCallback(async (dadosAtualizados) => {
    if (!modalidadeId) return;

    try {
      const docRef = doc(db, 'sudoku', modalidadeId);
      const docSnap = await getDoc(docRef);

      const timestamp = new Date().toISOString();
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...dadosAtualizados,
          updatedAt: timestamp
        });
      } else {
        await setDoc(docRef, {
          modalidadeId,
          faseAtual: 'primeira',
          ...dadosAtualizados,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      
      console.log('✅ Dados salvos no Firestore');
    } catch (error) {
      console.error('❌ Erro ao salvar no Firestore:', error);
      throw error;
    }
  }, [modalidadeId]);

  // ========================================
  // FUNÇÕES - PRIMEIRA FASE
  // ========================================

  const salvarEquipesPrimeiraFase = useCallback(async (subdivisaoIdx, equipesIds) => {
    const equipesCompletas = equipesIds
      .map(id => todasEquipes.find(eq => eq.id === id))
      .filter(Boolean);

    setDados(prev => {
      const novosDados = { ...prev };
      novosDados.primeiraFase.subdivisoes[subdivisaoIdx].equipes = equipesCompletas;
      
      salvarNoFirebase({
        primeiraFase: novosDados.primeiraFase,
        faseAtual: 'primeira'
      });
      
      return novosDados;
    });
  }, [todasEquipes, salvarNoFirebase]);

  const salvarResultadoPrimeiraFase = useCallback(async (subdivisaoIdx, equipeId, rodada, tempo, erros) => {
    setDados(prev => {
      const novosDados = { ...prev };
      const subdivisao = novosDados.primeiraFase.subdivisoes[subdivisaoIdx];
      
      // Calcular tempo com penalidades conforme Artigo XCII
      let tempoPenalizado = Number(tempo);
      const numErros = Number(erros);
      
      if (numErros > 3 || tempo === null || tempo === '' || tempo === 0) {
        // Mais de 3 erros ou não concluiu = 16 minutos
        tempoPenalizado = 16 * 60; // 16 minutos em segundos
      } else if (numErros > 0 && numErros <= 3) {
        // Até 3 erros = tempo apagado e anotado 15 min como penalidade
        tempoPenalizado = 15 * 60; // 15 minutos FIXOS
      }
      // Se numErros === 0, mantém o tempo real (tempoPenalizado = Number(tempo))
      
      const resultado = {
        tempo: Number(tempo) || 0,
        erros: numErros,
        tempoPenalizado,
        timestamp: new Date().toISOString()
      };
      
      if (rodada === 1) {
        subdivisao.rodada1[equipeId] = resultado;
      } else if (rodada === 2) {
        subdivisao.rodada2[equipeId] = resultado;
      }
      
      salvarNoFirebase({
        primeiraFase: novosDados.primeiraFase
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  const avancarParaSemifinal = useCallback(async () => {
    setDados(prev => {
      const novosDados = { ...prev };
      
      // Copiar classificados para a semifinal
      novosDados.semifinal.equipes = [...novosDados.primeiraFase.classificados];
      
      setFaseAtual('semifinal');
      
      salvarNoFirebase({
        primeiraFase: novosDados.primeiraFase,
        semifinal: novosDados.semifinal,
        faseAtual: 'semifinal'
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  // ========================================
  // FUNÇÕES - SEMIFINAL
  // ========================================

  const salvarResultadoSemifinal = useCallback(async (equipeId, sudoku1, sudoku2, sudoku3) => {
    setDados(prev => {
      const novosDados = { ...prev };
      
      // Função auxiliar para calcular tempo penalizado conforme Artigo XCIV
      const calcularTempoPenalizado = (tempo, erros) => {
        let tempoPenalizado = Number(tempo);
        const numErros = Number(erros);
        
        if (numErros > 3 || tempo === null || tempo === '' || tempo === 0) {
          // Mais de 3 erros ou não concluiu = 25 minutos
          tempoPenalizado = 25 * 60; // 25 minutos em segundos
        } else if (numErros > 0 && numErros <= 3) {
          // Até 3 erros = 22 minutos FIXOS
          tempoPenalizado = 22 * 60; // 22 minutos FIXOS
        }
        // Se numErros === 0, mantém o tempo real
        
        return {
          tempo: Number(tempo) || 0,
          erros: numErros,
          tempoPenalizado
        };
      };
      
      const resultado1 = calcularTempoPenalizado(sudoku1.tempo, sudoku1.erros);
      const resultado2 = calcularTempoPenalizado(sudoku2.tempo, sudoku2.erros);
      const resultado3 = calcularTempoPenalizado(sudoku3.tempo, sudoku3.erros);
      
      const somatorio = resultado1.tempoPenalizado + resultado2.tempoPenalizado + resultado3.tempoPenalizado;
      
      novosDados.semifinal.resultados[equipeId] = {
        sudoku1: resultado1,
        sudoku2: resultado2,
        sudoku3: resultado3,
        somatorio,
        timestamp: new Date().toISOString()
      };
      
      salvarNoFirebase({
        semifinal: novosDados.semifinal
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  const avancarParaFinal = useCallback(async () => {
    setDados(prev => {
      const novosDados = { ...prev };
      
      // Copiar classificados para a final
      novosDados.final.equipes = [...novosDados.semifinal.classificados];
      
      setFaseAtual('final');
      
      salvarNoFirebase({
        semifinal: novosDados.semifinal,
        final: novosDados.final,
        faseAtual: 'final'
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  // ========================================
  // FUNÇÕES - FINAL
  // ========================================

  const salvarRodadaFinal = useCallback(async (resultadosRodada) => {
    // resultadosRodada = { equipeId: 'acertou' | 'errou' }
    setDados(prev => {
      const novosDados = { ...prev };
      
      const eliminadosRodada = Object.keys(resultadosRodada)
        .filter(equipeId => resultadosRodada[equipeId] === 'errou')
        .map(equipeId => novosDados.final.equipes.find(eq => eq.id === equipeId))
        .filter(Boolean);
      
      novosDados.final.rodadas.push({
        resultados: resultadosRodada,
        eliminados: eliminadosRodada,
        timestamp: new Date().toISOString()
      });
      
      salvarNoFirebase({
        final: novosDados.final
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  const finalizarCompetição = useCallback(async (classificacaoFinal) => {
    // classificacaoFinal = [equipe1º, equipe2º, equipe3º]
    setDados(prev => {
      const novosDados = { ...prev };
      
      novosDados.final.classificacaoFinal = classificacaoFinal;
      
      // Montar classificação geral completa (1º a 16º)
      const classificacaoGeral = [
        ...classificacaoFinal, // 1º, 2º, 3º
        ...novosDados.semifinal.eliminados, // 4º, 5º, 6º
        ...novosDados.primeiraFase.eliminados // 7º a 16º (já ordenados)
      ];
      
      novosDados.classificacaoGeral = classificacaoGeral;
      
      setFaseAtual('concluido');
      
      salvarNoFirebase({
        final: novosDados.final,
        classificacaoGeral,
        faseAtual: 'concluido'
      });
      
      return novosDados;
    });
  }, [salvarNoFirebase]);

  // ========================================
  // RETORNO DO HOOK
  // ========================================

  return {
    loading,
    todasEquipes,
    faseAtual,
    dados,
    
    // Primeira Fase
    salvarEquipesPrimeiraFase,
    salvarResultadoPrimeiraFase,
    avancarParaSemifinal,
    
    // Semifinal
    salvarResultadoSemifinal,
    avancarParaFinal,
    
    // Final
    salvarRodadaFinal,
    finalizarCompetição
  };
}
