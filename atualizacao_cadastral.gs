// ================================================
// ATUALIZACAO_CADASTRAL.GS - LÓGICA DE ATUALIZAÇÃO CADASTRAL
// ================================================
// Versão: 3.0.0
//
// DEPENDÊNCIAS:
//   - config.gs      (ODOO_MODELS, getAppConfig)
//   - odoo_service.gs (odooSearchRead, odooCreate)
//   - google_drive_service.gs (salvarImagemNoDrive)
//
// MODELOS ODOO UTILIZADOS:
//   - x_ficha_cadastral  → Fichas cadastrais de casais
//   - x_comunidade       → Comunidades paroquiais
//   - x_habilidades      → Habilidades dos membros
//   - x_pastorais        → Pastorais/atuação pastoral
// ================================================


/**
 * Busca todas as comunidades
 * @returns {Array} Lista de comunidades [{id, x_name, display_name}]
 */
function buscarComunidades() {
  try {
    Logger.log('⛪ Buscando comunidades...');

    const comunidades = odooSearchRead(
      ODOO_MODELS.COMUNIDADE,
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );

    Logger.log(`✅ Comunidades encontradas: ${comunidades.length}`);
    return comunidades;

  } catch (error) {
    Logger.log(`❌ Erro ao buscar comunidades: ${error.toString()}`);
    return [];
  }
}

/**
 * Busca todas as habilidades
 * Tenta modelo principal e alternativo (singular/plural)
 * @returns {Array} Lista de habilidades
 */
function buscarHabilidades() {
  try {
    Logger.log('🎯 Buscando habilidades...');

    // Tentar modelo principal (plural)
    let habilidades = odooSearchRead(
      ODOO_MODELS.HABILIDADES,
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );

    // Fallback para modelo alternativo (singular)
    if (!habilidades || habilidades.length === 0) {
      Logger.log('⚠️ Tentando modelo alternativo: ' + ODOO_MODELS.HABILIDADES_ALT);
      habilidades = odooSearchRead(
        ODOO_MODELS.HABILIDADES_ALT,
        ['id', 'x_name', 'display_name'],
        [],
        { order: 'x_name asc' }
      );
    }

    Logger.log(`✅ Habilidades encontradas: ${habilidades?.length || 0}`);
    return habilidades || [];

  } catch (error) {
    Logger.log(`❌ Erro ao buscar habilidades: ${error.toString()}`);
    return [];
  }
}

/**
 * Busca todas as pastorais
 * Tenta modelo principal e alternativo (singular/plural)
 * @returns {Array} Lista de pastorais
 */
function buscarPastorais() {
  try {
    Logger.log('🙏 Buscando pastorais...');

    let pastorais = odooSearchRead(
      ODOO_MODELS.PASTORAIS,
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );

    // Fallback para modelo alternativo (singular)
    if (!pastorais || pastorais.length === 0) {
      Logger.log('⚠️ Tentando modelo alternativo: ' + ODOO_MODELS.PASTORAIS_ALT);
      pastorais = odooSearchRead(
        ODOO_MODELS.PASTORAIS_ALT,
        ['id', 'x_name', 'display_name'],
        [],
        { order: 'x_name asc' }
      );
    }

    Logger.log(`✅ Pastorais encontradas: ${pastorais?.length || 0}`);
    return pastorais || [];

  } catch (error) {
    Logger.log(`❌ Erro ao buscar pastorais: ${error.toString()}`);
    return [];
  }
}

// ================================================
// VALIDAÇÃO E UTILITÁRIOS
// ================================================

/**
 * Valida dados obrigatórios do formulário
 * @param {Object} formData - Dados do formulário
 * @returns {Object} { valido: boolean, erros: string[] }
 */
function validarFormulario(formData) {
  const erros = [];

  if (!formData.marido_nome?.trim()) erros.push('Nome do marido é obrigatório');
  if (!formData.marido_data_nascimento) erros.push('Data de nascimento do marido é obrigatória');
  if (!formData.esposa_nome?.trim()) erros.push('Nome da esposa é obrigatório');
  if (!formData.esposa_data_nascimento) erros.push('Data de nascimento da esposa é obrigatória');
  if (!formData.rua?.trim()) erros.push('Rua é obrigatória');
  if (!formData.numero?.trim()) erros.push('Número é obrigatório');
  if (!formData.bairro?.trim()) erros.push('Bairro é obrigatório');

  return { valido: erros.length === 0, erros };
}

/**
 * Gera nome do casal no formato "Marido & Esposa"
 * @param {Object} formData - Dados do formulário
 * @returns {string} Nome formatado do casal
 */
