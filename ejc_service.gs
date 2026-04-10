// ================================================
// EJC_CADASTRAL.GS - FICHA CADASTRAL DO JOVEM (EJC)
// ================================================
// Versão: 1.1.0
// Sistema: EJC - Paróquia Nossa Senhora da Conceição Aparecida
//
// DEPENDÊNCIAS:
//   - config.gs      (ODOO_MODELS, log)
//   - odoo_service.gs (odooSearchRead, odooCreate)
//   - google_drive_service.gs (salvarImagemNoDrive, salvarFotoAntecipada, renomearFotoCasal)
//   - atualizacao_cadastral.gs (buscarComunidades, prepararMany2many, converterParaInteiros)
//
// MODELO ODOO: x_ficha_jovem
// ================================================


/**
 * Valida dados obrigatórios do formulário EJC
 */
function validarFormularioEJC(formData) {
  var erros = [];
  if (!formData.nome?.trim())             erros.push('Nome é obrigatório');
  if (!formData.data_nascimento)          erros.push('Data de nascimento é obrigatória');
  if (!formData.telefone?.trim())         erros.push('Telefone é obrigatório');
  if (!formData.rua?.trim())              erros.push('Endereço é obrigatório');
  if (!formData.numero?.trim())           erros.push('Número é obrigatório');
  if (!formData.bairro?.trim())           erros.push('Bairro é obrigatório');
  return { valido: erros.length === 0, erros: erros };
}


/**
 * Cria uma nova ficha cadastral de jovem (EJC)
 */
