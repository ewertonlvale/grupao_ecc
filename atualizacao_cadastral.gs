// ================================================
// ATUALIZACAO_CADASTRAL.GS - LÓGICA DE ATUALIZAÇÃO CADASTRAL
// ================================================
// Versão: 3.2.0
//
// DEPENDÊNCIAS:
//   - config.gs      (ODOO_MODELS, getAppConfig, log)
//   - odoo_service.gs (odooSearchRead, odooCreate)
//   - google_drive_service.gs (salvarImagemNoDrive, salvarFotoAntecipada, renomearFotoCasal)
//
// MODELOS ODOO UTILIZADOS:
//   - x_ficha_cadastral  → Fichas cadastrais de casais
//   - x_comunidade       → Comunidades paroquiais
//   - x_habilidades      → Habilidades dos membros
//   - x_pastorais        → Pastorais/atuação pastoral
//
// MELHORIAS v3.2.0:
//   - Suporte a foto pré-enviada (url_foto + foto_file_id)
//   - Renomeação do arquivo após criação do registro
//   - Compatibilidade com fluxo legado (imagem_base64)
//   - Log unificado (Logger + Console) via log()
//   - Rastreio de foto órfã no Drive quando odooCreate falha
// ================================================


/**
 * Busca todas as comunidades
 * @returns {Array} Lista de comunidades [{id, x_name, display_name}]
 */
function buscarComunidades() {
  try {
    log('⛪ Buscando comunidades...');

    var comunidades = odooSearchRead(
      ODOO_MODELS.COMUNIDADE,
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );

    log('✅ Comunidades encontradas: ' + comunidades.length);
    return comunidades;

  } catch (error) {
    log('❌ Erro ao buscar comunidades: ' + error.toString(), 'error');
    return [];
  }
}

/**
 * Busca todas as habilidades
 * Tenta modelo principal e alternativo (singular/plural)
 * @returns {Array} Lista de habilidades
 */
/**
 * Busca habilidades filtradas pelo grupo ECC Aparecida
 * @returns {Array} Lista de habilidades do ECC
 */
