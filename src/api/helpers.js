/**
 * HELPERS - FIRESTORE
 * Funções auxiliares para trabalhar com Firestore
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// CONSTANTES
// ============================================

export const COLECOES = {
  MODALIDADES: "modalidades",
  EQUIPES: "equipes",
  INSCRICOES: "inscricoes",
  CHAVES: "chaves",
  CONFRONTOS: "confrontos",
  RESULTADOS: "resultados",
  RANKING: "ranking",
  CONFIGURACOES: "configuracoes",
};

export const STATUS = {
  AGUARDANDO: "aguardando",
  EM_ANDAMENTO: "em_andamento",
  CONCLUIDO: "concluido",
  PENDENTE: "pendente",
  CONFIRMADA: "confirmada",
  CANCELADA: "cancelada",
};

export const FASES = {
  CHAVES: "chaves",
  OITAVAS: "oitavas",
  QUARTAS: "quartas",
  SEMI: "semi",
  FINAL: "final",
  TERCEIRO: "terceiro",
};

export const CATEGORIAS = {
  MASCULINO: "masculino",
  FEMININO: "feminino",
  MISTO: "misto",
};

// Tabela de pontuação: 1º ao 16º lugar
export const TABELA_PONTUACAO = [
  160, 150, 140, 130, 120, 110, 100, 90,
  80, 70, 60, 50, 40, 30, 20, 10
];

// ============================================
// FUNÇÕES AUXILIARES GERAIS
// ============================================

/**
 * Converte Timestamp do Firestore para Date
 * @param {Timestamp|Date|null} timestamp 
 * @returns {Date|null}
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  return null;
};

/**
 * Converte Date para Timestamp do Firestore
 * @param {Date|null} date 
 * @returns {Timestamp|null}
 */
export const dateToTimestamp = (date) => {
  if (!date) return null;
  if (date instanceof Date) return Timestamp.fromDate(date);
  return null;
};

/**
 * Retorna timestamp do servidor
 * @returns {FieldValue}
 */
export const getServerTimestamp = () => {
  return serverTimestamp();
};

/**
 * Gera ID único para documento
 * @param {string} prefix - Prefixo do ID
 * @returns {string}
 */
export const generateId = (prefix = "doc") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
};

// ============================================
// FUNÇÕES CRUD GENÉRICAS
// ============================================

/**
 * Busca um documento por ID
 * @param {string} collectionName - Nome da coleção
 * @param {string} docId - ID do documento
 * @returns {Promise<Object|null>}
 */
export const getDocumentById = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar documento ${docId} de ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Busca todos os documentos de uma coleção
 * @param {string} collectionName - Nome da coleção
 * @returns {Promise<Array>}
 */
