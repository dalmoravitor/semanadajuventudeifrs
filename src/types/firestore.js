/**
 * TIPOS E INTERFACES - FIRESTORE SCHEMA
 * Documentação dos tipos de dados usados no Firestore
 * 
 * Nota: Este arquivo serve como documentação.
 * Em JavaScript, não há validação em tempo de compilação.
 */

// ============================================
// TIPOS BÁSICOS
// ============================================

/** @typedef {"masculino" | "feminino" | "misto"} Categoria */
/** @typedef {"coletiva" | "individual"} Tipo */
/** @typedef {"aguardando" | "em_andamento" | "concluido"} StatusModalidade */
/** @typedef {"pendente" | "em_andamento" | "concluido"} StatusConfronto */
/** @typedef {"confirmada" | "pendente" | "cancelada"} StatusInscricao */
/** @typedef {"chaves" | "oitavas" | "quartas" | "semi" | "final" | "terceiro"} Fase */

// ============================================
// INTERFACES DE COLEÇÕES
// ============================================

/**
 * @typedef {Object} Modalidade
 * @property {string} id - ID único da modalidade
 * @property {string} nome - Nome da modalidade
 * @property {Categoria} categoria - Categoria (masculino/feminino/misto)
 * @property {Tipo} tipo - Tipo (coletiva/individual)
 * @property {string} sistema - Sistema de competição
 * @property {Object} regrasPontuacao - Regras específicas da modalidade
 * @property {string[]} criterioDesempate - Critérios de desempate
 * @property {string} descricao - Descrição detalhada
 * @property {StatusModalidade} status - Status atual
 * @property {number} numeroChaves - Quantidade de chaves/grupos
 * @property {number} numeroEquipesPorChave - Equipes por chave
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Última atualização
 * @property {number} ordem - Ordem de exibição
 * @property {string} icone - Emoji/ícone
 */

/**
 * @typedef {Object} Equipe
 * @property {string} id - ID único da equipe
 * @property {string} nome - Nome da turma
 * @property {string} anoSerie - Série
 * @property {number} numeroTurma - Número da turma
 * @property {string} cor - Cor principal (hex)
 * @property {string} corSecundaria - Cor secundária
 * @property {Representante[]} representantes - Alunos responsáveis
 * @property {number} totalPontos - Pontuação geral acumulada
 * @property {number} totalModalidades - Modalidades participadas
 * @property {number} posicaoRanking - Posição no ranking geral
 * @property {ProvaInscricao} inscricaoKit - Dados da prova de inscrição
 * @property {ProvaDisciplina} disciplinaOrganizacao - Dados de disciplina
 * @property {ProvaPresenca} presencas - Dados de presença
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Representante
 * @property {string} nome - Nome do aluno
 * @property {string} cpf - CPF
 * @property {string} contato - Telefone
 */

/**
 * @typedef {Object} ProvaInscricao
 * @property {boolean} completa - Kit completo entregue?
 * @property {Date|null} dataEntrega - Data de entrega
 * @property {number} pontos - 160 ou 0
 */

/**
 * @typedef {Object} ProvaDisciplina
 * @property {number} pontos - Pontuação atual (max 160)
 * @property {number} ocorrencias - Quantidade de ocorrências
 * @property {number} avaliacoesSalaSuja - Avaliações negativas
 * @property {Object[]} historico - Histórico de ocorrências
 */

/**
 * @typedef {Object} ProvaPresenca
 * @property {number} totalAulas - Total de aulas
 * @property {number} totalPresencas - Total de presenças
 * @property {number} percentual - Percentual (0-100)
 * @property {number} pontos - Pontuação baseada no percentual
 */

/**
 * @typedef {Object} Inscricao
 * @property {string} modalidadeId - ID da modalidade
 * @property {InscricaoEquipe[]} equipes - Equipes inscritas
 * @property {number} totalEquipes - Total de inscritos
 * @property {number} limiteEquipes - Limite da modalidade
 * @property {boolean} inscricoesAbertas - Inscrições abertas?
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} InscricaoEquipe
 * @property {string} equipeId - ID da equipe
 * @property {string} nomeEquipe - Nome da equipe
 * @property {Date} dataInscricao - Data da inscrição
 * @property {StatusInscricao} status - Status da inscrição
 */

/**
 * @typedef {Object} Chaves
 * @property {string} modalidadeId - ID da modalidade
 * @property {Chave[]} chaves - Array de chaves
 * @property {EquipeClassificada[]} classificadosParaEliminatorias - Equipes que avançaram
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Chave
 * @property {number} chaveNumero - Número da chave (1-4)
 * @property {string} nomeChave - Nome (Chave A, B, C, D)
 * @property {EquipeChave[]} equipes - Equipes da chave
 * @property {JogoChave[]} jogos - Jogos da fase de chaves
 * @property {ClassificacaoChave[]} classificacao - Classificação final
 */

/**
 * @typedef {Object} EquipeChave
 * @property {string} equipeId
 * @property {string} nomeEquipe
 * @property {number} posicao - Posição na chave (1-4)
 */

/**
 * @typedef {Object} JogoChave
 * @property {string} jogoId
 * @property {string} equipeA
 * @property {string} equipeB
 * @property {number} rodada
 * @property {StatusConfronto} status
 */

/**
 * @typedef {Object} ClassificacaoChave
 * @property {string} equipeId
 * @property {number} posicao
 * @property {number} pontos
 * @property {number} jogos
 * @property {number} vitorias
 * @property {number} empates
 * @property {number} derrotas
 * @property {number} golsPro
 * @property {number} golsContra
 * @property {number} saldoGols
 * @property {number} aproveitamento
 */