function gerarNomeCasal(formData) {
  const nomeMarido = (formData.marido_nome_usual || formData.marido_nome || '').trim().split(' ')[0];
  const nomeEsposa = (formData.esposa_nome_usual || formData.esposa_nome || '').trim().split(' ')[0];
  return `${nomeMarido} & ${nomeEsposa}`;
}

/**
 * Converte array de strings para array de inteiros válidos
 * @param {Array} arr - Array de strings com IDs
 * @returns {Array<number>} Array de inteiros
 */
function converterParaInteiros(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(id => parseInt(id))
    .filter(id => !isNaN(id) && id > 0);
}

/**
 * Prepara dados de relação Many2many para o Odoo
 * @param {Array} ids - Array de IDs
 * @returns {Array|null} Comando Odoo Many2many ou null
 */
function prepararMany2many(ids) {
  if (!ids || ids.length === 0) return null;
  const idsInteiros = converterParaInteiros(ids);
  return idsInteiros.length > 0 ? [[6, 0, idsInteiros]] : null;
}

// ================================================
// OPERAÇÕES CRUD
// ================================================

/**
 * Cria uma nova atualização cadastral
 * @param {Object} formData - Dados do formulário completo
 * @returns {Object} Resultado { success, id, message, casal, urlFoto, timestamp }
 */