export const getAllDocuments = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Erro ao buscar documentos de ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Cria ou atualiza um documento
 * @param {string} collectionName - Nome da coleção
 * @param {string} docId - ID do documento
 * @param {Object} data - Dados do documento
 * @param {boolean} merge - Se true, faz merge com dados existentes
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionName, docId, data, merge = false) => {
  try {
    const docRef = doc(db, collectionName, docId);
    
    const dataWithTimestamp = {
      ...data,
      updatedAt: getServerTimestamp(),
    };
    
    // Se não existir, adicionar createdAt
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      dataWithTimestamp.createdAt = getServerTimestamp();
    }
    
    await setDoc(docRef, dataWithTimestamp, { merge });
    
    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar documento ${docId} em ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Atualiza campos específicos de um documento
 * @param {string} collectionName - Nome da coleção
 * @param {string} docId - ID do documento
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, updates) => {
  try {
    const docRef = doc(db, collectionName, docId);
    
    const dataWithTimestamp = {
      ...updates,
      updatedAt: getServerTimestamp(),
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    
    return { success: true };
  } catch (error) {
    console.error(`Erro ao atualizar documento ${docId} em ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Deleta um documento
 * @param {string} collectionName - Nome da coleção
 * @param {string} docId - ID do documento
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error(`Erro ao deletar documento ${docId} de ${collectionName}:`, error);
    throw error;
  }
};

// ============================================
// FUNÇÕES DE QUERY
// ============================================

/**
 * Busca documentos com filtro
 * @param {string} collectionName - Nome da coleção
 * @param {Array} filters - Array de filtros [campo, operador, valor]
 * @param {Array} sorts - Array de ordenação [campo, direção]
 * @param {number} limitCount - Limite de resultados
 * @returns {Promise<Array>}
 */
export const queryDocuments = async (collectionName, filters = [], sorts = [], limitCount = null, options = {}) => {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints = [];
    
    // Adicionar filtros
    filters.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });
    
    // Adicionar ordenação
    sorts.forEach(([field, direction]) => {
      constraints.push(orderBy(field, direction));
    });
    
    // Adicionar limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    // Detectar erro de índice composto exigido pelo Firestore
    const isIndexError = (error?.code === 'failed-precondition') ||
      (typeof error?.message === 'string' && error.message.toLowerCase().includes('index'));

    const clientSortEnabled = options.clientSortOnIndexError !== false; // default true
    const hasSorts = Array.isArray(sorts) && sorts.length > 0;

    if (isIndexError && clientSortEnabled && hasSorts) {
      try {
        // Fallback: repetir consulta sem orderBy e ordenar no cliente
        console.warn(`⚠️ Índice composto ausente em '${collectionName}'. Aplicando fallback com ordenação no cliente...`);

        const collectionRef = collection(db, collectionName);
        const constraints = [];

        // Aplicar APENAS os filtros (sem orderBy) para não exigir índice composto
        filters.forEach(([field, operator, value]) => {
          constraints.push(where(field, operator, value));
        });

        // Ainda aplicar limite se fornecido (opcional)
        if (limitCount) {
          constraints.push(limit(limitCount));
        }

        const qNoOrder = query(collectionRef, ...constraints);
        const snapshot = await getDocs(qNoOrder);
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordenar em memória seguindo os sorts fornecidos (suporta múltiplas chaves)
        items.sort((a, b) => {
          for (const [field, direction] of sorts) {
            const dir = (direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;
            const av = a[field];
            const bv = b[field];

            // Tratar undefined/null como maiores (vão para o fim em asc)
            const aUndef = av === undefined || av === null;
            const bUndef = bv === undefined || bv === null;
            if (aUndef && bUndef) continue;
            if (aUndef) return 1;
            if (bUndef) return -1;

            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
          }
          return 0;
        });

        return items;
      } catch (fallbackErr) {
        console.error(`❌ Fallback de ordenação no cliente falhou para '${collectionName}':`, fallbackErr);
        throw fallbackErr;
      }
    }

    console.error(`Erro ao buscar documentos de ${collectionName} com filtros:`, error);
    throw error;
  }
};

// ============================================
// FUNÇÕES ESPECÍFICAS DE CÁLCULO
// ============================================

/**
 * Calcula pontos gerais baseado na colocação
 * @param {number} colocacao - Colocação (1-16)
 * @returns {number} - Pontos
 */
export const calcularPontosGerais = (colocacao) => {
  if (colocacao < 1 || colocacao > 16) {
    return 0;
  }
  return TABELA_PONTUACAO[colocacao - 1];
};

/**
 * Calcula saldo de gols
 * @param {number} golsPro 
 * @param {number} golsContra 
 * @returns {number}
 */
export const calcularSaldoGols = (golsPro, golsContra) => {
  return golsPro - golsContra;
};

/**
 * Calcula aproveitamento percentual
 * @param {number} pontos - Pontos conquistados
 * @param {number} jogos - Jogos disputados
 * @param {number} pontosPorVitoria - Pontos por vitória (padrão 3)
 * @returns {number} - Percentual (0-100)
 */
export const calcularAproveitamento = (pontos, jogos, pontosPorVitoria = 3) => {
  if (jogos === 0) return 0;
  const pontosMaximos = jogos * pontosPorVitoria;
  return Math.round((pontos / pontosMaximos) * 100);
};

/**
 * Formata tempo (milissegundos para MM:SS.mmm)
 * @param {number} milliseconds 
 * @returns {string}
 */
export const formatarTempo = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

/**
 * Converte string de tempo para milissegundos
 * @param {string} timeString - Formato "MM:SS.mmm"
 * @returns {number}
 */
export const tempoParaMilliseconds = (timeString) => {
  const [minutes, rest] = timeString.split(':');
  const [seconds, ms] = rest.split('.');
  
  return (parseInt(minutes) * 60 * 1000) + (parseInt(seconds) * 1000) + parseInt(ms);
};

/**
 * Aplica critérios de desempate
 * @param {Array} equipes - Array de equipes empatadas
 * @param {Array} criterios - Array de critérios
 * @returns {Array} - Equipes ordenadas
 */
export const aplicarCriteriosDesempate = (equipes, criterios) => {
  // TODO: Implementar lógica de desempate complexa
  // Por enquanto, retorna ordenado por pontos
  return equipes.sort((a, b) => b.pontos - a.pontos);
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida se um email é válido
 * @param {string} email 
 * @returns {boolean}
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida se uma data está no futuro
 * @param {Date} date 
 * @returns {boolean}
 */
export const dataNoFuturo = (date) => {
  return date > new Date();
};

/**
 * Valida se uma pontuação está dentro do intervalo
 * @param {number} pontos 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
export const validarPontuacao = (pontos, min, max) => {
  return pontos >= min && pontos <= max;
};

export default {
  // Constantes
  COLECOES,
  STATUS,
  FASES,
  CATEGORIAS,
  TABELA_PONTUACAO,
  
  // Conversão
  timestampToDate,
  dateToTimestamp,
  getServerTimestamp,
  generateId,
  
  // CRUD
  getDocumentById,
  getAllDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  
  // Cálculo
  calcularPontosGerais,
  calcularSaldoGols,
  calcularAproveitamento,
  formatarTempo,
  tempoParaMilliseconds,
  aplicarCriteriosDesempate,
  
  // Validação
  validarEmail,
  dataNoFuturo,
  validarPontuacao,
};
