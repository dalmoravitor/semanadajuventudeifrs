import { useState } from 'react';
import { migrarTodosDados } from '../../scripts/migrateData';

export default function MigrarDados() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [logs, setLogs] = useState([]);

  // Interceptar console.log
  const originalLog = console.log;
  
  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const executarMigracao = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação vai SUBSTITUIR todos os dados existentes!\n\nDeseja continuar?')) {
      return;
    }

    setLoading(true);
    setResultado(null);
    setLogs([]);

    // Interceptar console.log
    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '));
    };

    try {
      addLog('🚀 Iniciando migração...');
      const result = await migrarTodosDados();
      setResultado(result);
      
      if (result.success) {
        addLog('✅ Migração concluída com sucesso!');
      } else {
        addLog('❌ Migração concluída com erros!');
      }
    } catch (error) {
      console.error('Erro na migração:', error);
      addLog(`❌ Erro: ${error.message}`);
      setResultado({ success: false, error: error.message });
    } finally {
      console.log = originalLog;
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
            🔄 Migração de Dados
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Popula o Firestore com os dados iniciais do sistema
          </p>
        </div>

        {/* Info Box */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#856404' }}>
            ⚠️ Importante
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
            <li>Esta ação vai <strong>substituir todos os dados existentes</strong></li>
            <li>Será criada uma nova estrutura com 21 equipes e 16 turmas no ranking</li>
            <li>As modalidades serão recriadas</li>
            <li>Os rankings serão reinicializados</li>
          </ul>
        </div>

        {/* Nova Estrutura */}
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#1565c0' }}>
            📊 Nova Estrutura
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1565c0' }}>Equipes Competindo:</p>
              <p style={{ margin: 0, color: '#1565c0' }}>21 equipes (16 simples + 5 combinadas)</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1565c0' }}>Turmas no Ranking:</p>
              <p style={{ margin: 0, color: '#1565c0' }}>16 turmas</p>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1565c0' }}>Equipes Combinadas:</p>
            <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
              Turma 12/13, Turma 12/14, Turma 23/24, Turma 32/33, Turma TI11/12
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
              (Cada equipe combinada distribui 100% dos pontos para cada turma)
            </p>
          </div>
        </div>

        {/* Botão */}
        <button
          onClick={executarMigracao}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            background: loading ? '#ccc' : '#e74c3c',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: '20px'
          }}
        >
          {loading ? '⏳ Executando Migração...' : '🚀 Executar Migração'}
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
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>📋 Logs de Execução</h3>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#888' }}>[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div style={{
            background: resultado.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${resultado.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: resultado.success ? '#155724' : '#721c24'
            }}>
              {resultado.success ? '✅ Migração Concluída!' : '❌ Erro na Migração'}
            </h3>
            
            {resultado.resultados && (
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Modalidades:</strong> {resultado.resultados.modalidades.success ? '✅' : '❌'} 
                  ({resultado.resultados.modalidades.count || 0} registros)
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Equipes:</strong> {resultado.resultados.equipes.success ? '✅' : '❌'} 
                  ({resultado.resultados.equipes.count || 0} registros)
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Configurações:</strong> {resultado.resultados.configuracoes.success ? '✅' : '❌'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Rankings:</strong> {resultado.resultados.ranking.success ? '✅' : '❌'}
                </p>
              </div>
            )}

            {resultado.error && (
              <p style={{ margin: '10px 0 0 0', color: '#721c24' }}>
                <strong>Erro:</strong> {resultado.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