function criarAtualizacaoCadastral(formData) {
  try {
    Logger.log('📝 Iniciando criação de atualização cadastral...');

    // Validar formulário
    const validacao = validarFormulario(formData);
    if (!validacao.valido) {
      Logger.log(`❌ Validação falhou: ${validacao.erros.join(', ')}`);
      throw new Error(`Erros de validação:\n${validacao.erros.join('\n')}`);
    }

    const nomeCasal = gerarNomeCasal(formData);
    Logger.log(`👥 Casal: ${nomeCasal}`);

    // Montar dados para o Odoo
    const recordData = {
      x_name: nomeCasal,

      // ========== DADOS DO MARIDO ==========
      x_studio_marido_nome: formData.marido_nome.trim(),
      x_studio_marido_nome_usual: formData.marido_nome_usual?.trim() || '',
      x_studio_marido_data_nascimento: formData.marido_data_nascimento,
      x_studio_marido_telefone: formData.marido_telefone?.trim() || '',
      x_studio_marido_batizado: Boolean(formData.marido_batizado),
      x_studio_marido_primeira_eucaristia: Boolean(formData.marido_primeira_eucaristia),
      x_studio_marido_crismado: Boolean(formData.marido_crismado),

      // ========== DADOS DA ESPOSA ==========
      x_studio_esposa_nome: formData.esposa_nome.trim(),
      x_studio_esposa_nome_usual: formData.esposa_nome_usual?.trim() || '',
      x_studio_esposa_data_nascimento: formData.esposa_data_nascimento,
      x_studio_esposa_telefone: formData.esposa_telefone?.trim() || '',
      x_studio_esposa_batizado: Boolean(formData.esposa_batizado),
      x_studio_esposa_primeira_eucaristia: Boolean(formData.esposa_primeira_eucaristia),
      x_studio_esposa_crismado: Boolean(formData.esposa_crismado),

      // ========== CASAMENTO ==========
      x_studio_casamento_religioso: Boolean(formData.casamento_religioso),
      x_studio_data_casamento: formData.data_casamento || false,

      // ========== ENDEREÇO ==========
      x_studio_rua: formData.rua.trim(),
      x_studio_numero: formData.numero.trim(),
      x_studio_bairro: formData.bairro.trim(),
      x_studio_referencia: formData.referencia?.trim() || '',

      // ========== SEÇÃO ECC ==========
      x_studio_fez_etapa_2: Boolean(formData.fez_etapa_2),
      x_studio_fez_etapa_3: Boolean(formData.fez_etapa_3),
      x_studio_encontro_2_etapa: formData.encontro_2_etapa?.trim() || '',
      x_studio_encontro_3_etapa: formData.encontro_3_etapa?.trim() || ''
    };

    // Comunidade (Many2one)
    const comunidadeId = formData.comunidade || formData.comunidade_id;
    if (comunidadeId) {
       recordData.x_studio_comunidade = parseInt(comunidadeId);
    }

    // Círculo Ativo
    if (formData.circulo_ativo) {
      recordData.x_studio_circulo_ativo = formData.circulo_ativo; // "Sim" ou "Não"
    }

    // Temário
    if (formData.temario) {
      recordData.x_studio_temario = formData.temario.trim();
    }

    // Habilidades (Many2many)
    const habilidadesData = prepararMany2many(formData.habilidades);
    if (habilidadesData) {
      recordData.x_studio_habilidades = habilidadesData;
      Logger.log(`🎯 Habilidades: ${formData.habilidades.length} itens`);
    }

    // Atuação Pastoral (Many2many)
    const pastoraisData = prepararMany2many(formData.atuacao_pastoral);
    if (pastoraisData) {
      recordData.x_studio_atuacao_pastoral = pastoraisData;
      Logger.log(`🙏 Pastorais: ${formData.atuacao_pastoral.length} itens`);
    }

    // Foto do Casal (Google Drive)
    let urlFoto = '';
    if (formData.imagem_base64) {
      try {
        Logger.log('📷 Salvando foto no Google Drive...');
        const resultadoDrive = salvarImagemNoDrive(formData.imagem_base64, nomeCasal);

        if (resultadoDrive.success) {
          urlFoto = resultadoDrive.url;
          recordData.x_studio_url_foto = urlFoto;
          Logger.log(`✅ Foto salva: ${urlFoto} (${(resultadoDrive.size / 1024).toFixed(2)} KB)`);
        } else {
          Logger.log('⚠️ Erro ao salvar foto, continuando sem foto');
        }
      } catch (driveError) {
        Logger.log(`⚠️ Erro Drive: ${driveError.toString()} - Continuando sem foto`);
      }
    }

    // Criar registro no Odoo
    const recordId = odooCreate(ODOO_MODELS.FICHA_CADASTRAL, recordData);
    Logger.log(`✅ Ficha cadastral criada com ID: ${recordId}`);

    return {
      success: true,
      id: recordId,
      message: 'Ficha cadastral enviada com sucesso!',
      casal: nomeCasal,
      urlFoto: urlFoto,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    Logger.log(`❌ Erro ao criar atualização: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    return {
      success: false,
      message: `Erro ao salvar ficha: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Busca atualizações cadastrais de um casal específico
 * @param {string} nomeCasal - Nome do casal
 * @returns {Array} Lista de atualizações
 */
function buscarAtualizacoesCasal(nomeCasal) {
  try {
    if (!nomeCasal?.trim()) {
      throw new Error('Nome do casal não pode estar vazio');
    }

    Logger.log(`🔍 Buscando atualizações: ${nomeCasal}`);

    return odooSearchRead(
      ODOO_MODELS.FICHA_CADASTRAL,
      ['id', 'x_name', 'create_date', 'write_date',
       'x_studio_marido_nome', 'x_studio_esposa_nome', 'x_studio_url_foto'],
      [['x_name', 'ilike', nomeCasal.trim()]],
      { order: 'create_date desc' }
    );

  } catch (error) {
    Logger.log(`❌ Erro ao buscar atualizações: ${error.toString()}`);
    throw new Error(`Erro ao buscar atualizações: ${error.message}`);
  }
}

/**
 * Lista atualizações cadastrais recentes
 * @param {number} [limit=50] - Limite de registros (máx: 200)
 * @returns {Array} Lista de atualizações
 */
function listarAtualizacoesRecentes(limit) {
  limit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

  Logger.log(`📋 Listando atualizações recentes (limite: ${limit})`);

  return odooSearchRead(
    ODOO_MODELS.FICHA_CADASTRAL,
    ['id', 'x_name', 'create_date',
     'x_studio_marido_nome', 'x_studio_esposa_nome',
     'x_studio_comunidade', 'x_studio_fez_etapa_2',
     'x_studio_fez_etapa_3', 'x_studio_url_foto'],
    [],
    { order: 'create_date desc', limit: limit }
  );
}

/**
 * Calcula estatísticas de atualizações cadastrais
 * @returns {Object} Estatísticas gerais
 */
function obterEstatisticasAtualizacoes() {
  try {
    Logger.log('📊 Calculando estatísticas...');

    const atualizacoes = odooSearchRead(
      ODOO_MODELS.FICHA_CADASTRAL,
      ['id', 'create_date',
       'x_studio_marido_batizado', 'x_studio_marido_primeira_eucaristia',
       'x_studio_marido_crismado', 'x_studio_esposa_batizado',
       'x_studio_esposa_primeira_eucaristia', 'x_studio_esposa_crismado',
       'x_studio_casamento_religioso', 'x_studio_fez_etapa_2', 'x_studio_fez_etapa_3'],
      [],
      { order: 'create_date desc', limit: 500 }
    );

    const total = atualizacoes.length;
    if (total === 0) return { total: 0 };

    const stats = {
      total,
      casamentoReligioso: atualizacoes.filter(a => a.x_studio_casamento_religioso).length,
      etapa2: atualizacoes.filter(a => a.x_studio_fez_etapa_2).length,
      etapa3: atualizacoes.filter(a => a.x_studio_fez_etapa_3).length
    };

    Logger.log(`✅ Estatísticas: ${JSON.stringify(stats)}`);
    return stats;

  } catch (error) {
    Logger.log(`❌ Erro ao calcular estatísticas: ${error.toString()}`);
    throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
  }
}