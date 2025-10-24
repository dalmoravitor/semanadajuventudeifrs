// Configuração de modalidades da XXIX Semana da Juventude – 2025
// Fonte: Regulamento enviado pelo usuário (resumo estruturado)

// Observação geral:
// - Para modalidades com fase de grupos (chaves), usa-se a pontuação padrão informada no regulamento técnico
//   quando aplicável: 3 (vitória), 1 (empate), 0 (derrota), salvo exceções específicas (Voleibol, Vôlei de Praia).
// - Para modalidades por tempo/medida, a classificação é por menor tempo/maior marca.
// - A pontuação para a classificação geral do evento (1º a 16º: 160..10) é global e pode ser aplicada após apurar
//   a colocação em cada modalidade.

export const modalidadesConfig = [
	// ==========================
	// Provas administrativas
	// ==========================
	{
		id: "inscricao_kit",
		nome: "Inscrição (Kit Solidário)",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "pontuacao-fixa",
		regrasPontuacao: {
			completa: 160,
			incompleta: 0,
		},
		criterioDesempate: ["não se aplica"],
		descricao:
			"Entrega do kit completo até 31/10 às 12h. Kit completo: 160 pontos; caso incompleto/fora do prazo: 0 ponto.",
	},
	{
		id: "disciplina_organizacao",
		nome: "Prova de Disciplina e Organização",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "pontuacao-decadente",
		regrasPontuacao: {
			base: 160,
			penalidadeOcorrencia: -10,
			penalidadeSalaSuja: -10,
			minimo: 0,
		},
		criterioDesempate: ["não se aplica"],
		descricao:
			"Cada turma inicia com 160. -10 por ocorrência registrada e -10 por avaliação de sala suja. Sem ocorrências e sala limpa = 160.",
	},
	{
		id: "presencas",
		nome: "Presenças",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "percentual",
		regrasPontuacao: {
			multiplicadorSobreGeral: 2,
			observacao:
				"Percentual de presença é ranqueado e pontuado com o dobro da pontuação geral das modalidades.",
		},
		criterioDesempate: ["percentual mais alto", "sorteio"],
		descricao:
			"Chamada 2x ao dia. Ranking por percentual de presença, pontuado em dobro em relação às demais modalidades.",
	},

	// ==========================
	// Jogos on-line
	// ==========================
	{
		id: "cs_go",
		nome: "CS – GO",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "eliminacao-simples",
		regrasPontuacao: {
			formato: "Partida Curta 16 rounds; final com 30 rounds",
			pausas: 3,
			pausaDuracaoMin: 1,
		},
		criterioDesempate: ["não se aplica (eliminação direta)", "decisão do lado por acordo"],
		descricao:
			"Equipes de 5 (+1 reserva opcional). Eliminatória simples em 4 etapas. Map veto por exclusão. Condutas inadequadas geram desclassificação.",
	},
	{
		id: "fifa",
		nome: "FIFA (on-line)",
		categoria: "misto",
		tipo: "individual",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			wo: { placar: "3x0" },
			observacao: "Todos jogam com o mesmo time (Real Madrid). Empate no mata-mata vai para pênaltis.",
		},
		criterioDesempate: [
			"confronto direto (entre duas equipes)",
			"maior saldo de gols",
			"maior média de gols feitos",
			"menor média de gols sofridos",
			"sorteio",
		],
		descricao:
			"16 equipes em 4 chaves; todos contra todos na chave; classificam 1º e 2º. Eliminatória com pênaltis em caso de empate.",
	},
	{
		id: "mortal_kombat",
		nome: "Mortal Kombat",
		categoria: "misto",
		tipo: "individual",
		sistema: "chaves",
		regrasPontuacao: { vitoria: 3, derrota: 0 },
		criterioDesempate: ["confronto direto (entre duas equipes)", "sorteio"],
		descricao:
			"16 equipes em 4 chaves; todos contra todos; classificam 1º e 2º de cada chave. Condutas inadequadas geram desclassificação.",
	},

	// ==========================
	// Tradição/Regionalismo
	// ==========================
	{
		id: "tiro_laco_masc",
		nome: "Tiro de Laço à Vaca-Parada",
		categoria: "masculino",
		tipo: "individual",
		sistema: "pontuacao-acumulada",
		regrasPontuacao: {
			armadas: 5,
			distanciaM: 7,
			pontuacaoPorArmada: { 1: 10, 2: 9, 3: 8, 4: 7, 5: 1 },
			tempoPorArmadaSeg: 60,
		},
		criterioDesempate: ["maior soma de pontos"],
		descricao:
			"5 armadas por competidor. Regras de indumentária e procedimento. Pontuação decrescente por armada válida (1ª a 5ª).",
	},
	{
		id: "tiro_laco_fem",
		nome: "Tiro de Laço à Vaca-Parada",
		categoria: "feminino",
		tipo: "individual",
		sistema: "pontuacao-acumulada",
		regrasPontuacao: {
			armadas: 5,
			distanciaM: 4.5,
			pontuacaoPorArmada: { 1: 10, 2: 9, 3: 8, 4: 7, 5: 1 },
			tempoPorArmadaSeg: 60,
		},
		criterioDesempate: ["maior soma de pontos"],
		descricao:
			"5 armadas por competidora. Distância reduzida. Mesmas regras de pontuação e execução.",
	},
	{
		id: "bocha_campeira",
		nome: "Bocha Campeira",
		categoria: "misto",
		tipo: "coletiva (dupla)",
		sistema: "chaves (rodízio simples)+eliminacao",
		regrasPontuacao: {
			pontoPorBocha: 1,
			pontosParaVencer: 6,
		},
		criterioDesempate: [
			"entre duas equipes: confronto direto",
			"entre três: saldo de pontos",
			"maior nº de pontos feitos",
			"menor nº de pontos sofridos",
			"sorteio",
		],
		descricao:
			"16 equipes em 4 chaves, rodízio simples. Classificam 1º e 2º de cada chave.",
	},

	// ==========================
	// Culturais / Intelectuais
	// ==========================
	{
		id: "culinaria",
		nome: "Culinária",
		categoria: "misto",
		tipo: "coletiva (4 integrantes)",
		sistema: "pontuacao",
		regrasPontuacao: {
			tempoMaxMin: 120,
			penalidadeAtraso: "-50% da pontuação se exceder o tempo",
			criterios: {
				"Sabor e Temperatura": 30,
				"Apresentação e Criatividade": 20,
				"Textura e Consistência": 20,
				"Uso de Ingredientes": 20,
				"Higiene e Organização": 10,
			},
		},
		criterioDesempate: ["maior pontuação nos critérios em ordem (Sabor, Apresentação, Textura, Ingredientes, Higiene)", "sorteio"],
		descricao:
			"Receitas padronizadas: Risoto de carne bovina e Torta Banoffee. Equipe mista obrigatória. Avaliação por banca.",
	},
	{
		id: "gincana_tecnico_cultural",
		nome: "Gincana Técnico-Cultural (Kahoot)",
		categoria: "misto",
		tipo: "coletiva (3 integrantes)",
		sistema: "pontuacao (plataforma)",
		regrasPontuacao: {
			perguntas: 40,
			alternativas: 4,
			tempoPorPerguntaSeg: 20,
			certo: "pontuação dinâmica por tempo",
			errado: 0,
		},
		criterioDesempate: ["classificação da própria plataforma"],
		descricao:
			"Uso de celulares pelos 3 representantes. Torcida não pode soprar respostas. Plataforma define a classificação.",
	},
	{
		id: "show_de_talentos",
		nome: "Show de Talentos",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "pontuacao",
		regrasPontuacao: {
			tempoMaxMin: 15,
			penalidadeTempo: "-10 pontos por minuto excedente",
			criterios: {
				"Criatividade e Originalidade": 25,
				"Habilidade Técnica / Qualidade Artística": 25,
				"Performance e Engajamento": 25,
				"Adequação ao Tema e Normas (eliminatório)": 25,
			},
			tema: "Cultura Gaúcha",
		},
		criterioDesempate: ["maior nota nos critérios na ordem apresentada", "decisão da comissão", "sorteio"],
		descricao:
			"Apresentações artísticas sobre Cultura Gaúcha. Observância às políticas institucionais e código de conduta.",
	},
	{
		id: "soletrando",
		nome: "Soletrando",
		categoria: "misto",
		tipo: "coletiva (3 integrantes)",
		sistema: "soletrando", // Sistema específico
		regrasPontuacao: {
			classificatoria: {
				rodadas: 3,
				acerto: 1,
				tempoSeg: 60,
				classificados: 5,
			},
			final: {
				formato: "eliminatória",
				rankingEmpate: "ordem de eliminação; empates na mesma rodada usam pontuação da etapa anterior",
			},
		},
		criterioDesempate: [
			"primeira resposta correta",
			"segunda resposta correta",
			"... até a sexta",
			"eliminatória direta se persistir",
		],
		descricao: "Disputa em duas fases, com sorteio da ordem e palavras aleatórias por rodada.",
	},
	{
		id: "sudoku",
		nome: "Sudoku",
		categoria: "misto",
		tipo: "coletiva (2 integrantes)",
		sistema: "multi-etapas (tempo)",
		regrasPontuacao: {
			materiais: ["lápis/lapiseira/borracha (rasuras não permitidas na versão final)", "caneta azul/preta para entrega"],
			etapas: [
				{
					nome: "Etapa 1",
					subdivisoes: [5, 5, 6],
					vagasPorSubdivisao: 2,
					tempoMaxMin: 10,
					penalidades: {
						ate3Erros: 15,
						maisDe3ErrosOuNaoConclui: 16,
					},
				},
				{
					nome: "Etapa 2",
					descricao: "Novo sudoku por subdivisão, mesmas regras da etapa 1",
				},
				{
					nome: "Etapa 3 (Semifinal)",
					descricao:
						"6 equipes juntas, 3 sudokus (até 15min cada); penalidades: 22min até 3 erros; 25min >3 erros/NC. 3 menores somatórios avançam",
				},
				{
					nome: "Final",
					descricao: "2 sudokus simultâneos; erro desclassifica; repetido até ordenar 1º, 2º, 3º",
				},
			],
			desempateGeral: "usar somatórios das etapas anteriores, se necessário",
		},
		criterioDesempate: ["menor somatório de tempo", "regras de penalidade", "sorteio"],
		descricao: "Disputa por menor tempo com penalidades por erros e não conclusão.",
	},
	{
		id: "xadrez",
		nome: "Xadrez (Rápido)",
		categoria: "misto",
		tipo: "individual (dupla por turma)",
		sistema: "suíço (5 rodadas)",
		regrasPontuacao: { vitoria: 1, empate: 0.5, derrota: 0, tempoMin: 10 },
		criterioDesempate: ["padrões de torneios rápidos (não especificado)"],
		descricao:
			"Duplas por turma. 5 rodadas; perdedor segue no torneio (sem eliminação imediata). Conduta inadequada gera desclassificação.",
	},

	// ==========================
	// Cartas
	// ==========================
	{
		id: "truco",
		nome: "Truco (Baralho Espanhol)",
		categoria: "misto",
		tipo: "coletiva (dupla)",
		sistema: "eliminacao-simples (melhor-de-3)",
		regrasPontuacao: {
			ate: 24,
			tentos: {
				trucoNaoAceito: 1,
				trucoAceito: 2,
				retruco: 3,
				valeQuatro: 4,
				envidoNaoAceito: 1,
				envidoAceito: 2,
				realEnvidoAceito: 3,
				realEnvidoRecusado: 1,
				flor: 3,
				faltaEnvido: "até completar 24 do adversário",
			},
		},
		criterioDesempate: ["não se aplica (melhor de 3)"],
		descricao:
			"Baralho espanhol (40 cartas). Regras clássicas de Truco com Envido/Flor, propostas e penalidades conforme regulamento.",
	},
	{
		id: "bisca",
		nome: "Bisca (Baralho Espanhol)",
		categoria: "misto",
		tipo: "coletiva (dupla)",
		sistema: "eliminacao-simples (melhor-de-3)",
		regrasPontuacao: {
			valoresCartas: {
				As: 11,
				Tres: 10,
				Rei: 4,
				Cavalo: 3,
				Sota: 2,
				SeteSeisCincoQuatroDois: 0,
			},
			baralho: 40,
			trunfo: "naipe da carta aberta após corte; 7 pode trocar a carta de trunfo",
		},
		criterioDesempate: ["não se aplica (melhor de 3)"],
		descricao:
			"Duplas; conversa após 1ª rodada permitida. Uso de celular ou sinais: desclassificação imediata.",
	},

	// ==========================
	// Esportes coletivos de quadra
	// ==========================
	{
		id: "handebol_masc",
		nome: "Handebol",
		categoria: "masculino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			tempo: "8 min (sem troca de lado)",
			penalidadeExclusao: "2 ataques",
			desempateMataMata: "3 cobranças de 7m; depois alternadas",
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média de pontos disciplinares",
			"menor média de gols sofridos",
			"maior média de gols feitos",
			"sorteio",
		],
		descricao:
			"16 equipes em 4 chaves (ajustável pela comissão). Não usar adesivo nas mãos. Regras específicas de exclusão.",
	},
	{
		id: "handebol_fem",
		nome: "Handebol",
		categoria: "feminino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			tempo: "8 min (sem troca de lado)",
			penalidadeExclusao: "2 ataques",
			desempateMataMata: "3 cobranças de 7m; depois alternadas",
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média de pontos disciplinares",
			"menor média de gols sofridos",
			"maior média de gols feitos",
			"sorteio",
		],
		descricao: "Mesmo formato do masculino.",
	},
	{
		id: "cabo_de_guerra",
		nome: "Cabo-de-guerra",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "chaves",
		regrasPontuacao: {
			composicao: { meninos: 5, meninas: 5 },
			observacao: "soltar a corda: desclassificação e pontuação zerada",
		},
		criterioDesempate: ["sorteio"],
		descricao:
			"16 equipes em 4 chaves (ideal). Equipamentos pessoais (tênis/luvas) por conta dos alunos. Regras de definição de 5º ao 12º via posições dos 4 primeiros.",
	},
	{
		id: "voleibol_masc",
		nome: "Voleibol",
		categoria: "masculino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			setFormato: "1 set a 21 (final: 2 sets a 21; tie-break a 15)",
			grupos: {
				vitoria_2x0: 3,
				vitoria_2x1: 2,
				derrota_1x2: 1,
				derrota_0x2: 0,
			},
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média pontos disciplinares",
			"menor nº de pontos sofridos nos sets",
			"maior nº de pontos feitos nos sets",
			"sorteio",
		],
		descricao: "16 equipes em 4 chaves (ajustável).",
	},
	{
		id: "voleibol_fem",
		nome: "Voleibol",
		categoria: "feminino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			setFormato: "1 set a 21 (final: 2 sets a 21; tie-break a 15)",
			grupos: {
				vitoria_2x0: 3,
				vitoria_2x1: 2,
				derrota_1x2: 1,
				derrota_0x2: 0,
			},
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média pontos disciplinares",
			"menor nº de pontos sofridos nos sets",
			"maior nº de pontos feitos nos sets",
			"sorteio",
		],
		descricao: "Mesmo formato do masculino.",
	},
	{
		id: "volei_de_praia_misto",
		nome: "Vôlei de Praia",
		categoria: "misto",
		tipo: "coletiva (duplas alternadas)",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			setUnico: 21,
			trocaLadoAoPonto: 11,
			duplas: { feminina: 1, masculina: 1, trocaObrigatoriaNo11: true },
			grupos: { vitoria: 3, derrota: 1, wo: 0 },
			woPlacar: "21x0, 1 set a 0",
		},
		criterioDesempate: [
			"entre duas: confronto direto",
			"entre três ou mais: nº de vitórias, pontos average, sorteio",
		],
		descricao:
			"Set único a 21, sem descansos na troca de quadra. Duplas masculina e feminina jogam, com troca ao atingir 11 pontos.",
	},
	{
		id: "basquetebol_masc",
		nome: "Basquetebol",
		categoria: "masculino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			tempo: "2 tempos de 5min (total 10min)",
			lancesLivres: "2 arremessos em faltas (exceto 3 pts)",
			desempate: "3 lances livres alternados; depois alternadas",
		},
		criterioDesempate: [
			"confronto direto",
			"menor média de pontos disciplinares",
			"menor média de pontos sofridos",
			"maior média de pontos feitos",
			"sorteio",
		],
		descricao: "16 equipes em 4 chaves (ajustável).",
	},
	{
		id: "basquetebol_fem",
		nome: "Basquetebol",
		categoria: "feminino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			tempo: "2 tempos de 5min (total 10min)",
			lancesLivres: "2 arremessos em faltas (exceto 3 pts)",
			desempate: "3 lances livres alternados; depois alternadas",
		},
		criterioDesempate: [
			"confronto direto",
			"menor média de pontos disciplinares",
			"menor média de pontos sofridos",
			"maior média de pontos feitos",
			"sorteio",
		],
		descricao: "Mesmo formato do masculino.",
	},
	{
		id: "futsal_masc",
		nome: "Futsal",
		categoria: "masculino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			faltas: {
				comCartao: "tiro livre direto do local ou dos 10m, sem barreira",
				semCartaoPrimeiras: "1ª e 2ª faltas com barreira",
				aPartir3a: "sem barreira",
			},
			desempateMataMata: "3 pênaltis; depois alternados",
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média pontos disciplinares",
			"menor média de gols sofridos",
			"maior média de gols feitos",
			"sorteio",
		],
		descricao: "16 equipes em 4 chaves (ajustável).",
	},
	{
		id: "futsal_fem",
		nome: "Futsal",
		categoria: "feminino",
		tipo: "coletiva",
		sistema: "chaves+eliminacao",
		regrasPontuacao: {
			grupos: { vitoria: 3, empate: 1, derrota: 0 },
			faltas: {
				comCartao: "tiro livre direto do local ou dos 10m, sem barreira",
				semCartaoPrimeiras: "1ª e 2ª faltas com barreira",
				aPartir3a: "sem barreira",
			},
			desempateMataMata: "3 pênaltis; depois alternados",
		},
		criterioDesempate: [
			"confronto direto (entre duas)",
			"menor média pontos disciplinares",
			"menor média de gols sofridos",
			"maior média de gols feitos",
			"sorteio",
		],
		descricao: "Mesmo formato do masculino.",
	},

	// ==========================
	// Atletismo
	// ==========================
	{
		id: "atletismo_100m_fem",
		nome: "Atletismo 100m",
		categoria: "feminino",
		tipo: "individual",
		sistema: "eliminatoria+final (tempo)",
		regrasPontuacao: {
			baterias: 4,
			classificamParaFinal: 1,
			criterioClassificacao: "1º de cada bateria à final; demais por tempos para ordenar 5º ao 16º",
		},
		criterioDesempate: ["menor tempo"],
		descricao: "Provas em 4 baterias com final entre os vencedores das baterias.",
	},
	{
		id: "atletismo_100m_masc",
		nome: "Atletismo 100m",
		categoria: "masculino",
		tipo: "individual",
		sistema: "eliminatoria+final (tempo)",
		regrasPontuacao: {
			baterias: 4,
			classificamParaFinal: 1,
			criterioClassificacao: "1º de cada bateria à final; demais por tempos para ordenar 5º ao 16º",
		},
		criterioDesempate: ["menor tempo"],
		descricao: "Formato idêntico ao feminino.",
	},
	{
		id: "atletismo_4x100_misto",
		nome: "Revezamento 4x100m",
		categoria: "misto",
		tipo: "coletiva",
		sistema: "eliminatoria+final (tempo)",
		regrasPontuacao: {
			baterias: 4,
			classificamParaFinal: 1,
		},
		criterioDesempate: ["menor tempo"],
		descricao: "Revezamento misto 4x100m com eliminatórias e final.",
	},
	{
		id: "atletismo_800m_fem",
		nome: "Atletismo 800m",
		categoria: "feminino",
		tipo: "individual",
		sistema: "bateria-unica (tempo)",
		regrasPontuacao: {},
		criterioDesempate: ["menor tempo"],
		descricao: "Bateria única. Classificação por tempo.",
	},
	{
		id: "atletismo_800m_masc",
		nome: "Atletismo 800m",
		categoria: "masculino",
		tipo: "individual",
		sistema: "bateria-unica (tempo)",
		regrasPontuacao: {},
		criterioDesempate: ["menor tempo"],
		descricao: "Bateria única. Classificação por tempo.",
	},
	{
		id: "atletismo_1500m_masc",
		nome: "Atletismo 1500m",
		categoria: "masculino",
		tipo: "individual",
		sistema: "bateria-unica (tempo)",
		regrasPontuacao: {},
		criterioDesempate: ["menor tempo"],
		descricao: "Bateria única apenas masculino. Classificação por tempo.",
	},
	{
		id: "salto_distancia_fem",
		nome: "Salto em Distância",
		categoria: "feminino",
		tipo: "individual",
		sistema: "melhor-de-3 (medida)",
		regrasPontuacao: {
			tentativas: 3,
			melhorMarca: true,
			desempate: "novo salto em caso de empate",
		},
		criterioDesempate: ["salto extra"],
		descricao: "Conta-se a melhor marca entre 3 tentativas.",
	},
	{
		id: "salto_distancia_masc",
		nome: "Salto em Distância",
		categoria: "masculino",
		tipo: "individual",
		sistema: "melhor-de-3 (medida)",
		regrasPontuacao: {
			tentativas: 3,
			melhorMarca: true,
			desempate: "novo salto em caso de empate",
		},
		criterioDesempate: ["salto extra"],
		descricao: "Conta-se a melhor marca entre 3 tentativas.",
	},
	{
		id: "dardo_fem",
		nome: "Lançamento de Dardo",
		categoria: "feminino",
		tipo: "individual",
		sistema: "melhor-de-3 (medida)",
		regrasPontuacao: {
			tentativas: 3,
			arremessoAcimaOmbro: true,
			desempate: "novo arremesso",
		},
		criterioDesempate: ["arremesso extra"],
		descricao: "Conta-se a melhor marca; arremesso acima da linha dos ombros.",
	},
	{
		id: "dardo_masc",
		nome: "Arremesso de Dardo",
		categoria: "masculino",
		tipo: "individual",
		sistema: "melhor-de-3 (medida)",
		regrasPontuacao: {
			tentativas: 3,
			arremessoAcimaOmbro: true,
			desempate: "novo arremesso",
		},
		criterioDesempate: ["arremesso extra"],
		descricao: "Conta-se a melhor marca; arremesso acima da linha dos ombros.",
	},

	// ==========================
	// Gincana recreativa
	// ==========================
	{
		id: "gincana_recreativa",
		nome: "Gincana Recreativa",
		categoria: "misto",
		tipo: "coletiva (10 integrantes)",
		sistema: "tempo",
		regrasPontuacao: {
			tarefas: 10,
			tempoMaxMin: 10,
			penalidadeElementoQuebrado: "+30 segundos",
			ordemDesempate: ["menor tempo", "tarefa realizada", "quebra do ovo", "sorteio"],
		},
		criterioDesempate: ["ordem de critérios definida: tempo > tarefa > ovo > sorteio"],
		descricao:
			"Corrida de tarefas com ‘elemento de transferência (ovo)’. Passa ao próximo apenas após sinal do fiscal.",
	},
];

export default modalidadesConfig;