function buscarHabilidades() {
  try {
    log('🎯 Buscando habilidades do grupo ECC Aparecida...');

    var habilidades = odooSearchRead(
      'x_habilidades',
      ['id', 'x_name', 'display_name'],
      [['x_studio_company_id.name', '=', 'ECC Aparecida']],
      { order: 'x_name asc' }
    );

    log('✅ Habilidades encontradas: ' + (habilidades ? habilidades.length : 0));
    return habilidades || [];

  } catch (error) {
    log('❌ Erro ao buscar habilidades: ' + error.toString(), 'error');
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
    log('🙏 Buscando pastorais...');

    var pastorais = odooSearchRead(
      ODOO_MODELS.PASTORAIS,
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );

    // Fallback para modelo alternativo (singular)
    if (!pastorais || pastorais.length === 0) {
      log('⚠️ Tentando modelo alternativo: ' + ODOO_MODELS.PASTORAIS_ALT, 'warn');
      pastorais = odooSearchRead(
        ODOO_MODELS.PASTORAIS_ALT,
        ['id', 'x_name', 'display_name'],
        [],
        { order: 'x_name asc' }
      );
    }

    log('✅ Pastorais encontradas: ' + (pastorais ? pastorais.length : 0));
    return pastorais || [];

  } catch (error) {
    log('❌ Erro ao buscar pastorais: ' + error.toString(), 'error');
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
  var erros = [];

  if (!formData.marido_nome?.trim()) erros.push('Nome do marido é obrigatório');
  if (!formData.marido_data_nascimento) erros.push('Data de nascimento do marido é obrigatória');
  if (!formData.esposa_nome?.trim()) erros.push('Nome da esposa é obrigatório');
  if (!formData.esposa_data_nascimento) erros.push('Data de nascimento da esposa é obrigatória');
  if (!formData.rua?.trim()) erros.push('Rua é obrigatória');
  if (!formData.numero?.trim()) erros.push('Número é obrigatório');
  if (!formData.bairro?.trim()) erros.push('Bairro é obrigatório');

  return { valido: erros.length === 0, erros: erros };
}

/**
 * Gera nome do casal no formato "Marido & Esposa"
 * @param {Object} formData - Dados do formulário
 * @returns {string} Nome formatado do casal
 */
function gerarNomeCasal(formData) {
  var nomeMarido = (formData.marido_nome_usual || formData.marido_nome || '').trim().split(' ')[0];
  var nomeEsposa = (formData.esposa_nome_usual || formData.esposa_nome || '').trim().split(' ')[0];
  return nomeMarido + ' & ' + nomeEsposa;
}

/**
 * Converte array de strings para array de inteiros válidos
 * @param {Array} arr - Array de strings com IDs
 * @returns {Array<number>} Array de inteiros
 */
function converterParaInteiros(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(function(id) { return parseInt(id); })
    .filter(function(id) { return !isNaN(id) && id > 0; });
}

/**
 * Prepara dados de relação Many2many para o Odoo
 * @param {Array} ids - Array de IDs
 * @returns {Array|null} Comando Odoo Many2many ou null
 */
function prepararMany2many(ids) {
  if (!ids || ids.length === 0) return null;
  var idsInteiros = converterParaInteiros(ids);
  return idsInteiros.length > 0 ? [[6, 0, idsInteiros]] : null;
}


// ================================================
// OPERAÇÕES CRUD
// ================================================

/**
 * Cria uma nova atualização cadastral
 * 
 * Suporta dois fluxos de foto:
 *   1) Foto pré-enviada: formData.url_foto + formData.foto_file_id (novo, mais rápido)
 *   2) Foto no submit: formData.imagem_base64 (legado, compatibilidade)
 * 
 * @param {Object} formData - Dados do formulário completo
 * @returns {Object} Resultado { success, id, message, casal, urlFoto, fotoFileId, timestamp }
 */
function criarAtualizacaoCadastral(formData) {
  try {
    log('📝 Iniciando criação de atualização cadastral...');

    // Validar formulário
    var validacao = validarFormulario(formData);
    if (!validacao.valido) {
      log('❌ Validação falhou', 'error', { erros: validacao.erros });
      throw new Error('Erros de validação:\n' + validacao.erros.join('\n'));
    }

    var nomeCasal = gerarNomeCasal(formData);
    log('👥 Casal: ' + nomeCasal);

    // Montar dados para o Odoo
    var recordData = {
      x_name: nomeCasal,

      // ========== DADOS DO MARIDO ==========
      x_studio_marido_nome: formData.marido_nome.trim(),
      x_studio_marido_nome_usual: formData.marido_nome_usual?.trim() || '',
      x_studio_marido_data_nascimento: formData.marido_data_nascimento && /^\d{4}-\d{2}-\d{2}$/.test(formData.marido_data_nascimento) ? formData.marido_data_nascimento : false,
      x_studio_marido_telefone: formData.marido_telefone?.trim() || '',
      x_studio_marido_batizado: Boolean(formData.marido_batizado),
      x_studio_marido_primeira_eucaristia: Boolean(formData.marido_primeira_eucaristia),
      x_studio_marido_crismado: Boolean(formData.marido_crismado),

      // ========== DADOS DA ESPOSA ==========
      x_studio_esposa_nome: formData.esposa_nome.trim(),
      x_studio_esposa_nome_usual: formData.esposa_nome_usual?.trim() || '',
      x_studio_esposa_data_nascimento: formData.esposa_data_nascimento && /^\d{4}-\d{2}-\d{2}$/.test(formData.esposa_data_nascimento) ? formData.esposa_data_nascimento : false,
      x_studio_esposa_telefone: formData.esposa_telefone?.trim() || '',
      x_studio_esposa_batizado: Boolean(formData.esposa_batizado),
      x_studio_esposa_primeira_eucaristia: Boolean(formData.esposa_primeira_eucaristia),
      x_studio_esposa_crismado: Boolean(formData.esposa_crismado),

      // ========== CASAMENTO ==========
      x_studio_casamento_religioso: Boolean(formData.casamento_religioso),
      x_studio_data_casamento: formData.data_casamento && /^\d{4}-\d{2}-\d{2}$/.test(formData.data_casamento) && formData.data_casamento !== '0000-00-00' ? formData.data_casamento : false,

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
    var comunidadeId = formData.comunidade || formData.comunidade_id;
    if (comunidadeId) {
      recordData.x_studio_comunidade = parseInt(comunidadeId);
    }

    // Círculo Ativo
    if (formData.circulo_ativo) {
      recordData.x_studio_circulo_ativo = formData.circulo_ativo;
    }

    // Temário
    if (formData.temario) {
      recordData.x_studio_temario = formData.temario.trim();
    }

    // Habilidades (Many2many)
    var habilidadesData = prepararMany2many(formData.habilidades);
    if (habilidadesData) {
      recordData.x_studio_habilidades = habilidadesData;
      log('🎯 Habilidades: ' + formData.habilidades.length + ' itens');
    }

    // Atuação Pastoral (Many2many)
    var pastoraisData = prepararMany2many(formData.atuacao_pastoral);
    if (pastoraisData) {
      recordData.x_studio_atuacao_pastoral = pastoraisData;
      log('🙏 Pastorais: ' + formData.atuacao_pastoral.length + ' itens');
    }

    // ========== FOTO DO CASAL ==========
    var urlFoto = '';
    var fotoFileId = '';
    var fotoInfo = null;

    if (formData.url_foto && formData.foto_file_id) {
      // ---- FLUXO NOVO: Foto já foi enviada antecipadamente ----
      urlFoto = formData.url_foto;
      fotoFileId = formData.foto_file_id;
      recordData.x_studio_url_foto = urlFoto;

      log('📷 Foto pré-enviada detectada', 'info', {
        fileId: fotoFileId,
        url: urlFoto
      });

    } else if (formData.imagem_base64) {
      // ---- FLUXO LEGADO: Upload no momento do submit ----
      try {
        log('📷 Salvando foto no Google Drive (fluxo legado)...');
        var resultadoDrive = salvarImagemNoDrive(formData.imagem_base64, nomeCasal);
        fotoInfo = resultadoDrive;

        if (resultadoDrive.success) {
          urlFoto = resultadoDrive.url;
          fotoFileId = resultadoDrive.fileId;
          recordData.x_studio_url_foto = urlFoto;
          log('✅ Foto salva com sucesso', 'info', {
            fileId: fotoFileId,
            url: urlFoto,
            tamanhoKB: (resultadoDrive.size / 1024).toFixed(2),
            compartilhado: resultadoDrive.compartilhado
          });
        } else {
          log('⚠️ Erro ao salvar foto, continuando sem foto', 'warn', resultadoDrive);
        }
      } catch (driveError) {
        log('⚠️ Erro Drive: ' + driveError.toString() + ' - Continuando sem foto', 'warn', {
          erro: driveError.toString(),
          stack: driveError.stack || ''
        });
      }
    }

    // ========== CRIAR REGISTRO NO ODOO ==========
    log('➕ Criando registro: x_ficha_cadastral');
    log('📊 Dados: ' + JSON.stringify(recordData));

    var recordId;
    try {
      recordId = odooCreate(ODOO_MODELS.FICHA_CADASTRAL, recordData);
    } catch (odooError) {
      // Se tinha foto salva (em qualquer fluxo), alertar foto órfã
      var fotoOrfaId = fotoFileId || (fotoInfo && fotoInfo.fileId) || '';
      if (fotoOrfaId) {
        log('🚨 FOTO ÓRFÃ NO DRIVE! O registro Odoo falhou mas a foto já foi salva.', 'error', {
          fileId: fotoOrfaId,
          url: urlFoto,
          casal: nomeCasal,
          erroOdoo: odooError.toString()
        });
      }
      throw odooError;
    }

    log('✅ Registro criado com ID: ' + recordId);

    // ========== RENOMEAR FOTO (fluxo antecipado) ==========
    if (formData.url_foto && formData.foto_file_id) {
      try {
        renomearFotoCasal(formData.foto_file_id, nomeCasal);
      } catch (renameError) {
        log('⚠️ Erro ao renomear foto (não crítico): ' + renameError.toString(), 'warn');
      }
    }

    log('✅ Ficha cadastral criada com ID: ' + recordId, 'info', {
      recordId: recordId,
      casal: nomeCasal,
      fotoFileId: fotoFileId,
      fotoUrl: urlFoto || 'sem foto'
    });

    return {
      success: true,
      id: recordId,
      message: 'Ficha cadastral enviada com sucesso!',
      casal: nomeCasal,
      urlFoto: urlFoto,
      fotoFileId: fotoFileId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    log('❌ Erro ao criar atualização: ' + error.toString(), 'error', {
      stack: error.stack || ''
    });
    return {
      success: false,
      message: 'Erro ao salvar ficha: ' + error.message,
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

    log('🔍 Buscando atualizações: ' + nomeCasal);

    return odooSearchRead(
      ODOO_MODELS.FICHA_CADASTRAL,
      ['id', 'x_name', 'create_date', 'write_date',
       'x_studio_marido_nome', 'x_studio_esposa_nome', 'x_studio_url_foto'],
      [['x_name', 'ilike', nomeCasal.trim()]],
      { order: 'create_date desc' }
    );

  } catch (error) {
    log('❌ Erro ao buscar atualizações: ' + error.toString(), 'error');
    throw new Error('Erro ao buscar atualizações: ' + error.message);
  }
}

/**
 * Lista atualizações cadastrais recentes
 * @param {number} [limit=50] - Limite de registros (máx: 200)
 * @returns {Array} Lista de atualizações
 */
function listarAtualizacoesRecentes(limit) {
  limit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  log('📋 Listando atualizações recentes (limite: ' + limit + ')');

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
    log('📊 Calculando estatísticas...');

    var atualizacoes = odooSearchRead(
      ODOO_MODELS.FICHA_CADASTRAL,
      ['id', 'create_date',
       'x_studio_marido_batizado', 'x_studio_marido_primeira_eucaristia',
       'x_studio_marido_crismado', 'x_studio_esposa_batizado',
       'x_studio_esposa_primeira_eucaristia', 'x_studio_esposa_crismado',
       'x_studio_casamento_religioso', 'x_studio_fez_etapa_2', 'x_studio_fez_etapa_3'],
      [],
      { order: 'create_date desc', limit: 500 }
    );

    var total = atualizacoes.length;
    if (total === 0) return { total: 0 };

    var stats = {
      total: total,
      casamentoReligioso: atualizacoes.filter(function(a) { return a.x_studio_casamento_religioso; }).length,
      etapa2: atualizacoes.filter(function(a) { return a.x_studio_fez_etapa_2; }).length,
      etapa3: atualizacoes.filter(function(a) { return a.x_studio_fez_etapa_3; }).length
    };

    log('✅ Estatísticas calculadas', 'info', stats);
    return stats;

  } catch (error) {
    log('❌ Erro ao calcular estatísticas: ' + error.toString(), 'error');
    throw new Error('Erro ao calcular estatísticas: ' + error.message);
  }
}