/**
 * @typedef {Object} EquipeClassificada
 * @property {string} equipeId
 * @property {number} chaveOrigem
 * @property {number} posicaoChave
 */

/**
 * @typedef {Object} Confronto
 * @property {string} confrontoId - ID único do confronto
 * @property {string} modalidadeId - ID da modalidade
 * @property {Fase} fase - Fase do confronto
 * @property {number} faseOrdem - Ordem dentro da fase
 * @property {EquipeConfronto} equipeA - Equipe A
 * @property {EquipeConfronto} equipeB - Equipe B
 * @property {ResultadoConfronto} resultado - Resultado do confronto
 * @property {StatusConfronto} status - Status
 * @property {string|null} proximoConfrontoId - ID do próximo confronto
 * @property {"equipeA"|"equipeB"|null} posicaoProximoConfronto - Posição no próximo
 * @property {string} observacoes - Observações
 * @property {Date} dataHora - Data/hora do confronto
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} EquipeConfronto
 * @property {string} equipeId
 * @property {string} nomeEquipe
 * @property {string} origem - De onde veio (ex: "1º Chave A")
 */

/**
 * @typedef {Object} ResultadoConfronto
 * @property {number|null} scoreA - Placar equipe A
 * @property {number|null} scoreB - Placar equipe B
 * @property {string|null} vencedor - ID do vencedor
 * @property {JogoMelhorDe3[]|null} jogos - Para melhor de 3
 * @property {string|null} tempoA - Tempo equipe A
 * @property {string|null} tempoB - Tempo equipe B
 * @property {number[]|null} tentativasA - Tentativas equipe A
 * @property {number[]|null} tentativasB - Tentativas equipe B
 * @property {number|null} melhorMarcaA - Melhor marca A
 * @property {number|null} melhorMarcaB - Melhor marca B
 */

/**
 * @typedef {Object} JogoMelhorDe3
 * @property {number} jogo - Número do jogo (1, 2, 3)
 * @property {number} scoreA
 * @property {number} scoreB
 */

/**
 * @typedef {Object} Resultado
 * @property {string} resultadoId - ID único
 * @property {string} modalidadeId - ID da modalidade
 * @property {string} equipeId - ID da equipe
 * @property {number} colocacao - Colocação final (1-16)
 * @property {number} pontosGerais - Pontos para ranking geral (160-10)
 * @property {EstatisticasResultado} estatisticas - Estatísticas da modalidade
 * @property {HistoricoFase[]} historico - Histórico da participação
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} EstatisticasResultado
 * @property {number} [jogos] - Para modalidades com jogos
 * @property {number} [vitorias]
 * @property {number} [empates]
 * @property {number} [derrotas]
 * @property {number} [golsPro]
 * @property {number} [golsContra]
 * @property {number} [saldoGols]
 * @property {string} [melhorTempo] - Para modalidades de tempo
 * @property {string} [tempoMedio]
 * @property {number} [pontuacaoTotal] - Para modalidades de pontuação
 * @property {number} [pontuacaoMedia]
 * @property {number} [melhorMarca] - Para modalidades com tentativas
 * @property {number} [marcaMedia]
 */

/**
 * @typedef {Object} HistoricoFase
 * @property {string} fase
 * @property {string} resultado
 */

/**
 * @typedef {Object} Ranking
 * @property {"geral"|Categoria} tipo - Tipo de ranking
 * @property {ClassificacaoRanking[]} classificacao - Classificação
 * @property {number} [totalEquipes] - Total de equipes (apenas geral)
 * @property {Date} ultimaAtualizacao
 * @property {Date} calculadoEm
 */

/**
 * @typedef {Object} ClassificacaoRanking
 * @property {number} posicao
 * @property {string} equipeId
 * @property {string} nomeEquipe
 * @property {number} totalPontos
 * @property {number} modalidadesParticipadas
 * @property {number} primeirosLugares
 * @property {number} segundosLugares
 * @property {number} terceirosLugares
 * @property {number} [pontosMasculino] - Apenas ranking geral
 * @property {number} [pontosFeminino]
 * @property {number} [pontosMisto]
 * @property {number} [pontosInscricao]
 * @property {number} [pontosDisciplina]
 * @property {number} [pontosPresenca]
 */

/**
 * @typedef {Object} ConfiguracaoGeral
 * @property {string} nomeEvento
 * @property {number} anoEvento
 * @property {string} instituicao
 * @property {Date} dataInicio
 * @property {Date} dataFim
 * @property {number[]} tabelaPontuacao - Array de 16 posições
 * @property {boolean} eventoAtivo
 * @property {boolean} inscricoesAbertas
 * @property {Contatos} contatos
 * @property {Tema} tema
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Contatos
 * @property {string} email
 * @property {string} telefone
 * @property {string} site
 */

/**
 * @typedef {Object} Tema
 * @property {string} corPrimaria
 * @property {string} corSecundaria
 * @property {string} corDestaque
 */

/**
 * @typedef {Object} EquipePadrao
 * @property {string} nome
 * @property {number} numero
 * @property {string} serie
 * @property {string} cor
 */

/**
 * @typedef {Object} ConfiguracaoEquipesPadrao
 * @property {EquipePadrao[]} equipes
 * @property {Date} updatedAt
 */

// ============================================
// EXPORTS (para JSDoc)
// ============================================

export {};
