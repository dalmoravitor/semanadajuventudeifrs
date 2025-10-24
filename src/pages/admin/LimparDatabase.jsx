import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function LimparDatabase() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [resultado, setResultado] = useState(null);
  const navigate = useNavigate();

  const addLog = (message, type = 'info') => {
    const colors = {
      info: '#3b82f6',
      success: '#00b894',
      warning: '#f9ca24',
      error: '#ef4444'
    };
    
    setLogs(prev => [...prev, { 
      time: new Date().toLocaleTimeString(), 
      message,
      color: colors[type] || colors.info
    }]);
  };

  const limparColecao = async (nomeColecao) => {
    try {
      addLog(`🗑️ Limpando coleção: ${nomeColecao}...`, 'info');
      
      const colecaoRef = collection(db, nomeColecao);
      const snapshot = await getDocs(colecaoRef);
      
      if (snapshot.empty) {
        addLog(`   ℹ️ Coleção ${nomeColecao} já está vazia`, 'info');
        return { success: true, count: 0 };
      }

      let deletados = 0;
      const promises = [];

      snapshot.forEach((documento) => {
        promises.push(deleteDoc(doc(db, nomeColecao, documento.id)));
        deletados++;
      });

      await Promise.all(promises);
      
      addLog(`   ✅ ${deletados} documentos deletados de ${nomeColecao}`, 'success');
      return { success: true, count: deletados };
      
    } catch (error) {
      addLog(`   ❌ Erro ao limpar ${nomeColecao}: ${error.message}`, 'error');
      return { success: false, error: error.message, count: 0 };
    }
  };

  const limparTodasColecoes = async () => {
    if (!window.confirm(
      '⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n' +
      'Esta ação vai DELETAR PERMANENTEMENTE todos os dados:\n' +
      '• Todas as modalidades\n' +
      '• Todas as equipes\n' +
      '• Todos os rankings\n' +
      '• Todas as configurações\n' +
      '• Todos os resultados\n' +
      '• Todas as inscrições\n\n' +
      'Deseja REALMENTE continuar?'
    )) {
      return;
    }

    // Segundo aviso
    if (!window.confirm(
      '⚠️ ÚLTIMA CONFIRMAÇÃO!\n\n' +
      'Você tem CERTEZA ABSOLUTA?\n\n' +
      'Esta ação NÃO PODE SER DESFEITA!'
    )) {
      return;
    }

    setLoading(true);
    setLogs([]);
    setResultado(null);

    try {
      addLog('🚀 Iniciando limpeza completa do banco de dados...', 'info');
      addLog('', 'info');

      const colecoes = [
        'modalidades',
        'equipes',
        'ranking',
        'configuracoes',
        'resultados',
        'inscricoes',
        'chaves',
        'confrontos',
        'eliminacao-simples',
        'eliminacao-melhor-de-3',
        'pontuacaoFixa',
        'pontuacaoAcumulada',
        'sistemaKahoot',
        'sistemaBochaCampeira',
        'sistemasTempo'
      ];

      const resultados = {};
      let totalDeletados = 0;

      for (const colecao of colecoes) {
        const resultado = await limparColecao(colecao);
        resultados[colecao] = resultado;
        totalDeletados += resultado.count;
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      addLog('', 'info');
      addLog('=' .repeat(60), 'info');
      addLog('📊 RESUMO DA LIMPEZA', 'success');
      addLog('=' .repeat(60), 'info');
      addLog(`✅ Total de documentos deletados: ${totalDeletados}`, 'success');
      addLog('', 'info');
      
      Object.entries(resultados).forEach(([colecao, resultado]) => {
        if (resultado.count > 0) {
          addLog(`   ${colecao}: ${resultado.count} documentos`, 'success');
        }
      });
      
      addLog('', 'info');
      addLog('✨ LIMPEZA CONCLUÍDA COM SUCESSO!', 'success');
      addLog('', 'info');
      addLog('💡 Próximo passo: Execute a migração para popular novamente', 'warning');

      setResultado({
        success: true,
        totalDeletados,
        detalhes: resultados
      });

    } catch (error) {
      addLog(`❌ Erro crítico: ${error.message}`, 'error');
      console.error('Erro na limpeza:', error);
      
      setResultado({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '20px'
        }}
      >
        ← Voltar ao Dashboard
      </button>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: '#ef4444'
          }}>
            🗑️ Limpar Database
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Remove TODOS os dados do Firestore (ação irreversível)
          </p>
        </div>

        {/* Warning Box */}
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '10px', 
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ ATENÇÃO: ZONA DE PERIGO
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b', lineHeight: '1.8' }}>
            <li><strong>Esta ação é IRREVERSÍVEL</strong></li>
            <li>TODOS os dados serão deletados permanentemente</li>
            <li>Modalidades, equipes, rankings, configurações, resultados</li>
            <li>Você precisará executar a migração novamente depois</li>
            <li>Certifique-se de ter um backup se necessário</li>
          </ul>
        </div>

        {/* Info Box */}
        <div style={{
          background: '#e0f2fe',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '10px', 
            color: '#075985'
          }}>
            📋 Coleções que serão deletadas:
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '10px',
            color: '#075985',
            fontSize: '14px'
          }}>
            <div>✓ modalidades</div>
            <div>✓ equipes</div>
            <div>✓ ranking</div>
            <div>✓ configuracoes</div>
            <div>✓ resultados</div>
            <div>✓ inscricoes</div>
            <div>✓ chaves</div>
            <div>✓ confrontos</div>
            <div>✓ eliminacao-simples</div>
            <div>✓ eliminacao-melhor-de-3</div>
            <div>✓ pontuacaoFixa</div>
            <div>✓ pontuacaoAcumulada</div>
            <div>✓ sistemaKahoot</div>
            <div>✓ sistemaBochaCampeira</div>
            <div>✓ sistemasTempo</div>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={limparTodasColecoes}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            background: loading ? '#ccc' : '#ef4444',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: '20px',
            boxShadow: loading ? 'none' : '0 4px 6px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = '#dc2626';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 8px rgba(239, 68, 68, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = '#ef4444';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)';
            }
          }}
        >
          {loading ? '⏳ Deletando Dados...' : '🗑️ LIMPAR TODO O BANCO DE DADOS'}
        </button>

        {/* Logs */}
        {logs.length > 0 && (
          <div style={{
            background: '#1e1e1e',
            color: '#fff',
            borderRadius: '8px',
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxHeight: '500px',
            overflowY: 'auto',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>📋 Logs de Execução</h3>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap', color: log.color }}>
                <span style={{ color: '#888' }}>[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        )}

        {/* Resultado Final */}
        {resultado && (
          <div style={{
            background: resultado.success ? '#d1fae5' : '#fee2e2',
            border: `2px solid ${resultado.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: resultado.success ? '#065f46' : '#991b1b'
            }}>
              {resultado.success ? '✅ Limpeza Concluída!' : '❌ Erro na Limpeza'}
            </h3>
            
            {resultado.success && (
              <div style={{ fontSize: '16px', color: '#065f46' }}>
                <p style={{ margin: '10px 0' }}>
                  <strong>{resultado.totalDeletados} documentos</strong> foram deletados com sucesso!
                </p>
                <p style={{ margin: '10px 0', padding: '10px', background: '#fef3c7', color: '#78350f', borderRadius: '6px' }}>
                  💡 <strong>Próximo passo:</strong> Vá para a página de Migração para popular o banco novamente
                </p>
                <button
                  onClick={() => navigate('/admin/migrate')}
                  style={{
                    marginTop: '15px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white',
                    background: '#2dd4bf',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Ir para Migração
                </button>
              </div>
            )}

            {resultado.error && (
              <p style={{ margin: '10px 0 0 0', color: '#991b1b' }}>
                <strong>Erro:</strong> {resultado.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
