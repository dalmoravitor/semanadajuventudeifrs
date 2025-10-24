import React, { useState } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';

/**
 * Componente para inicializar modalidades com sistema de chaves no Firestore
 * Use este componente apenas uma vez para criar os documentos iniciais
 */
function InicializarModalidades() {
  const [log, setLog] = useState([]);
  const [processando, setProcessando] = useState(false);

  const modalidades = [
    {
      id: 'handebol_masc',
      nome: 'Handebol',
      categoria: 'masculino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'handebol_fem',
      nome: 'Handebol',
      categoria: 'feminino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'voleibol_masc',
      nome: 'Voleibol',
      categoria: 'masculino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'voleibol_fem',
      nome: 'Voleibol',
      categoria: 'feminino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'volei_de_praia_misto',
      nome: 'Vôlei de Praia',
      categoria: 'misto',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'basquetebol_masc',
      nome: 'Basquetebol',
      categoria: 'masculino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'basquetebol_fem',
      nome: 'Basquetebol',
      categoria: 'feminino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'futsal_masc',
      nome: 'Futsal',
      categoria: 'masculino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    },
    {
      id: 'futsal_fem',
      nome: 'Futsal',
      categoria: 'feminino',
      sistema: 'chaves+eliminacao',
      numChaves: 4
    }
  ];

  const adicionarLog = (mensagem, tipo = 'info') => {
    setLog(prev => [...prev, { mensagem, tipo, timestamp: new Date().toLocaleTimeString() }]);
  };

  const gerarChavesVazias = (numChaves) => {
    const chaves = [];
    const letras = ['A', 'B', 'C', 'D', 'E'];
    
    for (let i = 0; i < numChaves; i++) {
      chaves.push({
        nome: `Chave ${letras[i]}`,
        equipes: ['', '', ''],
        equipesIds: ['', '', '']
      });
    }
    
    return chaves;
  };

  const criarDocumentoChaves = async (modalidadeId, numChaves = 4) => {
    try {
      const docRef = doc(db, 'chaves', modalidadeId);
      
      // Verificar se já existe
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        adicionarLog(`✅ Documento já existe para ${modalidadeId}`, 'success');
        return { success: true, exists: true };
      }
      
      // Criar documento
      const dados = {
        chaves: gerarChavesVazias(numChaves),
        resultadosJogos: [],
        confrontosQuartas: [],
        confrontosSemis: [],
        confrontosFinal: null,
        resultadosEliminatorias: {},
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, dados);
      adicionarLog(`✅ Documento criado para ${modalidadeId}`, 'success');
      return { success: true, exists: false };
    } catch (error) {
      adicionarLog(`❌ Erro ao criar documento para ${modalidadeId}: ${error.message}`, 'error');
      return { success: false, error };
    }
  };

  const inicializarTodasModalidades = async () => {
    setProcessando(true);
    setLog([]);
    adicionarLog('🚀 Iniciando criação de documentos de modalidades...', 'info');
    
    let criados = 0;
    let existentes = 0;
    let erros = 0;
    
    for (const modalidade of modalidades) {
      adicionarLog(`📝 Processando ${modalidade.nome} (${modalidade.categoria})...`, 'info');
      const resultado = await criarDocumentoChaves(modalidade.id, modalidade.numChaves);
      
      if (resultado.success) {
        if (resultado.exists) {
          existentes++;
        } else {
          criados++;
        }
      } else {
        erros++;
      }
      
      // Pequeno delay para não sobrecarregar o Firestore
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    adicionarLog('', 'info');
    adicionarLog('📊 Resumo:', 'info');
    adicionarLog(`✅ Criados: ${criados}`, 'success');
    adicionarLog(`ℹ️ Já existiam: ${existentes}`, 'info');
    adicionarLog(`❌ Erros: ${erros}`, 'error');
    adicionarLog('✅ Processo concluído!', 'success');
    
    setProcessando(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">🏀 Inicializar Modalidades de Chaves</h2>
        </div>
        <div className="card__body">
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
              Este utilitário cria os documentos iniciais no Firestore para todas as modalidades que usam sistema de chaves + eliminação.
            </p>
            <p style={{ color: 'var(--warning)', fontSize: 14, background: '#fff3cd', padding: 12, borderRadius: 6, border: '1px solid #ffc107' }}>
              ⚠️ <strong>Atenção:</strong> Execute isso apenas uma vez. Se os documentos já existirem, eles não serão sobrescritos.
            </p>
          </div>

          <button
            onClick={inicializarTodasModalidades}
            disabled={processando}
            className="btn btn--primary"
            style={{ width: '100%', padding: '14px', fontSize: 16, marginBottom: 24 }}
          >
            {processando ? '⏳ Processando...' : '🚀 Inicializar Todas as Modalidades'}
          </button>

          {log.length > 0 && (
            <div style={{ 
              background: '#1e1e1e', 
              color: '#e0e0e0', 
              padding: 16, 
              borderRadius: 8, 
              fontFamily: 'monospace', 
              fontSize: 13,
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              {log.map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '4px 0',
                    color: item.tipo === 'error' ? '#ff6b6b' : item.tipo === 'success' ? '#51cf66' : '#e0e0e0'
                  }}
                >
                  <span style={{ color: '#888' }}>[{item.timestamp}]</span> {item.mensagem}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
            <h4 style={{ marginTop: 0, fontSize: 14, color: '#333' }}>📋 Modalidades que serão criadas:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#666' }}>
              {modalidades.map(m => (
                <li key={m.id}>{m.nome} ({m.categoria}) - {m.numChaves} chaves</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InicializarModalidades;
