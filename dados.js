// ==========================================
// OBSERVATÓRIO DE POLÍTICAS PÚBLICAS DE NOVA LIMA
// BANCO DE DADOS INICIAL OFICIAL (DADOS.JS)
// ==========================================

const INITIAL_USERS = [
    {
        id: 1,
        name: "João Duarte",
        email: "joao.duarte@pnl.mg.gov.br",
        password: "novalima2026",
        secretaria: "SEPLAG - Gestão Estratégica",
        role: "SEPLAG_ADMIN"
    },
    {
        id: 2,
        name: "Ponto Focal Social",
        email: "social@pnl.mg.gov.br",
        password: "novalima2026",
        secretaria: "Desenvolvimento Social",
        role: "SECRETARIA"
    },
    {
        id: 3,
        name: "Gabinete do Prefeito",
        email: "gabinete@pnl.mg.gov.br",
        password: "novalima2026",
        secretaria: "Gabinete do Prefeito",
        role: "CONSULTA"
    }
];

const INITIAL_POLICIES = [
    // --- EIXO 1: DESENVOLVIMENTO SOCIAL, DIREITOS HUMANOS E RENDA ---
    {
        id: 1,
        nome: "Programa Nova Renda",
        secretaria: "Desenvolvimento Social",
        eixo: "Desenvolvimento Social e Renda",
        territorio: "Todo o Município",
        ods: "ODS 1 - Erradicação da Pobreza",
        beneficiarios: 4200,
        orcamento: 15120000,
        produto: "Famílias em vulnerabilidade extrema com benefício mensal depositado e acompanhamento nos CRAS",
        resultado: "Superação da insegurança alimentar severa e autonomia socioeconômica continuada",
        progresso: 94,
        status: "No Prazo",
        nota: "Folha de pagamento de benefícios auditada pela Fazenda referente ao ciclo vigente."
    },
    {
        id: 2,
        nome: "Programa Bem Cuidar",
        secretaria: "Desenvolvimento Social",
        eixo: "Desenvolvimento Social e Renda",
        territorio: "Todo o Município",
        ods: "ODS 3 - Saúde e Bem-Estar",
        beneficiarios: 1850,
        orcamento: 2200000,
        produto: "Visitas continuadas multidisciplinares a idosos e pessoas com deficiência sem mobilidade",
        resultado: "Garantia de dignidade, suporte familiar e prevenção a internações e institucionalizações",
        progresso: 89,
        status: "No Prazo",
        nota: "Equipes de assistência social e saúde operando com cadastro unificado de atendimento."
    },
    {
        id: 3,
        nome: "Família Acolhedora (SAFA) & Guarda Subsidiada",
        secretaria: "Desenvolvimento Social",
        eixo: "Desenvolvimento Social e Renda",
        territorio: "Todo o Município",
        ods: "ODS 10 - Redução das Desigualdades",
        beneficiarios: 120,
        orcamento: 650000,
        produto: "Crianças e adolescentes acolhidos provisoriamente em lares familiares habilitados",
        resultado: "Preservação dos vínculos afetivos e comunitários durante medidas protetivas judiciais",
        progresso: 91,
        status: "No Prazo",
        nota: "Capacitação contínua de famílias acolhedoras e parecer favorável da Vara da Infância."
    },
    {
        id: 4,
        nome: "Escritório de Transformação Social",
        secretaria: "Governo / Desenvolvimento Social",
        eixo: "Desenvolvimento Social e Renda",
        territorio: "Todo o Município",
        ods: "ODS 17 - Parcerias e Meios de Implementação",
        beneficiarios: 3500,
        orcamento: 980000,
        produto: "Organizações da Sociedade Civil (OSCs) capacitadas e assessoradas na captação de recursos",
        resultado: "Multiplicação do alcance dos projetos sociais via Fundos da Criança e do Idoso",
        progresso: 86,
        status: "No Prazo",
        nota: "Mais de 25 entidades civis do município com projetos chancelados e regulares."
    },
    {
        id: 5,
        nome: "Programa Reintegrar Nova Lima",
        secretaria: "Desenvolvimento Social",
        eixo: "Desenvolvimento Social e Renda",
        territorio: "Região Sede / Centro",
        ods: "ODS 16 - Paz, Justiça e Instituições Eficazes",
        beneficiarios: 140,
        orcamento: 420000,
        produto: "Atendimento psicossocial, cursos profissionalizantes e oficinas de formação cidadã",
        resultado: "Redução drástica da reincidência e resgate da cidadania produtiva",
        progresso: 80,
        status: "No Prazo",
        nota: "Parceria interinstitucional ativa com o Tribunal de Justiça de Minas Gerais."
    },

    // --- EIXO 2: TRANSPORTE, MOBILIDADE E HABITAÇÃO ---
    {
        id: 6,
        nome: "Tarifa Reduzida (R$ 2,00) & Tarifa Zero",
        secretaria: "Transporte e Trânsito",
        eixo: "Transporte e Mobilidade Urbana",
        territorio: "Todo o Município",
        ods: "ODS 11 - Cidades e Comunidades Sustentáveis",
        beneficiarios: 68000,
        orcamento: 22500000,
        produto: "Subsídio integral para passe livre aos domingos/feriados e fixação da passagem em R$ 2,00",
        resultado: "Aumento de 42% no acesso ao lazer, comércio central e integração territorial do município",
        progresso: 97,
        status: "Superado",
        nota: "Auditoria bimestral de bilhetagem eletrônica validada junto à concessionária."
    },
    {
        id: 7,
        nome: "Programa Passe Estudantil",
        secretaria: "Desenvolvimento Social / Educação",
        eixo: "Transporte e Mobilidade Urbana",
        territorio: "Todo o Município",
        ods: "ODS 4 - Educação de Qualidade",
        beneficiarios: 4200,
        orcamento: 3800000,
        produto: "Créditos mensais de passagens municipais e metropolitanas para estudantes de baixa renda",
        resultado: "Combate à evasão escolar e ao abandono universitário por motivos de deslocamento",
        progresso: 95,
        status: "Superado",
        nota: "Recadastramento digital semestral concluído para alunos da rede pública e técnica."
    },
    {
        id: 8,
        nome: "Regularização Fundiária Urbana (REURB Social)",
        secretaria: "Habitação",
        eixo: "Transporte e Mobilidade Urbana",
        territorio: "Honório Bicalho",
        ods: "ODS 11 - Cidades e Comunidades Sustentáveis",
        beneficiarios: 1800,
        orcamento: 3200000,
        produto: "Levantamento topográfico, certidões e entrega de títulos de propriedade registrados em cartório",
        resultado: "Segurança jurídica da posse, dignidade residencial e acesso a financiamentos",
        progresso: 72,
        status: "Atenção",
        nota: "Fase de processamento cartorial do loteamento central em Honório Bicalho."
    },

    // --- EIXO 3: SAÚDE PÚBLICA E PREVENÇÃO ---
    {
        id: 9,
        nome: "Celima (Atendimento Digital da Saúde)",
        secretaria: "Saúde",
        eixo: "Saúde e Qualidade de Vida",
        territorio: "Todo o Município",
        ods: "ODS 3 - Saúde e Bem-Estar",
        beneficiarios: 45000,
        orcamento: 890000,
        produto: "Sistema inteligente via WhatsApp para confirmação, cancelamento e agendamento de consultas SUS",
        resultado: "Redução de 35% no absenteísmo (faltas não justificadas) em consultas especializadas",
        progresso: 93,
        status: "No Prazo",
        nota: "Mais de 150 mil notificações ativas emitidas nos últimos 12 meses."
    },
    {
        id: 10,
        nome: "Farmácia Municipal Descentralizada",
        secretaria: "Saúde",
        eixo: "Saúde e Qualidade de Vida",
        territorio: "Região Sede / Centro",
        ods: "ODS 3 - Saúde e Bem-Estar",
        beneficiarios: 26000,
        orcamento: 4900000,
        produto: "Polos de dispensação de medicamentos básicos e controlados com horário estendido",
        resultado: "Adesão continuada ao tratamento de doenças crônicas e fim de filas concentradas",
        progresso: 90,
        status: "No Prazo",
        nota: "Índice de abastecimento da Relação Municipal de Medicamentos (REMUME) em 96%."
    },
    {
        id: 11,
        nome: "Práticas Integrativas e Complementares (PICS)",
        secretaria: "Saúde",
        eixo: "Saúde e Qualidade de Vida",
        territorio: "Todo o Município",
        ods: "ODS 3 - Saúde e Bem-Estar",
        beneficiarios: 5800,
        orcamento: 750000,
        produto: "Sessões contínuas de acupuntura, fitoterapia, auriculoterapia e reiki nas UBSs",
        resultado: "Diminuição do uso excessivo de ansiolíticos e melhoria da saúde mental preventiva",
        progresso: 88,
        status: "No Prazo",
        nota: "Atendimento multidisciplinar integrado aos núcleos de saúde da família."
    },
    {
        id: 12,
        nome: "PACE Hemominas Nova Lima",
        secretaria: "Saúde",
        eixo: "Saúde e Qualidade de Vida",
        territorio: "Região Sede / Centro",
        ods: "ODS 3 - Saúde e Bem-Estar",
        beneficiarios: 6000,
        orcamento: 620000,
        produto: "Posto Avançado de Coleta Externa de sangue em funcionamento com coletas programadas",
        resultado: "Autossuficiência dos estoques de sangue para o Hospital Nossa Senhora de Lourdes",
        progresso: 96,
        status: "Superado",
        nota: "Cronograma de doações quinzenais 100% preenchido com antecedência."
    },

    // --- EIXO 4: EDUCAÇÃO, INFÂNCIA E CIDADANIA ---
    {
        id: 13,
        nome: "Educação em Tempo Integral",
        secretaria: "Educação",
        eixo: "Educação, Infância e Cidadania",
        territorio: "Todo o Município",
        ods: "ODS 4 - Educação de Qualidade",
        beneficiarios: 3800,
        orcamento: 12400000,
        produto: "Alunos com 9 horas de permanência diária com 4 refeições e oficinas pedagógicas/culturais",
        resultado: "Elevação do rendimento escolar básico e acolhimento protetivo de crianças no contraturno",
        progresso: 87,
        status: "No Prazo",
        nota: "Expansão da rede para mais 4 escolas municipais concluída no início do ano letivo."
    },
    {
        id: 14,
        nome: "Programa Escola Bilíngue",
        secretaria: "Educação",
        eixo: "Educação, Infância e Cidadania",
        territorio: "Noroeste (Jardim Canadá / Vila da Serra / Alphaville)",
        ods: "ODS 4 - Educação de Qualidade",
        beneficiarios: 1200,
        orcamento: 1450000,
        produto: "Imersão curricular em língua inglesa no contraturno das escolas municipais polo",
        resultado: "Democratização do ensino de idiomas para estudantes de famílias de menor renda",
        progresso: 82,
        status: "No Prazo",
        nota: "Material pedagógico internacional distribuído e professores capacitados."
    },
    {
        id: 15,
        nome: "Baby Gym Municipal",
        secretaria: "Educação",
        eixo: "Educação, Infância e Cidadania",
        territorio: "Todo o Município",
        ods: "ODS 4 - Educação de Qualidade",
        beneficiarios: 2100,
        orcamento: 950000,
        produto: "Salas equipadas com psicomotricidade sensorial para bebês e crianças de 4 meses a 5 anos",
        resultado: "Detecção precoce de atrasos neuropsicomotores e ganho cognitivo na primeira infância",
        progresso: 91,
        status: "No Prazo",
        nota: "Avaliações periódicas conduzidas por fisioterapeutas e pedagogos das creches."
    },
    {
        id: 16,
        nome: "Casa do Educador",
        secretaria: "Educação",
        eixo: "Educação, Infância e Cidadania",
        territorio: "Região Sede / Centro",
        ods: "ODS 4 - Educação de Qualidade",
        beneficiarios: 1600,
        orcamento: 820000,
        produto: "Centro de formação continuada, biblioteca docente e suporte à saúde vocal e emocional do educador",
        resultado: "Valorização da carreira docente e redução de afastamentos por esgotamento profissional",
        progresso: 88,
        status: "No Prazo",
        nota: "Média mensal de 220 professores participando de formações especializadas."
    },

    // --- EIXO 5: DESENVOLVIMENTO ECONÔMICO, INOVAÇÃO E TRABALHO ---
    {
        id: 17,
        nome: "Conexão Profissional & Banco de Talentos",
        secretaria: "Desenvolvimento Econômico",
        eixo: "Desenvolvimento Econômico e Inovação",
        territorio: "Todo o Município",
        ods: "ODS 8 - Trabalho Decente e Crescimento",
        beneficiarios: 5400,
        orcamento: 1100000,
        produto: "Intermediação digital de vagas locais, elaboração de currículos e encaminhamento para entrevistas",
        resultado: "Priorização de moradores de Nova Lima nas contratações do comércio, serviços e indústrias",
        progresso: 89,
        status: "No Prazo",
        nota: "Mais de 1.400 contratações diretas registradas no CAGED municipal via plataforma."
    },
    {
        id: 18,
        nome: "Programa iNovaTech & iNovaStartup",
        secretaria: "Desenvolvimento Econômico",
        eixo: "Desenvolvimento Econômico e Inovação",
        territorio: "Noroeste (Jardim Canadá / Vila da Serra / Alphaville)",
        ods: "ODS 9 - Indústria, Inovação e Infraestrutura",
        beneficiarios: 1300,
        orcamento: 1950000,
        produto: "Aceleração de startups, bolsas de inovação e mentorias para soluções de cidades inteligentes",
        resultado: "Diversificação da base econômica de Nova Lima além da cadeia da mineração",
        progresso: 76,
        status: "No Prazo",
        nota: "Batch vigente com 18 startups selecionadas e incubadas nos polos tecnológicos."
    },

    // --- EIXO 6: MEIO AMBIENTE E PROTEÇÃO ANIMAL ---
    {
        id: 19,
        nome: "Saúde e Bem-Estar Animal (Castração & Microchipagem)",
        secretaria: "Meio Ambiente",
        eixo: "Meio Ambiente e Proteção Animal",
        territorio: "Todo o Município",
        ods: "ODS 15 - Vida Terrestre",
        beneficiarios: 7500,
        orcamento: 2100000,
        produto: "Procedimentos cirúrgicos de esterilização gratuita, aplicação de microchip e vacinação de cães e gatos",
        resultado: "Controle ético da população de animais de rua e combate a zoonoses urbanas",
        progresso: 95,
        status: "Superado",
        nota: "Atendimento itinerante nos distritos de Macacos e Honório Bicalho com 100% de adesão."
    }
];