function criarFichaCadastralEJC(formData) {
  try {
    log('📝 [EJC] Iniciando criação de ficha cadastral do jovem...');

    var validacao = validarFormularioEJC(formData);
    if (!validacao.valido) {
      log('❌ [EJC] Validação falhou', 'error', { erros: validacao.erros });
      throw new Error('Erros de validação:\n' + validacao.erros.join('\n'));
    }

    var nomeJovem = (formData.nome_usual || formData.nome || '').trim();
    log('👤 [EJC] Jovem: ' + nomeJovem);

    var recordData = {
      x_name: formData.nome.trim(),

      // Dados pessoais
      x_studio_jovem_nome:             formData.nome.trim(),
      x_studio_jovem_nome_usual:       formData.nome_usual?.trim() || '',
      x_studio_jovem_data_nascimento:  formData.data_nascimento || false,
      x_studio_jovem_telefone:         formData.telefone?.trim() || '',
      x_studio_jovem_profissao:        formData.profissao?.trim() || '',

      // Dados dos pais
      x_studio_jovel_nome_pai:         formData.nome_pai?.trim() || '',
      x_studio_jovem_telefone_pai:     formData.telefone_pai?.trim() || '',
      x_studio_jovem_nome_mae:         formData.nome_mae?.trim() || '',
      x_studio_jovem_telefone_mae:     formData.telefone_mae?.trim() || '',

      // Sacramentos
      x_studio_batizado:               Boolean(formData.batizado),
      x_studio_primeira_eucaristia:    Boolean(formData.primeira_eucaristia),
      x_studio_crismado:               Boolean(formData.crismado),

      // Endereço
      x_studio_endereco:               formData.rua.trim(),
      x_studio_numero:                 formData.numero.trim(),
      x_studio_bairro:                 formData.bairro.trim(),
      x_studio_referencia:             formData.referencia?.trim() || ''
    };

    // Pais católicos
    if (formData.pais_catolicos !== null && formData.pais_catolicos !== undefined) {
      recordData.x_studio_pais_catolicos = Boolean(formData.pais_catolicos);
    }

    // Pais fizeram ECC
    if (formData.pais_fizeram_ecc !== null && formData.pais_fizeram_ecc !== undefined) {
      recordData.x_studio_pais_fizeram_ecc = Boolean(formData.pais_fizeram_ecc);
    }

    // Comunidade (Many2one)
    var comunidadeId = formData.comunidade || formData.comunidade_id;
    if (comunidadeId) {
      recordData.x_studio_comunidade = parseInt(comunidadeId);
    }

    // Geolocalização
    if (formData.latitude && formData.longitude) {
      recordData.x_studio_latitude = parseFloat(formData.latitude);
      recordData.x_studio_longitude = parseFloat(formData.longitude);
      log('📍 [EJC] Localização: ' + formData.latitude + ', ' + formData.longitude);
    }

    // Habilidades (Many2many)
    var habilidadesData = prepararMany2many(formData.habilidades);
    if (habilidadesData) {
      recordData.x_studio_habilidades = habilidadesData;
      log('🎯 [EJC] Habilidades: ' + formData.habilidades.length + ' itens');
    }

    // Pastoral (Many2many)
    var pastoraisData = prepararMany2many(formData.pastoral);
    if (pastoraisData) {
      recordData.x_studio_pastoral = pastoraisData;
      log('🙏 [EJC] Pastorais: ' + formData.pastoral.length + ' itens');
    }

    // ========== FOTO ==========
    var urlFoto = '';
    var fotoFileId = '';
    var pastaIdEJC = PropertiesService.getScriptProperties().getProperty('DRIVE_PASTA_ID_EJC');

    if (formData.url_foto && formData.foto_file_id) {
      urlFoto = formData.url_foto;
      fotoFileId = formData.foto_file_id;
      recordData.x_studio_url_foto = urlFoto;
      log('📷 [EJC] Foto pré-enviada: ' + fotoFileId);

    } else if (formData.imagem_base64) {
      try {
        log('📷 [EJC] Salvando foto no Drive (fallback)...');
        var resultadoDrive = salvarImagemNoDrive(formData.imagem_base64, nomeJovem, pastaIdEJC);
        if (resultadoDrive.success) {
          urlFoto = resultadoDrive.url;
          fotoFileId = resultadoDrive.fileId;
          recordData.x_studio_url_foto = urlFoto;
          log('✅ [EJC] Foto salva: ' + fotoFileId);
        } else {
          log('⚠️ [EJC] Erro ao salvar foto, continuando sem foto', 'warn', resultadoDrive);
        }
      } catch (driveError) {
        log('⚠️ [EJC] Erro Drive: ' + driveError.toString() + ' - Continuando sem foto', 'warn');
      }
    }

    // ========== CRIAR REGISTRO NO ODOO ==========
    var MODELO_EJC = 'x_ficha_jovem';

    log('➕ [EJC] Criando registro: ' + MODELO_EJC);
    log('📊 [EJC] Dados: ' + JSON.stringify(recordData));

    var recordId;
    try {
      recordId = odooCreate(MODELO_EJC, recordData);
    } catch (odooError) {
      if (fotoFileId) {
        log('🚨 [EJC] FOTO ÓRFÃ NO DRIVE! Registro falhou mas foto já salva.', 'error', {
          fileId: fotoFileId, url: urlFoto, jovem: nomeJovem, erroOdoo: odooError.toString()
        });
      }
      throw odooError;
    }

    log('✅ [EJC] Registro criado com ID: ' + recordId);

    // Renomear foto (fluxo antecipado)
    if (formData.url_foto && formData.foto_file_id) {
      try {
        renomearFotoCasal(formData.foto_file_id, nomeJovem);
      } catch (renameError) {
        log('⚠️ [EJC] Erro ao renomear foto (não crítico): ' + renameError.toString(), 'warn');
      }
    }

    return {
      success: true,
      id: recordId,
      message: 'Ficha cadastral enviada com sucesso!',
      jovem: nomeJovem,
      urlFoto: urlFoto,
      fotoFileId: fotoFileId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    log('❌ [EJC] Erro ao criar ficha: ' + error.toString(), 'error', { stack: error.stack || '' });
    return {
      success: false,
      message: 'Erro ao salvar ficha: ' + error.message,
      error: error.toString()
    };
  }
}

/**
 * Busca habilidades filtradas pelo grupo EJC Aparecida
 */
function buscarHabilidadesEJC() {
  try {
    log('🎯 [EJC] Buscando habilidades do grupo EJC Aparecida...');
    var habilidades = odooSearchRead(
      'x_habilidades',
      ['id', 'x_name', 'display_name'],
      [['x_studio_company_id.name', '=', 'EJC Aparecida']],
      { order: 'x_name asc' }
    );
    log('✅ [EJC] Habilidades encontradas: ' + (habilidades ? habilidades.length : 0));
    return habilidades || [];
  } catch (error) {
    log('❌ [EJC] Erro ao buscar habilidades: ' + error.toString(), 'error');
    return [];
  }
}

/**
 * Busca todas as pastorais
 * Tenta modelo principal e alternativo (singular/plural)
 * @returns {Array} Lista de pastorais
 */
function buscarPastoraisEJC() {
  try {
    log('🎯 [EJC] Buscando pastorais do grupo EJC Aparecida...');
    var pastorais = odooSearchRead(
      'x_pastoral',
      ['id', 'x_name', 'display_name'],
      [['x_studio_company_id.name', '=', 'EJC Aparecida']],
      { order: 'x_name asc' }
    );
    log('✅ [EJC] Pastorais encontradas: ' + (pastorais ? pastorais.length : 0));
    return pastorais || [];
  } catch (error) {
    log('❌ [EJC] Erro ao buscar pastorais: ' + error.toString(), 'error');
    return [];
  }

}


/**
 * Salva foto antecipada na pasta do EJC
 */
function salvarFotoAntecipadaEJC(base64Data) {
  var nomeTemp = 'temp_ejc_' + new Date().getTime();
  log('📷 [EJC] Upload antecipado de foto (nome temporário: ' + nomeTemp + ')');
  var pastaId = PropertiesService.getScriptProperties().getProperty('DRIVE_PASTA_ID_EJC');
  return salvarImagemNoDrive(base64Data, nomeTemp, pastaId);
}