import React from 'react';
import './BracketEliminatorias.css';

/**
 * Componente visual de bracket para fase eliminatória
 * Exibe quartas, semifinais e final em formato de chave
 */
function BracketEliminatorias({ 
  confrontosQuartas = [], 
  confrontosSemis = [], 
  confrontosFinal = null,
  resultadosEliminatorias = {},
  onEditarResultado,
  adminMode = false
}) {
  
  // Função para determinar o vencedor de um confronto
  const getVencedor = (confronto) => {
    if (!confronto) return null;
    const resultado = resultadosEliminatorias[confronto.id];
    if (!resultado || resultado.scoreA === undefined || resultado.scoreB === undefined) {
      return null;
    }
    return resultado.scoreA > resultado.scoreB ? confronto.equipeA : confronto.equipeB;
  };

  // Função para obter o nome da equipe (suporta string ou objeto)
  const getNomeEquipe = (equipe) => {
    if (!equipe) return 'TBD';
    return typeof equipe === 'string' ? equipe : equipe.nome || 'TBD';
  };

  // Função para renderizar um confronto
  const renderConfronto = (confronto, fase) => {
    if (!confronto) return null;
    
    const resultado = resultadosEliminatorias[confronto.id];
    const vencedor = getVencedor(confronto);
    
    const nomeEquipeA = getNomeEquipe(confronto.equipeA);
    const nomeEquipeB = getNomeEquipe(confronto.equipeB);
    const nomeVencedor = getNomeEquipe(vencedor);
    
    const equipeAVencedora = nomeVencedor === nomeEquipeA;
    const equipeBVencedora = nomeVencedor === nomeEquipeB;
    
    return (
      <div className="bracket-match" key={confronto.id}>
        <div 
          className={`bracket-team ${equipeAVencedora ? 'winner' : ''} ${resultado && !equipeAVencedora ? 'loser' : ''}`}
          onClick={adminMode ? () => onEditarResultado(confronto) : undefined}
          style={{ cursor: adminMode ? 'pointer' : 'default' }}
        >
          <span className="team-name">{nomeEquipeA}</span>
          {resultado && <span className="team-score">{resultado.scoreA}</span>}
        </div>
        <div 
          className={`bracket-team ${equipeBVencedora ? 'winner' : ''} ${resultado && !equipeBVencedora ? 'loser' : ''}`}
          onClick={adminMode ? () => onEditarResultado(confronto) : undefined}
          style={{ cursor: adminMode ? 'pointer' : 'default' }}
        >
          <span className="team-name">{nomeEquipeB}</span>
          {resultado && <span className="team-score">{resultado.scoreB}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="bracket-container">
      <div className="bracket-wrapper">
        
        {/* Quartas de Final - Parte Superior */}
        <div className="bracket-round">
          <h4 className="round-title">Quartas de Final</h4>
          <div className="bracket-matches">
            {confrontosQuartas.slice(0, 2).map(confronto => renderConfronto(confronto, 'quartas'))}
          </div>
        </div>

        {/* Semifinais - Parte Superior */}
        <div className="bracket-round">
          <h4 className="round-title">Semifinais</h4>
          <div className="bracket-matches">
            {confrontosSemis[0] && renderConfronto(confrontosSemis[0], 'semis')}
          </div>
        </div>

        {/* Final */}
        <div className="bracket-round bracket-final">
          <h4 className="round-title">🏆 Final</h4>
          <div className="bracket-matches">
            {confrontosFinal && (
              <div className="bracket-match final-match">
                <div 
                  className={`bracket-team ${getNomeEquipe(getVencedor(confrontosFinal)) === getNomeEquipe(confrontosFinal.equipeA) ? 'winner champion' : ''} ${resultadosEliminatorias[confrontosFinal.id] && getNomeEquipe(getVencedor(confrontosFinal)) !== getNomeEquipe(confrontosFinal.equipeA) ? 'loser' : ''}`}
                  onClick={adminMode ? () => onEditarResultado(confrontosFinal) : undefined}
                  style={{ cursor: adminMode ? 'pointer' : 'default' }}
                >
                  <span className="team-name">{getNomeEquipe(confrontosFinal.equipeA)}</span>
                  {resultadosEliminatorias[confrontosFinal.id] && (
                    <span className="team-score">{resultadosEliminatorias[confrontosFinal.id].scoreA}</span>
                  )}
                </div>
                <div 
                  className={`bracket-team ${getNomeEquipe(getVencedor(confrontosFinal)) === getNomeEquipe(confrontosFinal.equipeB) ? 'winner champion' : ''} ${resultadosEliminatorias[confrontosFinal.id] && getNomeEquipe(getVencedor(confrontosFinal)) !== getNomeEquipe(confrontosFinal.equipeB) ? 'loser' : ''}`}
                  onClick={adminMode ? () => onEditarResultado(confrontosFinal) : undefined}
                  style={{ cursor: adminMode ? 'pointer' : 'default' }}
                >
                  <span className="team-name">{getNomeEquipe(confrontosFinal.equipeB)}</span>
                  {resultadosEliminatorias[confrontosFinal.id] && (
                    <span className="team-score">{resultadosEliminatorias[confrontosFinal.id].scoreB}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Semifinais - Parte Inferior */}
        <div className="bracket-round">
          <h4 className="round-title">Semifinais</h4>
          <div className="bracket-matches">
            {confrontosSemis[1] && renderConfronto(confrontosSemis[1], 'semis')}
          </div>
        </div>

        {/* Quartas de Final - Parte Inferior */}
        <div className="bracket-round">
          <h4 className="round-title">Quartas de Final</h4>
          <div className="bracket-matches">
            {confrontosQuartas.slice(2, 4).map(confronto => renderConfronto(confronto, 'quartas'))}
          </div>
        </div>

      </div>

      {/* Campeão (se a final foi decidida) */}
      {confrontosFinal && getVencedor(confrontosFinal) && (
        <div className="champion-banner">
          <div className="champion-trophy">🏆</div>
          <div className="champion-text">
            <h3>CAMPEÃO</h3>
            <h2>{getNomeEquipe(getVencedor(confrontosFinal))}</h2>
          </div>
          <div className="champion-trophy">🏆</div>
        </div>
      )}
    </div>
  );
}

export default BracketEliminatorias;
