import React, { useMemo, useState, useEffect } from 'react';
import { saveRankingModalidade } from '../api/ranking';

/**
 * Editor de Ranking da Modalidade (Admin)
 *
 * Props:
 * - modalidadeId: string (obrigatório)
 * - modalidadeTitulo: string (exibir no título)
 * - equipesChaves: Array<{ id?: string, nome: string }>
 * - initialRanking: Array<{ posicao, equipe, equipeId, pontos }>
 * - onSaved: function(rankingSalvo)
 */
const RankingModalidadeEditor = ({ modalidadeId, modalidadeTitulo, equipesChaves = [], initialRanking = [], onSaved }) => {
  const equipesOptions = useMemo(() => {
    // Unificar por nome, preservar id quando existir
    const map = new Map();
    equipesChaves.forEach((e) => {
      const key = (e?.nome || '').trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, { nome: key, id: e?.id || null });
    });
    return Array.from(map.values());
  }, [equipesChaves]);

  // total inicial = maior entre options e ranking já salvo
  const initialTotal = Math.max(equipesOptions.length, (initialRanking || []).length);
  const [total, setTotal] = useState(initialTotal);

  // Estado dos rows
  const [rows, setRows] = useState(() => {
    // Se já existe ranking salvo, usar como base; senão, criar N linhas
    if (initialRanking && initialRanking.length > 0) {
      const byPos = [...initialRanking]
        .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
        .slice(0, initialTotal);
      return byPos.map((r, i) => ({
        posicao: i + 1,
        equipe: r.equipe || '',
        equipeId: r.equipeId || null,
        pontos: typeof r.pontos === 'number' ? r.pontos : '',
      }));
    }
    // Default: posições 1..total, campos vazios
    return Array.from({ length: initialTotal }, (_, i) => ({
      posicao: i + 1,
      equipe: '',
      equipeId: null,
      pontos: '',
    }));
  });

  useEffect(() => {
    // Ajustar total automaticamente quando options/ranking carregarem e total ainda é 0
    if (total === 0 && (equipesOptions.length > 0 || (initialRanking || []).length > 0)) {
      const novoTotal = Math.max(equipesOptions.length, (initialRanking || []).length);
      setTotal(novoTotal);
    }
  }, [equipesOptions.length, initialRanking, total]);

  useEffect(() => {
    // Ajustar linhas ao mudar 'total'
    if (total >= 0 && rows.length !== total) {
      setRows((prev) => {
        const next = Array.from({ length: total }, (_, i) => prev[i] || {
          posicao: i + 1,
          equipe: '',
          equipeId: null,
          pontos: '',
        });
        return next.map((r, i) => ({ ...r, posicao: i + 1 }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleEquipeChange = (index, value) => {
    // value pode ser nome (quando options são string) ou id|nome
    // Aqui as options serão o nome; vamos derivar id pelo match
    const nome = value;
    const found = equipesOptions.find((e) => e.nome === nome);
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], equipe: nome, equipeId: found?.id || null };
      return next;
    });
    if (message) setMessage(null);
  };

  const handlePontosChange = (index, value) => {
    const val = value === '' ? '' : Number(value);
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], pontos: val };
      return next;
    });
    if (message) setMessage(null);
  };

  const hasDuplicates = useMemo(() => {
    const seen = new Set();
    for (const r of rows) {
      const key = (r.equipe || '').trim();
      if (!key) continue;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }, [rows]);

  const isIncomplete = useMemo(() => {
    if (rows.length === 0) return true;
    // requer equipe e pontos em todas as linhas
    return rows.some((r) => !r.equipe || r.pontos === '' || r.pontos === null || Number.isNaN(Number(r.pontos)));
  }, [rows]);

  const handleSalvar = async () => {
    if (!modalidadeId) return;
    if (hasDuplicates) {
      setMessage({ tipo: 'erro', texto: 'Há equipes repetidas. Cada equipe deve aparecer apenas uma vez.' });
      return;
    }
    if (isIncomplete) {
      setMessage({ tipo: 'erro', texto: 'Preencha equipe e pontos para todas as posições.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // Ordenar por posicao e montar payload esperado pela API
      const payload = [...rows]
        .sort((a, b) => a.posicao - b.posicao)
        .map((r) => ({ equipe: r.equipe, equipeId: r.equipeId || undefined, pontos: Number(r.pontos) }));

      const res = await saveRankingModalidade(modalidadeId, payload);
      if (res.success) {
        setMessage({ tipo: 'sucesso', texto: '✅ Ranking salvo com sucesso!' });
        if (onSaved) {
          onSaved(res.data?.ranking || payload.map((p, i) => ({ posicao: i + 1, ...p })));
        }
        // limpar mensagem depois de um tempo
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage({ tipo: 'erro', texto: `❌ Erro ao salvar: ${res.error || 'Desconhecido'}` });
      }
    } catch (err) {
      console.error('Erro ao salvar ranking:', err);
      setMessage({ tipo: 'erro', texto: '❌ Erro ao salvar ranking. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ranking-modalidade" style={{ padding: 12 }}>
      <div className="ranking-header" style={{ marginBottom: 12 }}>
        <h2 className="ranking-titulo">🏆 Ranking Final (manual) — {modalidadeTitulo}</h2>
        <p className="ranking-subtitulo" style={{ color: 'var(--muted)' }}>
          Preencha da 1ª até a {total}ª posição com a equipe e os pontos correspondentes.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Número de posições:</label>
        <input
          type="number"
          min={0}
          className="inputLogin"
          value={total}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isNaN(v) || v < 0) return;
            setTotal(v);
          }}
          style={{ width: 100, padding: 6, background: 'var(--card)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8 }}
        />
      </div>

      <div className="ranking-container">
        <div className="ranking-table">
          <div className="ranking-table-header" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: 8, alignItems: 'center', padding: '8px 10px' }}>
            <div className="ranking-col ranking-col--pos" style={{ fontWeight: 700 }}>Posição</div>
            <div className="ranking-col ranking-col--equipe" style={{ fontWeight: 700 }}>Equipe</div>
            <div className="ranking-col ranking-col--pontos" style={{ fontWeight: 700 }}>Pontos</div>
          </div>

          <div className="ranking-body" style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row, idx) => (
              <div key={idx} className="ranking-item" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: 8, alignItems: 'center', padding: '6px 10px' }}>
                <div className="ranking-col ranking-col--pos" style={{ fontWeight: 700 }}>{row.posicao}º</div>
                <div className="ranking-col ranking-col--equipe">
                  <select
                    className="inputLogin"
                    value={row.equipe}
                    onChange={(e) => handleEquipeChange(idx, e.target.value)}
                    style={{ width: '100%', padding: 8, background: 'var(--card)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8 }}
                  >
                    <option value="">Selecione a equipe…</option>
                    {equipesOptions.map((opt) => (
                      <option key={opt.id || opt.nome} value={opt.nome}>{opt.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="ranking-col ranking-col--pontos">
                  <input
                    type="number"
                    className="inputLogin"
                    value={row.pontos}
                    onChange={(e) => handlePontosChange(idx, e.target.value)}
                    style={{ width: '100%', padding: 8, background: 'var(--card)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500, textAlign: 'center', background: message.tipo === 'sucesso' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: message.tipo === 'sucesso' ? '#22c55e' : '#ef4444', border: `1px solid ${message.tipo === 'sucesso' ? '#22c55e' : '#ef4444'}20` }}>
          {message.texto}
        </div>
      )}

      <div className="ranking-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
        <button className="btn btn--primary" onClick={handleSalvar} disabled={saving || hasDuplicates || isIncomplete} style={{ minWidth: 180 }}>
          {saving ? 'Salvando…' : '💾 Salvar Ranking'}
        </button>
      </div>

      {(hasDuplicates || isIncomplete) && (
        <div style={{ marginTop: 8, color: '#F59E0B', fontSize: 12 }}>
          {hasDuplicates && <div>⚠️ Há equipes repetidas na lista.</div>}
          {isIncomplete && <div>⚠️ Preencha todas as posições e pontos.</div>}
        </div>
      )}
    </div>
  );
};

export default RankingModalidadeEditor;
