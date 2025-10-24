import React from 'react';
import './RankingModalidade.css';

/**
 * Componente para exibir o ranking final de uma modalidade
 * @param {Array} ranking - Array de objetos { posicao, equipe, pontos }
 * @param {string} modalidadeTitulo - Nome da modalidade para exibir no título
 * @param {Date|Object|string} updatedAt - Timestamp de última atualização (opcional)
 */
const RankingModalidade = ({ ranking, modalidadeTitulo, updatedAt }) => {
  if (!ranking || ranking.length === 0) {
    return null;
  }

  const getMedalha = (posicao) => {
    switch (posicao) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getPosicaoClass = (posicao) => {
    switch (posicao) {
      case 1: return 'ranking-item--ouro';
      case 2: return 'ranking-item--prata';
      case 3: return 'ranking-item--bronze';
      default: return '';
    }
  };

  const formatUpdatedAt = (ts) => {
    if (!ts) return null;
    let d = null;
    try {
      if (ts instanceof Date) d = ts;
      else if (typeof ts?.toDate === 'function') d = ts.toDate();
      else if (typeof ts === 'string') d = new Date(ts);
    } catch (_) {}
    if (!d || isNaN(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${min}`;
  };

  const atualizadoEm = formatUpdatedAt(updatedAt);

  return (
    <div className="ranking-modalidade">
      <div className="ranking-header">
        <h2 className="ranking-titulo">🏆 Ranking Final - {modalidadeTitulo}</h2>
        <p className="ranking-subtitulo">Pontuação para o ranking geral da Semana da Juventude</p>
        {atualizadoEm && (
          <div style={{ marginTop: 6 }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              background: 'rgba(45, 212, 191, 0.15)',
              border: '1px solid rgba(45, 212, 191, 0.35)',
              color: 'var(--text)'
            }}>
              💾 Ranking salvo em {atualizadoEm}
            </span>
          </div>
        )}
      </div>

      <div className="ranking-container">
        <div className="ranking-table">
          <div className="ranking-table-header">
            <div className="ranking-col ranking-col--pos">Posição</div>
            <div className="ranking-col ranking-col--equipe">Equipe</div>
            <div className="ranking-col ranking-col--pontos">Pontos</div>
          </div>

          {ranking.map((item) => (
            <div 
              key={item.posicao} 
              className={`ranking-item ${getPosicaoClass(item.posicao)}`}
            >
              <div className="ranking-col ranking-col--pos">
                <span className="ranking-posicao">
                  {getMedalha(item.posicao)} {item.posicao}º
                </span>
              </div>
              <div className="ranking-col ranking-col--equipe">
                <span className="ranking-equipe">{item.equipe}</span>
              </div>
              <div className="ranking-col ranking-col--pontos">
                <span className="ranking-pontos">{item.pontos} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ranking-footer">
        <p className="ranking-info">
          ℹ️ Os pontos acima serão somados ao ranking geral das equipes
        </p>
      </div>
    </div>
  );
};

export default RankingModalidade;
