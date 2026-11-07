import React, { useState } from 'react';
import { useChaves } from '../../hooks/useChaves';
import { useResultadosChaves } from '../../hooks/useResultadosChaves';
import { calcularClassificacaoChave, chaveEstaCompleta } from '../../services/chavesService';
import { gerarConfrontosQuartas, gerarConfrontosSemis, gerarConfrontosFinais, selecionarClassificados } from '../../services/pontuacaoService';
import BracketEliminatorias from '../BracketEliminatorias';
// Removido: exibição de RankingModalidade aqui para evitar duplicidade com a página de ModalidadeDetalhe
import { gerarRanking, saveRankingModalidade, getRankingModalidade } from '../../api/ranking';

/**
 * Componente completo para sistema de Chaves + Eliminatórias
 * Gerencia chaves, jogos das chaves e fase eliminatória (quartas, semis, final)
 */
function SistemaChavesEliminatorias({ 
  modalidade,
  chavesDataFromProps,
  setChavesDataFromProps,
  resultadosFromProps,
  setResultadosFromProps,
  confrontosQuartasInicial = [],
  confrontosSemisInicial = [],
  confrontosFinalInicial = null,
  resultadosEliminatoriasInicial = {},
  adminMode 
}) {
  const { id, categoria } = modalidade;
  const [todasEquipes, setTodasEquipes] = React.useState([]);
  const [confrontosQuartas, setConfrontosQuartas] = React.useState(confrontosQuartasInicial || []);
  const [confrontosSemis, setConfrontosSemis] = React.useState(confrontosSemisInicial || []);
  const [confrontosFinal, setConfrontosFinal] = React.useState(confrontosFinalInicial || null);
  const [resultadosEliminatorias, setResultadosEliminatorias] = React.useState(resultadosEliminatoriasInicial || {});
  const [ranking, setRanking] = React.useState(null);
  const [rankingSalvo, setRankingSalvo] = React.useState(false);
  const nomeModalidadeLower = (modalidade?.titulo || modalidade?.nome || id || '').toLowerCase();
  const isColetivo = (
    nomeModalidadeLower.includes('futsal') ||
    nomeModalidadeLower.includes('handebol') ||
    nomeModalidadeLower.includes('vôlei') ||
    nomeModalidadeLower.includes('volei') ||
    nomeModalidadeLower.includes('basquete')
  );
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addFase, setAddFase] = React.useState('Quartas de Final');
  const [addEquipeAId, setAddEquipeAId] = React.useState('');
  const [addEquipeBId, setAddEquipeBId] = React.useState('');

  // Hooks personalizados para gerenciar estado (precisam vir antes dos efeitos que dependem deles)
  const { chaves, setChaves, chavesCompletas } = useChaves(
    chavesDataFromProps,
    setChavesDataFromProps,
    id,
    categoria
  );

  const { getResultadoJogo, setResultadoJogo } = useResultadosChaves(
    resultadosFromProps,
    setResultadosFromProps,
    id
  );

  // Carregar todas as equipes do banco de dados
  React.useEffect(() => {
    const carregarEquipes = async () => {
      const { getEquipes } = require('../../api/equipes');
      const result = await getEquipes();
      if (result.success) {
        setTodasEquipes(result.data || []);
      }
    };
    carregarEquipes();
  }, []);

  // Carregar ranking existente do Firestore
  React.useEffect(() => {
    let isMounted = true;
    const carregarRanking = async () => {
      try {
        const result = await getRankingModalidade(id);
        if (!isMounted) return;
        if (result.success && result.data && Array.isArray(result.data.ranking) && result.data.ranking.length > 0) {
          console.log('📊 Ranking carregado do Firestore:', result.data.ranking);
          setRanking(result.data.ranking);
          setRankingSalvo(true);
        } else {
          console.log('ℹ️ Nenhum ranking salvo para', id);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar ranking da modalidade', id, err);
      }
    };
    carregarRanking();
    return () => { isMounted = false; };
  }, [id]);

  // Log sempre que ranking mudar
  React.useEffect(() => {
    console.log('🔄 Estado do ranking atualizado:', ranking);
    console.log('   Ranking é array?', Array.isArray(ranking));
    console.log('   Quantidade de itens:', ranking?.length || 0);
  }, [ranking]);

  // Gerar e salvar ranking quando a final for concluída
  React.useEffect(() => {
    const gerarESalvarRanking = async () => {
      console.log('🔍 Verificando condições para gerar ranking...');
      console.log('   confrontosFinal:', confrontosFinal);
      console.log('   resultadosEliminatorias:', resultadosEliminatorias);
      console.log('   rankingSalvo:', rankingSalvo);
      console.log('   chaves disponíveis:', chaves.length);
      console.log('   confrontosQuartas:', confrontosQuartas.length);
      console.log('   confrontosSemis:', confrontosSemis.length);

      // Verificar se a final existe
      if (!confrontosFinal) {
        console.log('   ❌ confrontosFinal não existe');
        return;
      }

      // Verificar se a final tem resultado
      if (!resultadosEliminatorias || !resultadosEliminatorias[confrontosFinal.id]) {
        console.log('   ❌ Final ainda não tem resultado. ID:', confrontosFinal.id);
        console.log('   IDs disponíveis:', Object.keys(resultadosEliminatorias || {}));
        return;
      }

      // Verificar se temos as chaves necessárias
      if (!chaves || chaves.length === 0) {
        console.log('   ❌ Chaves não disponíveis');
        return;
      }

      // Verificar se temos os confrontos necessários
      if (!confrontosQuartas || confrontosQuartas.length === 0) {
        console.log('   ❌ Confrontos das quartas não disponíveis');
        return;
      }

      // Verificar se o ranking já foi salvo
      if (rankingSalvo) {
        console.log('   ℹ️ Ranking já foi salvo anteriormente');
        return;
      }

      console.log('   ✅ Todas as condições atendidas! Gerando ranking...');

      // Helper para obter nome da equipe (string ou objeto)
      const getNomeEquipe = (equipe) => {
        if (!equipe) return null;
        return typeof equipe === 'string' ? equipe : equipe.nome || null;
      };

      // Extrair vencedor e perdedor da final
      const resultadoFinal = resultadosEliminatorias[confrontosFinal.id];
      const campeao = resultadoFinal.scoreA > resultadoFinal.scoreB 
        ? getNomeEquipe(confrontosFinal.equipeA)
        : getNomeEquipe(confrontosFinal.equipeB);
      const vice = resultadoFinal.scoreA > resultadoFinal.scoreB 
        ? getNomeEquipe(confrontosFinal.equipeB)
        : getNomeEquipe(confrontosFinal.equipeA);

      // Extrair terceiro e quarto lugar (perdedores das semis)
      let terceiro = null;
      let quarto = null;
      
      const perdedoresSemis = confrontosSemis.map(semi => {
        const resultadoSemi = resultadosEliminatorias[semi.id];
        if (!resultadoSemi) return null;
        return resultadoSemi.scoreA > resultadoSemi.scoreB 
          ? getNomeEquipe(semi.equipeB)
          : getNomeEquipe(semi.equipeA);
      }).filter(Boolean);
      
      if (perdedoresSemis.length >= 1) terceiro = perdedoresSemis[0];
      if (perdedoresSemis.length >= 2) quarto = perdedoresSemis[1];

      // Extrair eliminados nas quartas
      const eliminadosQuartas = confrontosQuartas.map(quarta => {
        const resultadoQuarta = resultadosEliminatorias[quarta.id];
        if (!resultadoQuarta) return null;
        return resultadoQuarta.scoreA > resultadoQuarta.scoreB 
          ? getNomeEquipe(quarta.equipeB)
          : getNomeEquipe(quarta.equipeA);
      }).filter(Boolean);

      // Extrair todas as equipes das chaves (para pegar os não classificados)
      const todasEquipesChaves = [];
      chaves.forEach(chave => {
        chave.equipes.forEach(equipe => {
          if (equipe && equipe.trim() !== '') {
            todasEquipesChaves.push(equipe);
          }
        });
      });

      // Equipes classificadas (as 8 que jogaram as quartas)
      const equipesClassificadas = [];
      confrontosQuartas.forEach(quarta => {
        equipesClassificadas.push(getNomeEquipe(quarta.equipeA));
        equipesClassificadas.push(getNomeEquipe(quarta.equipeB));
      });

      // Eliminados nas chaves (não classificados para as quartas)
      const eliminadosChaves = todasEquipesChaves.filter(equipe => 
        !equipesClassificadas.includes(equipe)
      );

      // Gerar ranking
      const classificacaoFinal = {
        campeao,
        vice,
        terceiro,
        quarto,
        eliminadosQuartas,
        eliminadosChaves
      };

      console.log('🏆 Gerando ranking com classificação final:', classificacaoFinal);
      const rankingGerado = gerarRanking(classificacaoFinal, todasEquipes);
      console.log('📊 Ranking gerado:', rankingGerado);
      console.log('📊 Número de itens no ranking:', rankingGerado.length);
      
      // Salvar ranking no estado PRIMEIRO
      setRanking(rankingGerado);
      console.log('✅ Ranking definido no estado local');
      
      // Depois salvar no Firestore
      const result = await saveRankingModalidade(id, rankingGerado);
      if (result.success) {
        console.log('✅ Ranking salvo com sucesso no Firestore!');
        setRankingSalvo(true);
      } else {
        console.error('❌ Erro ao salvar ranking:', result.error);
      }
    };

    gerarESalvarRanking();
  }, [confrontosFinal, resultadosEliminatorias, confrontosSemis, confrontosQuartas, rankingSalvo, id, todasEquipes, chaves]);

  // Carregar confrontos/resultados salvos quando o componente monta (se existirem)
  React.useEffect(() => {
    // confrontosQuartasInicial etc já inicialmente populados via props do HOC
    // Converter resultadosEliminatoriasInicial (obj) para o formato local se necessário
    if (resultadosEliminatorias && Object.keys(resultadosEliminatorias).length > 0) return;

    if (resultadosEliminatoriasInicial && Object.keys(resultadosEliminatoriasInicial).length > 0) {
      setResultadosEliminatorias(resultadosEliminatoriasInicial);
    }
  }, [resultadosEliminatoriasInicial]);

  // Gerar e persistir confrontos quando as chaves ficarem completas e ainda não houver confrontos salvos
  React.useEffect(() => {
    const gerarESalvarQuartas = async (classificados) => {
      const novosConfrontos = gerarConfrontosQuartas(classificados);
      setConfrontosQuartas(novosConfrontos);

      try {
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, {
          confrontosQuartas: novosConfrontos,
          confrontosSemis: [],
          confrontosFinal: null
        });
        console.log('✅ Quartas salvas para', id);
      } catch (err) {
        console.error('Erro ao salvar quartas:', err);
      }
    };

    // Se chaves completas e não temos quartas carregadas, gerar
    if (isColetivo) {
      // Modo manual: não gerar automaticamente
      return;
    }
    if (chavesCompletas && (!confrontosQuartas || confrontosQuartas.length === 0)) {
      const chavesComClassificacao = chaves.map((chave, chaveIdx) => {
        const eqs = chave.equipes;
        const resultadosChave = {};
        for (let jogoIdx = 0; jogoIdx < 3; jogoIdx++) {
          const res = getResultadoJogo(chaveIdx, jogoIdx) || null;
        if (res) resultadosChave[jogoIdx] = res;
      }
      const classificacao = calcularClassificacaoChave(eqs, resultadosChave, { modalidade: (modalidade?.titulo || modalidade?.nome || id || '').toLowerCase() });
      return { nome: chave.nome, equipes: eqs, classificacao };
    }).filter(Boolean);

      const { classificados } = selecionarClassificados(chavesComClassificacao, categoria === 'masculino');
      if (classificados && classificados.length === 8) {
        gerarESalvarQuartas(classificados);
      }
    }
  }, [chavesCompletas, chaves, confrontosQuartas, getResultadoJogo, id, categoria, isColetivo]);  // Gerar semifinais quando todas as quartas tiverem resultado
  React.useEffect(() => {
    const gerarESalvarSemis = async (vencedores) => {
      const novosConfrontos = gerarConfrontosSemis(vencedores);
      setConfrontosSemis(novosConfrontos);

      try {
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, {
          confrontosQuartas,
          confrontosSemis: novosConfrontos,
          confrontosFinal: null
        });
        console.log('✅ Semifinais salvas para', id);
      } catch (err) {
        console.error('Erro ao salvar semifinais:', err);
      }
    };

    // Verificar se todas as quartas têm resultado
  if (isColetivo) return; // Modo manual
  if (confrontosQuartas && confrontosQuartas.length === 4 && (!confrontosSemis || confrontosSemis.length === 0)) {
      const todasQuartasCompletas = confrontosQuartas.every(c => {
        const res = resultadosEliminatorias[c.id];
        return res && res.scoreA !== undefined && res.scoreB !== undefined;
      });

      if (todasQuartasCompletas) {
        // Determinar vencedores das quartas
        const vencedores = confrontosQuartas.map(c => {
          const res = resultadosEliminatorias[c.id];
          return res.scoreA > res.scoreB ? c.equipeA : c.equipeB;
        });

        gerarESalvarSemis(vencedores);
      }
    }
  }, [confrontosQuartas, resultadosEliminatorias, confrontosSemis, id, isColetivo]);

  // Gerar final quando ambas as semifinais tiverem resultado
  React.useEffect(() => {
    const gerarESalvarFinal = async (vencedores, perdedores) => {
      const { final, terceiro } = gerarConfrontosFinais(vencedores, perdedores);
      setConfrontosFinal(final);

      try {
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, {
          confrontosQuartas,
          confrontosSemis,
          confrontosFinal: final
        });
        console.log('✅ Final salva para', id);
      } catch (err) {
        console.error('Erro ao salvar final:', err);
      }
    };

    // Verificar se ambas as semifinais têm resultado
  if (isColetivo) return; // Modo manual
  if (confrontosSemis && confrontosSemis.length === 2 && !confrontosFinal) {
      const todasSemisCompletas = confrontosSemis.every(c => {
        const res = resultadosEliminatorias[c.id];
        return res && res.scoreA !== undefined && res.scoreB !== undefined;
      });

      if (todasSemisCompletas) {
        // Determinar vencedores e perdedores das semis
        const vencedores = confrontosSemis.map(c => {
          const res = resultadosEliminatorias[c.id];
          return res.scoreA > res.scoreB ? c.equipeA : c.equipeB;
        });

        const perdedores = confrontosSemis.map(c => {
          const res = resultadosEliminatorias[c.id];
          return res.scoreA <= res.scoreB ? c.equipeA : c.equipeB;
        });

        gerarESalvarFinal(vencedores, perdedores);
      }
    }
  }, [confrontosSemis, resultadosEliminatorias, confrontosFinal, id, confrontosQuartas, isColetivo]);

  // Modal state and handlers (must be inside component)
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalConfronto, setModalConfronto] = React.useState({});
  const [modalScoreA, setModalScoreA] = React.useState('');
  const [modalScoreB, setModalScoreB] = React.useState('');

  function openModal(confronto) {
    setModalConfronto(confronto);
    const res = resultadosEliminatorias[confronto.id];
    setModalScoreA(res?.scoreA ?? '');
    setModalScoreB(res?.scoreB ?? '');
    setModalOpen(true);
  }

  // ===================== ADICIONAR JOGO (MODO MANUAL) =====================
  async function handleAddGame(e) {
    e?.preventDefault?.();
    if (!addEquipeAId || !addEquipeBId) {
      alert('Selecione as duas equipes.');
      return;
    }
    if (addEquipeAId === addEquipeBId) {
      alert('As equipes devem ser diferentes.');
      return;
    }

    const equipeA = todasEquipes.find(eq => eq.id === addEquipeAId);
    const equipeB = todasEquipes.find(eq => eq.id === addEquipeBId);
    if (!equipeA || !equipeB) {
      alert('Equipes inválidas.');
      return;
    }

    const faseKey = addFase.toLowerCase().includes('quartas') ? 'quartas' : addFase.toLowerCase().includes('semi') ? 'semis' : 'final';
    const novoConfronto = {
      id: `${faseKey}-${Date.now()}`,
      equipeA: { id: equipeA.id, nome: equipeA.nome },
      equipeB: { id: equipeB.id, nome: equipeB.nome },
      fase: addFase,
      jogo: 1
    };

    try {
      if (faseKey === 'quartas') {
        const next = [...(confrontosQuartas || [])];
        novoConfronto.jogo = next.length + 1;
        next.push(novoConfronto);
        setConfrontosQuartas(next);
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, { confrontosQuartas: next, confrontosSemis, confrontosFinal });
      } else if (faseKey === 'semis') {
        const next = [...(confrontosSemis || [])];
        novoConfronto.jogo = next.length + 1;
        next.push(novoConfronto);
        setConfrontosSemis(next);
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, { confrontosQuartas, confrontosSemis: next, confrontosFinal });
      } else {
        if (confrontosFinal) {
          alert('A final já existe. Edite a existente ou remova manualmente no banco.');
          return;
        }
        const final = { ...novoConfronto, id: 'final', jogo: 1 };
        setConfrontosFinal(final);
        const { saveConfrontosEliminatorias } = require('../../api/resultados');
        await saveConfrontosEliminatorias(id, { confrontosQuartas, confrontosSemis, confrontosFinal: final });
      }
      setAddModalOpen(false);
      setAddEquipeAId('');
      setAddEquipeBId('');
    } catch (err) {
      console.error('Erro ao adicionar jogo:', err);
      alert('Erro ao adicionar jogo. Veja o console.');
    }
  }

  async function handleSaveModal(e) {
    e.preventDefault();
    const confrontoId = modalConfronto.id;
    const payload = {
      equipeA: modalConfronto.equipeA.nome,
      equipeB: modalConfronto.equipeB.nome,
      scoreA: Number(modalScoreA),
      scoreB: Number(modalScoreB),
      fase: modalConfronto.fase
    };

    // Atualizar estado local
    setResultadosEliminatorias(prev => ({ ...prev, [confrontoId]: { scoreA: payload.scoreA, scoreB: payload.scoreB } }));

    // Persistir no Firestore
    try {
      const { saveResultadoJogoEliminatoria, saveConfrontosEliminatorias } = require('../../api/resultados');
      await saveResultadoJogoEliminatoria(id, confrontoId, modalConfronto.fase, payload);
      // também atualizar confrontos no documento para garantir consistência
      await saveConfrontosEliminatorias(id, { confrontosQuartas, confrontosSemis, confrontosFinal });
      setModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar resultado eliminatória:', err);
      alert('Erro ao salvar resultado. Veja o console para mais detalhes.');
    }
  }

  return (
    <div className="sistema-chaves-eliminatorias">
      {/* Tabela de Chaves */}
      <TabelaChaves 
        chaves={chaves} 
        setChaves={setChaves} 
        adminMode={adminMode}
        equipesDisponiveis={todasEquipes}
        modalidadeId={id}
      />
      
      {/* Jogos das Chaves */}
      <TabelaJogosChaves 
        chaves={chaves}
        getResultadoJogo={getResultadoJogo}
        setResultadoJogo={setResultadoJogo}
        adminMode={adminMode}
        modalidadeId={id}
        modalidadeNome={modalidade?.titulo || modalidade?.nome || id}
      />
      
      {/* Eliminatórias (só renderiza se todas as chaves estiverem completas) */}
      {chavesCompletas && (
        <div style={{ marginTop: 24 }}>
          <article className="card">
            <div className="card__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="card__title">🏆 Fase Eliminatória</h3>
              {adminMode && isColetivo && (
                <button className="btn btn--primary" onClick={() => setAddModalOpen(true)}>➕ Adicionar Jogo</button>
              )}
            </div>
            <div className="card__body">
              
              {/* Bracket Visual */}
              {confrontosQuartas && confrontosQuartas.length > 0 && (
                <BracketEliminatorias
                  confrontosQuartas={confrontosQuartas}
                  confrontosSemis={confrontosSemis}
                  confrontosFinal={confrontosFinal}
                  resultadosEliminatorias={resultadosEliminatorias}
                  onEditarResultado={openModal}
                  adminMode={adminMode}
                />
              )}

              {/* Modal para inserir resultado */}
              {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Resultado — {modalConfronto.fase}</h3>
                    <p style={{ color: 'var(--muted)' }}>{modalConfronto.equipeA?.nome} vs {modalConfronto.equipeB?.nome}</p>
                    <form onSubmit={handleSaveModal} className="form">
                      <div className="row">
                        <label>{modalConfronto.equipeA?.nome}</label>
                        <input type="number" min="0" value={modalScoreA} onChange={(e) => setModalScoreA(e.target.value)} required />
                      </div>
                      <div className="row">
                        <label>{modalConfronto.equipeB?.nome}</label>
                        <input type="number" min="0" value={modalScoreB} onChange={(e) => setModalScoreB(e.target.value)} required />
                      </div>
                      <div className="actions">
                        <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn--primary">💾 Salvar Resultado</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Botão de DEBUG - sempre visível para admin */}
              {adminMode && (
                <div style={{ marginTop: 24, padding: 16, background: '#e3f2fd', borderRadius: 8, border: '1px solid #2196f3' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1976d2', marginBottom: 12 }}>
                      🐛 DEBUG: Ver Estado Atual do Ranking
                    </summary>
                    <div style={{ fontSize: 14, fontFamily: 'monospace', background: '#fff', padding: 12, borderRadius: 4, marginTop: 8 }}>
                      <p><strong>confrontosFinal:</strong> {confrontosFinal ? '✅ Existe' : '❌ Null'}</p>
                      {confrontosFinal && (
                        <>
                          <p style={{ marginLeft: 16 }}>ID: {confrontosFinal.id}</p>
                          <p style={{ marginLeft: 16 }}>Equipes: {confrontosFinal.equipeA?.nome} vs {confrontosFinal.equipeB?.nome}</p>
                        </>
                      )}
                      <p><strong>Resultado da Final:</strong> {confrontosFinal && resultadosEliminatorias[confrontosFinal?.id] ? '✅ Existe' : '❌ Não existe'}</p>
                      {confrontosFinal && resultadosEliminatorias[confrontosFinal?.id] && (
                        <p style={{ marginLeft: 16 }}>
                          Placar: {resultadosEliminatorias[confrontosFinal.id].scoreA} x {resultadosEliminatorias[confrontosFinal.id].scoreB}
                        </p>
                      )}
                      <p><strong>rankingSalvo:</strong> {rankingSalvo ? '✅ Sim' : '❌ Não'}</p>
                      <p><strong>ranking no estado:</strong> {ranking ? `✅ Existe (${ranking.length} posições)` : '❌ Null'}</p>
                      <p><strong>confrontosSemis:</strong> {confrontosSemis?.length || 0} confrontos</p>
                      <p><strong>confrontosQuartas:</strong> {confrontosQuartas?.length || 0} confrontos</p>
                      <p><strong>IDs em resultadosEliminatorias:</strong></p>
                      <pre style={{ marginLeft: 16, fontSize: 12 }}>{JSON.stringify(Object.keys(resultadosEliminatorias || {}), null, 2)}</pre>
                    </div>
                    
                    {confrontosFinal && resultadosEliminatorias[confrontosFinal?.id] && (
                      <button 
                        className="btn btn--primary"
                        style={{ marginTop: 12, width: '100%' }}
                        onClick={async () => {
                          console.log('🔘 Gerando ranking manualmente...');
                          
                          try {
                            // Helper para obter nome da equipe (string ou objeto)
                            const getNomeEquipe = (equipe) => {
                              if (!equipe) return null;
                              return typeof equipe === 'string' ? equipe : equipe.nome || null;
                            };

                            const resultadoFinal = resultadosEliminatorias[confrontosFinal.id];
                            const campeao = resultadoFinal.scoreA > resultadoFinal.scoreB 
                              ? getNomeEquipe(confrontosFinal.equipeA)
                              : getNomeEquipe(confrontosFinal.equipeB);
                            const vice = resultadoFinal.scoreA > resultadoFinal.scoreB 
                              ? getNomeEquipe(confrontosFinal.equipeB)
                              : getNomeEquipe(confrontosFinal.equipeA);

                            const perdedoresSemis = confrontosSemis.map(semi => {
                              const resultadoSemi = resultadosEliminatorias[semi.id];
                              if (!resultadoSemi) return null;
                              return resultadoSemi.scoreA > resultadoSemi.scoreB 
                                ? getNomeEquipe(semi.equipeB)
                                : getNomeEquipe(semi.equipeA);
                            }).filter(Boolean);
                            
                            const terceiro = perdedoresSemis[0] || null;
                            const quarto = perdedoresSemis[1] || null;

                            const eliminadosQuartas = confrontosQuartas.map(quarta => {
                              const resultadoQuarta = resultadosEliminatorias[quarta.id];
                              if (!resultadoQuarta) return null;
                              return resultadoQuarta.scoreA > resultadoQuarta.scoreB 
                                ? getNomeEquipe(quarta.equipeB)
                                : getNomeEquipe(quarta.equipeA);
                            }).filter(Boolean);

                            // Extrair todas as equipes das chaves
                            const todasEquipesChaves = [];
                            chaves.forEach(chave => {
                              chave.equipes.forEach(equipe => {
                                if (equipe && equipe.trim() !== '') {
                                  todasEquipesChaves.push(equipe);
                                }
                              });
                            });

                            // Equipes classificadas (as 8 que jogaram as quartas)
                            const equipesClassificadas = [];
                            confrontosQuartas.forEach(quarta => {
                              equipesClassificadas.push(getNomeEquipe(quarta.equipeA));
                              equipesClassificadas.push(getNomeEquipe(quarta.equipeB));
                            });

                            // Eliminados nas chaves (não classificados)
                            const eliminadosChaves = todasEquipesChaves.filter(equipe => 
                              !equipesClassificadas.includes(equipe)
                            );

                            const classificacaoFinal = { 
                              campeao, 
                              vice, 
                              terceiro, 
                              quarto, 
                              eliminadosQuartas,
                              eliminadosChaves 
                            };
                            console.log('🏆 Classificação Final:', classificacaoFinal);
                            
                            const rankingGerado = gerarRanking(classificacaoFinal, todasEquipes);
                            console.log('📊 Ranking Gerado:', rankingGerado);
                            
                            setRanking(rankingGerado);
                            
                            const result = await saveRankingModalidade(id, rankingGerado);
                            if (result.success) {
                              console.log('✅ Ranking salvo no Firestore!');
                              setRankingSalvo(true);
                              alert('✅ Ranking gerado e salvo com sucesso!');
                            } else {
                              console.error('❌ Erro ao salvar:', result.error);
                              alert('❌ Erro ao salvar ranking: ' + result.error);
                            }
                          } catch (error) {
                            console.error('❌ Erro ao gerar ranking:', error);
                            alert('❌ Erro: ' + error.message);
                          }
                        }}
                      >
                        🔧 Gerar Ranking Manualmente
                      </button>
                    )}
                  </details>
                </div>
              )}

              {/* Modal Adicionar Jogo (modo manual para esportes coletivos) */}
              {addModalOpen && (
                <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Adicionar Jogo</h3>
                    <form onSubmit={handleAddGame} className="form">
                      <div className="row">
                        <label>Fase</label>
                        <select className="inputLogin" value={addFase} onChange={(e)=>setAddFase(e.target.value)}>
                          <option>Quartas de Final</option>
                          <option>Semifinal</option>
                          <option>Final</option>
                        </select>
                      </div>
                      <div className="row">
                        <label>Equipe A</label>
                        <select className="inputLogin" value={addEquipeAId} onChange={(e)=>setAddEquipeAId(e.target.value)}>
                          <option value="">Selecione...</option>
                          {todasEquipes.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="row">
                        <label>Equipe B</label>
                        <select className="inputLogin" value={addEquipeBId} onChange={(e)=>setAddEquipeBId(e.target.value)}>
                          <option value="">Selecione...</option>
                          {todasEquipes.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="actions">
                        <button type="button" className="btn btn--ghost" onClick={()=>setAddModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn--primary">💾 Salvar Jogo</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {/* Exibição do ranking final foi removida deste componente para evitar duplicidade.
          O ranking (visualização pública e editor admin) agora é renderizado somente em ModalidadeDetalhe.jsx */}
    </div>
  );
}

// ========== SUBCOMPONENTES ==========

/**
 * Tabela para preencher nomes das equipes em cada chave
 * Agora usando dropdown de equipes pré-existentes no banco de dados
 */
function TabelaChaves({ chaves, setChaves, adminMode, equipesDisponiveis = [], modalidadeId }) {
  const nome = (modalidadeId || '').toLowerCase();
  const isFifa = nome.includes('fifa');
  const isMK = nome.includes('mortal') || nome.includes('kombat');
  const numEquipes = (isFifa || isMK) ? 4 : 3;
  const [salvando, setSalvando] = useState(false);
  const [mensagemSalvar, setMensagemSalvar] = useState(null);

  if (!Array.isArray(chaves) || chaves.length === 0) {
    return (
      <article className="card" style={{ margin: "0 auto 18px", width: "70%", maxWidth: "none" }}>
        <div className="card__header"><h2 className="card__title">🔑 Chaves da Modalidade</h2></div>
        <div className="card__body">
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>
            ⚠️ Erro ao carregar chaves. Por favor, recarregue a página.
          </p>
        </div>
      </article>
    );
  }

  // Função para obter todas as equipes já selecionadas (para evitar duplicação)
  const getEquipesSelecionadas = () => {
    const selecionadas = new Set();
    chaves.forEach((chave) => {
      if (chave.equipesIds && Array.isArray(chave.equipesIds)) {
        chave.equipesIds.forEach((id) => {
          if (id) selecionadas.add(id);
        });
      }
    });
    return selecionadas;
  };

  const handleEquipeChange = (equipeIdx, chaveIdx, equipeId) => {
    const equipeSelecionada = equipesDisponiveis.find((e) => e.id === equipeId);

    setChaves((prev) => {
      const next = prev.map((chave, i) => {
        if (i === chaveIdx) {
          const newEquipes = [...chave.equipes];
          newEquipes[equipeIdx] = equipeSelecionada ? equipeSelecionada.nome : "";

          const newEquipesIds = chave.equipesIds || [];
          newEquipesIds[equipeIdx] = equipeId;

          return { ...chave, equipes: newEquipes, equipesIds: newEquipesIds };
        }
        return chave;
      });
      return next;
    });

    // Limpar mensagem ao fazer mudanças
    if (mensagemSalvar) setMensagemSalvar(null);
  };

  const handleSalvarChaves = async () => {
    if (!adminMode || !modalidadeId) return;

    // Verificar se todas as chaves têm equipes preenchidas
    const chavesIncompletas = chaves.some(chave => 
      chave.equipes.some((equipe, idx) => !equipe || equipe.trim() === "")
    );

    if (chavesIncompletas) {
      setMensagemSalvar({ 
        tipo: "erro", 
        texto: "⚠️ Preencha todas as equipes antes de salvar!" 
      });
      return;
    }

    setSalvando(true);
    setMensagemSalvar(null);

    try {
      const { saveChaves } = require('../../api/resultados');
      const result = await saveChaves(modalidadeId, { chaves });

      if (result.success) {
        setMensagemSalvar({ 
          tipo: "sucesso", 
          texto: "✅ Chaves salvas com sucesso!" 
        });
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => setMensagemSalvar(null), 3000);
      } else {
        setMensagemSalvar({ 
          tipo: "erro", 
          texto: `❌ Erro ao salvar: ${result.error}` 
        });
      }
    } catch (error) {
      console.error("Erro ao salvar chaves:", error);
      setMensagemSalvar({ 
        tipo: "erro", 
        texto: "❌ Erro ao salvar chaves. Tente novamente." 
      });
    } finally {
      setSalvando(false);
    }
  };

  const equipesSelecionadas = getEquipesSelecionadas();

  return (
    <article className="card chaves-card" style={{ margin: "0 auto 18px", width: "70%", maxWidth: "none" }}>
      <div className="card__header"><h2 className="card__title">🔑 Chaves da Modalidade</h2></div>
      <div className="card__body">
        {equipesDisponiveis.length === 0 && adminMode && (
          <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "#fff3cd", borderRadius: "4px", color: "#856404" }}>
            ⚠️ Nenhuma equipe encontrada no banco de dados. Por favor, cadastre equipes primeiro.
          </div>
        )}
        <table className="home-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th>Equipe</th>
              {chaves.map((chave, chaveIdx) => (
                <th key={chaveIdx}>{chave.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(numEquipes)].map((_, equipeIdx) => (
              <tr key={equipeIdx}>
                <td style={{ fontWeight: 700 }}>Equipe {equipeIdx + 1}</td>
                {chaves.map((chave, chaveIdx) => {
                  const equipeIdSelecionada = chave.equipesIds?.[equipeIdx] || "";
                  
                  return (
                    <td key={chaveIdx}>
                      {adminMode ? (
                        <select
                          className="inputLogin"
                          value={equipeIdSelecionada}
                          onChange={(e) => handleEquipeChange(equipeIdx, chaveIdx, e.target.value)}
                          style={{ width: "90%", minWidth: 80 }}
                        >
                          <option value="">Selecione...</option>
                          {equipesDisponiveis.map((equipe) => {
                            const jaUsada = equipesSelecionadas.has(equipe.id) && equipe.id !== equipeIdSelecionada;
                            return (
                              <option 
                                key={equipe.id} 
                                value={equipe.id}
                                disabled={jaUsada}
                              >
                                {equipe.nome} {jaUsada ? "(já selecionada)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span>
                          {chave.equipes[equipeIdx] || (
                            <span style={{ color: "var(--muted)" }}>Equipe {equipeIdx + 1}</span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botão Salvar Chaves e Mensagem de Feedback */}
        {adminMode && equipesDisponiveis.length > 0 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button 
              className="btn btn--primary" 
              onClick={handleSalvarChaves}
              disabled={salvando}
              style={{ 
                padding: "12px 32px",
                fontSize: "16px",
                fontWeight: 600,
                minWidth: "200px"
              }}
            >
              {salvando ? (
                <>
                  <span className="spinner" style={{ marginRight: "8px" }}></span>
                  Salvando...
                </>
              ) : (
                "💾 Salvar Chaves"
              )}
            </button>

            {mensagemSalvar && (
              <div style={{ 
                marginTop: "12px",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: 500,
                background: mensagemSalvar.tipo === "sucesso" 
                  ? "rgba(34, 197, 94, 0.15)" 
                  : "rgba(239, 68, 68, 0.15)",
                color: mensagemSalvar.tipo === "sucesso" 
                  ? "#22c55e" 
                  : "#ef4444",
                border: `1px solid ${mensagemSalvar.tipo === "sucesso" ? "#22c55e" : "#ef4444"}20`
              }}>
                {mensagemSalvar.texto}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Tabela de jogos por chave com resultados e classificação
 */
function TabelaJogosChaves({ chaves, getResultadoJogo, setResultadoJogo, adminMode, modalidadeId, modalidadeNome }) {
  const [modalJogo, setModalJogo] = useState({
    open: false,
    chaveIdx: null,
    jogoIdx: null,
    equipeA: "",
    equipeB: "",
    scoreA: "",
    scoreB: "",
    meta: {},
    modalidadeNome: modalidadeNome || ''
  });
  const [salvandoResultado, setSalvandoResultado] = useState(false);
  const [mensagemSalvarResultado, setMensagemSalvarResultado] = useState(null);
  const [, forceUpdate] = useState({}); // Para forçar re-render

  const openModal = (chaveIdx, jogoIdx, equipeA, equipeB) => {
    const resultado = getResultadoJogo(chaveIdx, jogoIdx);
    setModalJogo({
      open: true,
      chaveIdx,
      jogoIdx,
      equipeA,
      equipeB,
      scoreA: resultado?.scoreA ?? "",
      scoreB: resultado?.scoreB ?? "",
      meta: resultado?.meta || {},
      modalidadeNome: modalidadeNome || ''
    });
    setMensagemSalvarResultado(null);
  };

  const closeModal = () => {
    setModalJogo({ ...modalJogo, open: false });
    setMensagemSalvarResultado(null);
  };

  const saveModal = async (dadosModal) => {
    const { chaveIdx, jogoIdx, scoreA, scoreB, equipeA, equipeB, meta } = dadosModal;

    // Validação básica
    if (scoreA === "" || scoreB === "") {
      setMensagemSalvarResultado({ 
        tipo: "erro", 
        texto: "⚠️ Preencha ambos os placares!" 
      });
      return;
    }

    setSalvandoResultado(true);
    setMensagemSalvarResultado(null);

    try {
      // 1. Atualizar no estado local (hook)
      setResultadoJogo(chaveIdx, jogoIdx, equipeA, equipeB, scoreA, scoreB, meta || {});

      // 2. Salvar no Firebase
      const { saveResultadoJogoChave } = require('../../api/resultados');
      const result = await saveResultadoJogoChave(modalidadeId, chaveIdx, jogoIdx, {
        equipeA,
        equipeB,
        scoreA,
        scoreB,
        meta: meta || {}
      });

      if (result.success) {
        setMensagemSalvarResultado({ 
          tipo: "sucesso", 
          texto: "✅ Resultado salvo com sucesso!" 
        });
        
        // Forçar re-render para atualizar classificação
        forceUpdate({});
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setMensagemSalvarResultado({ 
          tipo: "erro", 
          texto: `❌ Erro: ${result.error}` 
        });
      }
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
      setMensagemSalvarResultado({ 
        tipo: "erro", 
        texto: "❌ Erro ao salvar resultado. Tente novamente." 
      });
    } finally {
      setSalvandoResultado(false);
    }
  };

  return (
    <div style={{ margin: "24px auto 18px", maxWidth: 880 }}>
      {chaves.map((chave, chaveIdx) => {
        const eqs = chave.equipes;
        const filled = chaveEstaCompleta(chave);
        if (!filled) return null;

        const jogos = [
          { equipeA: eqs[0], equipeB: eqs[1] },
          { equipeA: eqs[1], equipeB: eqs[2] },
          { equipeA: eqs[2], equipeB: eqs[0] }
        ];

        return (
          <article className="card" key={chave.nome} style={{ marginBottom: 18 }}>
            <div className="card__header"><h3 className="card__title">Jogos da {chave.nome}</h3></div>
            <div className="card__body">
              <table className="home-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Jogo</th>
                    <th>Equipe A</th>
                    <th>Equipe B</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {jogos.map((jogo, jogoIdx) => {
                    const resultado = getResultadoJogo(chaveIdx, jogoIdx);
                    return (
                      <tr key={jogoIdx}>
                        <td>{jogoIdx + 1}</td>
                        <td>{jogo.equipeA}</td>
                        <td>{jogo.equipeB}</td>
                        <td>
                          {resultado ? (
                            <span style={{ fontWeight: 700 }}>
                              {resultado.scoreA} x {resultado.scoreB}
                              {adminMode && (
                                <button
                                  className="btn btn--ghost"
                                  onClick={() => openModal(chaveIdx, jogoIdx, jogo.equipeA, jogo.equipeB)}
                                  style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
                                >
                                  Editar
                                </button>
                              )}
                            </span>
                          ) : adminMode ? (
                            <button
                              className="btn btn--primary"
                              onClick={() => openModal(chaveIdx, jogoIdx, jogo.equipeA, jogo.equipeB)}
                              style={{ padding: "6px 12px", fontSize: 13 }}
                            >
                              Inserir Resultado
                            </button>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>Aguardando</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Classificação */}
              <ClassificacaoChave chaveIdx={chaveIdx} equipes={eqs} getResultadoJogo={getResultadoJogo} modalidadeNome={modalidadeNome} />
            </div>
          </article>
        );
      })}

      {/* Modal de Edição */}
      {modalJogo.open && (
          <ModalResultado
          modalJogo={modalJogo}
          onSave={saveModal}
          onClose={closeModal}
          salvando={salvandoResultado}
            mensagem={mensagemSalvarResultado}
            modalidadeNome={modalidadeNome || ''}
        />
      )}
    </div>
  );
}

/**
 * Classificação de uma chave
 */
function ClassificacaoChave({ chaveIdx, equipes, getResultadoJogo, modalidadeNome }) {
  const resultadosChave = {};
  for (let jogoIdx = 0; jogoIdx < 3; jogoIdx++) {
    const resultado = getResultadoJogo(chaveIdx, jogoIdx);
    if (resultado) {
      resultadosChave[jogoIdx] = resultado;
    }
  }

  if (Object.keys(resultadosChave).length === 0) return null;

  const classificacao = calcularClassificacaoChave(
    equipes,
    resultadosChave,
    { modalidade: (modalidadeNome || '').toLowerCase() }
  );

  const nome = (modalidadeNome || '').toLowerCase();
  const isVoleiPraia = nome.includes('praia');
  const isVolei = nome.includes('vôlei') || nome.includes('volei');
  const isFutsal = nome.includes('futsal');
  const isHand = nome.includes('handebol');
  const isBasq = nome.includes('basquete');
  const isFifa = nome.includes('fifa');
  const isMK = nome.includes('mortal') || nome.includes('kombat');
  const isCabo = nome.includes('cabo') && nome.includes('guerra');

  const legend = (() => {
    if (isVoleiPraia) return 'Confronto direto > Mais vitórias > Melhor razão de pontos (PF/PS) > Sorteio';
    if (isVolei) return 'Confronto direto > Menor média disciplinar > Menos pontos de sets sofridos > Mais pontos de sets feitos > Sorteio';
    if (isFifa) return 'Confronto direto > Maior saldo > Maior média de gols marcados > Menor média de gols sofridos > Sorteio';
    if (isFutsal || isHand || isBasq) return 'Confronto direto > Menor média disciplinar > Menor média de gols/pontos sofridos > Maior média de gols/pontos feitos > Sorteio';
    if (isMK) return 'Confronto direto > Sorteio';
    if (isCabo) return 'Sorteio (observação: desclassificação zera pontos)';
    return 'Mais vitórias > Maior saldo > Maior média de gols pró';
  })();

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ margin: "0 0 8px", fontSize: 15, color: "var(--text)" }}>📊 Classificação</h4>
      <table className="home-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Equipe</th>
            <th>Pts</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>GP</th>
            <th>GC</th>
            <th>SG</th>
            {(isVolei || isVoleiPraia) && <th>Sets PF</th>}
            {(isVolei || isVoleiPraia) && <th>Sets PS</th>}
            {(isVolei || isVoleiPraia) && <th>Avg</th>}
            {(isVolei) && <th>Disc(M)</th>}
            {(isFutsal || isHand || isBasq || isFifa) && <th>Disc(M)</th>}
            {(isFutsal || isHand || isBasq || isFifa) && <th>GF/J</th>}
            {(isFutsal || isHand || isBasq || isFifa) && <th>GA/J</th>}
          </tr>
        </thead>
        <tbody>
          {classificacao.map((equipe, idx) => (
            <tr key={equipe.nome}>
              <td style={{ fontWeight: 700 }}>{idx + 1}º</td>
              <td>{equipe.nome}</td>
              <td style={{ fontWeight: 700, color: "var(--primary)" }}>{equipe.pontos}</td>
              <td>{equipe.jogos}</td>
              <td>{equipe.vitorias}</td>
              <td>{equipe.empates}</td>
              <td>{equipe.derrotas}</td>
              <td>{equipe.golsPro}</td>
              <td>{equipe.golsContra}</td>
              <td style={{ fontWeight: 600, color: equipe.saldoGols >= 0 ? "#22c55e" : "#ef4444" }}>
                {equipe.saldoGols > 0 ? `+${equipe.saldoGols}` : equipe.saldoGols}
              </td>
              {(isVolei || isVoleiPraia) && <td>{equipe.setsPontosFeitos}</td>}
              {(isVolei || isVoleiPraia) && <td>{equipe.setsPontosSofridos}</td>}
              {(isVolei || isVoleiPraia) && <td>{Number.isFinite(equipe.setsAverage) ? equipe.setsAverage.toFixed(2) : '∞'}</td>}
              {(isVolei || isFutsal || isHand || isBasq || isFifa) && (
                <td>{(equipe.disciplinaMedia || 0).toFixed(2)}</td>
              )}
              {(isFutsal || isHand || isBasq || isFifa) && <td>{(equipe.mediaGolsFeitos || 0).toFixed(2)}</td>}
              {(isFutsal || isHand || isBasq || isFifa) && <td>{(equipe.mediaGolsSofridos || 0).toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
        Desempates (após pontos): {legend}
      </div>
    </div>
  );
}

/**
 * Tabela de Eliminatórias (Quartas, Semis, Final)
 */
function TabelaEliminatorias({ chaves, getResultadoJogo, setResultadoJogo, adminMode }) {
  // TODO: Implementar lógica de eliminatórias
  return (
    <div style={{ margin: "24px auto", maxWidth: 880 }}>
      <article className="card">
        <div className="card__header"><h2 className="card__title">🏆 Fase Eliminatória</h2></div>
        <div className="card__body">
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>
            Em desenvolvimento... Quartas, Semifinais e Final serão renderizadas aqui.
          </p>
        </div>
      </article>
    </div>
  );
}

/**
 * Modal para inserir/editar resultado de jogo
 */
function ModalResultado({ modalJogo, onSave, onClose, salvando, mensagem, modalidadeNome }) {
  const [scoreA, setScoreA] = useState(modalJogo.scoreA);
  const [scoreB, setScoreB] = useState(modalJogo.scoreB);
  const nome = (modalidadeNome || modalJogo.modalidadeNome || '').toLowerCase();
  const isVoleiPraia = nome.includes('praia');
  const isVolei = nome.includes('vôlei') || nome.includes('volei');
  const isCabo = nome.includes('cabo') && nome.includes('guerra');
  const isHand = nome.includes('handebol');
  const isBasq = nome.includes('basquete');
  const showExclusao2 = isHand || isBasq;

  const [discA, setDiscA] = useState({
    amarelo: modalJogo.meta?.disciplinaA?.amarelo ?? 0,
    vermelho: modalJogo.meta?.disciplinaA?.vermelho ?? 0,
    exclusao2: modalJogo.meta?.disciplinaA?.exclusao2 ?? 0,
  });
  const [discB, setDiscB] = useState({
    amarelo: modalJogo.meta?.disciplinaB?.amarelo ?? 0,
    vermelho: modalJogo.meta?.disciplinaB?.vermelho ?? 0,
    exclusao2: modalJogo.meta?.disciplinaB?.exclusao2 ?? 0,
  });
  const [setsA, setSetsA] = useState(modalJogo.meta?.setsPontosA ?? 0);
  const [setsB, setSetsB] = useState(modalJogo.meta?.setsPontosB ?? 0);
  const [soltouA, setSoltouA] = useState(!!modalJogo.meta?.soltouCordaA);
  const [soltouB, setSoltouB] = useState(!!modalJogo.meta?.soltouCordaB);

  const handleSubmit = (e) => {
    e.preventDefault();
    const meta = {
      disciplinaA: {
        amarelo: Number(discA.amarelo) || 0,
        vermelho: Number(discA.vermelho) || 0,
        exclusao2: Number(discA.exclusao2) || 0,
      },
      disciplinaB: {
        amarelo: Number(discB.amarelo) || 0,
        vermelho: Number(discB.vermelho) || 0,
        exclusao2: Number(discB.exclusao2) || 0,
      },
      setsPontosA: Number(setsA) || 0,
      setsPontosB: Number(setsB) || 0,
      soltouCordaA: !!soltouA,
      soltouCordaB: !!soltouB,
    };
    onSave({
      ...modalJogo,
      scoreA,
      scoreB,
      meta,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={salvando ? undefined : onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 640, width: "92%", margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="card__title">Resultado do Jogo</h3>
          <button onClick={onClose} className="btn btn--ghost" style={{ padding: "4px 8px" }} disabled={salvando}>✕</button>
        </div>
        <div className="card__body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                {modalJogo.equipeA}
              </label>
              <input
                type="number"
                min="0"
                className="inputLogin"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                required
                autoFocus
                disabled={salvando}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                {modalJogo.equipeB}
              </label>
              <input
                type="number"
                min="0"
                className="inputLogin"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                required
                disabled={salvando}
                style={{ width: "100%" }}
              />
            </div>

            {(isVolei || isVoleiPraia) && (
              <div style={{ marginTop: 8, marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalJogo.equipeA}</label>
                    <input type="number" min="0" step="1" className="inputLogin" value={setsA} onChange={(e)=>setSetsA(e.target.value)} style={{ width: '100%', minWidth: 0 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalJogo.equipeB}</label>
                    <input type="number" min="0" step="1" className="inputLogin" value={setsB} onChange={(e)=>setSetsB(e.target.value)} style={{ width: '100%', minWidth: 0 }} />
                  </div>
                </div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
                  Dica: informe o somatório dos pontos feitos em todos os sets por equipe (PF e PS). Ex.: 25-20, 25-22 → PF 50, PS 42.
                </div>
              </div>
            )}

            {/* Disciplina */}
            <div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalJogo.equipeA}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(110px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10, width: '100%' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Amarelos</div>
                      <input type="number" min="0" step="1" className="inputLogin" value={discA.amarelo} onChange={(e)=>setDiscA({ ...discA, amarelo: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>1 pt cada</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Vermelhos</div>
                      <input type="number" min="0" step="1" className="inputLogin" value={discA.vermelho} onChange={(e)=>setDiscA({ ...discA, vermelho: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>3 pts cada</div>
                    </div>
                    {showExclusao2 && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Exclusão 2'</div>
                        <input type="number" min="0" step="1" className="inputLogin" value={discA.exclusao2} onChange={(e)=>setDiscA({ ...discA, exclusao2: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>2 pts cada</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalJogo.equipeB}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(110px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10, width: '100%' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Amarelos</div>
                      <input type="number" min="0" step="1" className="inputLogin" value={discB.amarelo} onChange={(e)=>setDiscB({ ...discB, amarelo: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>1 pt cada</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Vermelhos</div>
                      <input type="number" min="0" step="1" className="inputLogin" value={discB.vermelho} onChange={(e)=>setDiscB({ ...discB, vermelho: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>3 pts cada</div>
                    </div>
                    {showExclusao2 && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Exclusão 2'</div>
                        <input type="number" min="0" step="1" className="inputLogin" value={discB.exclusao2} onChange={(e)=>setDiscB({ ...discB, exclusao2: e.target.value })} style={{ width: '100%', minWidth: 0 }} />
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>2 pts cada</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
                Amarelo = 1 ponto, Vermelho = 3 pontos, Exclusão 2' = 2 pontos (Handebol/Basquete). Usamos a média por jogo como critério de desempate (menor é melhor).
              </div>
            </div>

            {isCabo && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={soltouA} onChange={(e)=>setSoltouA(e.target.checked)} />
                    {modalJogo.equipeA}: soltou a corda
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={soltouB} onChange={(e)=>setSoltouB(e.target.checked)} />
                    {modalJogo.equipeB}: soltou a corda
                  </label>
                </div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
                  Atenção: marcar esta opção desclassifica a equipe e zera os pontos desta chave.
                </div>
              </div>
            )}

            {/* Mensagem de feedback */}
            {mensagem && (
              <div style={{ 
                marginTop: "12px",
                marginBottom: "16px",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                background: mensagem.tipo === "sucesso" 
                  ? "rgba(34, 197, 94, 0.15)" 
                  : "rgba(239, 68, 68, 0.15)",
                color: mensagem.tipo === "sucesso" 
                  ? "#22c55e" 
                  : "#ef4444",
                border: `1px solid ${mensagem.tipo === "sucesso" ? "#22c55e" : "#ef4444"}20`
              }}>
                {mensagem.texto}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} className="btn btn--ghost" disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={salvando}>
                {salvando ? (
                  <>
                    <span className="spinner" style={{ marginRight: "8px" }}></span>
                    Salvando...
                  </>
                ) : (
                  "💾 Salvar Resultado"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SistemaChavesEliminatorias;
