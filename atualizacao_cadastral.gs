// ================================================
// ATUALIZACAO_CADASTRAL.GS - LÓGICA DE ATUALIZAÇÃO CADASTRAL
// ================================================
// Versão: 2.2.0 - Com suporte a Google Drive para fotos
// Funções específicas para atualização cadastral de casais
// ================================================


/**
 * Busca todas as comunidades
 * @returns {Array} Lista de comunidades
 */
function buscarComunidades() {
  try {
    Logger.log('⛪ Buscando comunidades...');
    
    const comunidades = odooSearchRead(
      'x_comunidade',
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );
    
    Logger.log(`✅ Comunidades encontradas: ${comunidades.length}`);
    return comunidades || [];
    
  } catch (error) {
    Logger.log(`❌ Erro ao buscar comunidades: ${error.toString()}`);
    return [];
  }
}

/**
 * Busca todas as habilidades
 * Tenta múltiplos nomes de modelo (singular/plural)
 * @returns {Array} Lista de habilidades
 */
function buscarHabilidades() {
  try {
    Logger.log('🎯 Buscando habilidades...');
    
    // Tenta primeiro o modelo plural
    let habilidades = odooSearchRead(
      'x_habilidades',
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );
    
    // Se não encontrar, tenta o singular
    if (!habilidades || habilidades.length === 0) {
      Logger.log('⚠️ Tentando modelo alternativo x_habilidade...');
      habilidades = odooSearchRead(
        'x_habilidade',
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
 * Tenta múltiplos nomes de modelo (singular/plural)
 * @returns {Array} Lista de pastorais
 */
function buscarPastorais() {
  try {
    Logger.log('🙏 Buscando pastorais...');
    
    // Tenta primeiro o modelo singular
    let pastorais = odooSearchRead(
      'x_pastoral',
      ['id', 'x_name', 'display_name'],
      [],
      { order: 'x_name asc' }
    );
    
    // Se não encontrar, tenta o plural
    if (!pastorais || pastorais.length === 0) {
      Logger.log('⚠️ Tentando modelo alternativo x_pastorais...');
      pastorais = odooSearchRead(
        'x_pastorais',
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

/**
 * Valida formato de data (YYYY-MM-DD)
 * @param {string} data - Data a ser validada
 * @returns {boolean} True se válida
 */
function validarData(data) {
  if (!data) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) return false;
  
  const dataObj = new Date(data);
  return dataObj instanceof Date && !isNaN(dataObj);
}

/**
 * Valida formato de telefone brasileiro
 * @param {string} telefone - Telefone a ser validado
 * @returns {boolean} True se válido
 */
function validarTelefone(telefone) {
  if (!telefone) return true; // Opcional
  // Remove caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  // Aceita 10 ou 11 dígitos (com ou sem 9 na frente)
  return numeros.length === 10 || numeros.length === 11;
}

/**
 * Valida campos obrigatórios do formulário
 * @param {Object} formData - Dados do formulário
 * @returns {Object} Resultado da validação
 */
function validarFormulario(formData) {
  const erros = [];
  
  // Campos obrigatórios
  const camposObrigatorios = {
    'marido_nome': 'Nome do marido',
    'marido_data_nascimento': 'Data de nascimento do marido',
    'esposa_nome': 'Nome da esposa',
    'esposa_data_nascimento': 'Data de nascimento da esposa',
    'rua': 'Rua',
    'numero': 'Número',
    'bairro': 'Bairro'
  };
  
  // Validar campos obrigatórios
  for (let campo in camposObrigatorios) {
    if (!formData[campo] || formData[campo].trim() === '') {
      erros.push(`${camposObrigatorios[campo]} é obrigatório`);
    }
  }
  
  // Validar datas
  if (formData.marido_data_nascimento && !validarData(formData.marido_data_nascimento)) {
    erros.push('Data de nascimento do marido inválida');
  }
  
  if (formData.esposa_data_nascimento && !validarData(formData.esposa_data_nascimento)) {
    erros.push('Data de nascimento da esposa inválida');
  }
  
  if (formData.data_casamento && !validarData(formData.data_casamento)) {
    erros.push('Data de casamento inválida');
  }
  
  // Validar telefones
  if (formData.marido_telefone && !validarTelefone(formData.marido_telefone)) {
    erros.push('Telefone do marido inválido');
  }
  
  if (formData.esposa_telefone && !validarTelefone(formData.esposa_telefone)) {
    erros.push('Telefone da esposa inválido');
  }
  
  return {
    valido: erros.length === 0,
    erros: erros
  };
}

/**
 * Gera nome do casal a partir dos nomes completos
 * @param {Object} formData - Dados do formulário
 * @returns {string} Nome do casal
 */
function gerarNomeCasal(formData) {
  const nomeMarido = formData.marido_nome_usual || 
                     formData.marido_nome.split(' ')[0];
  const nomeEsposa = formData.esposa_nome_usual || 
                     formData.esposa_nome.split(' ')[0];
  
  return `${nomeMarido} e ${nomeEsposa}`;
}

/**
 * Converte array de IDs para inteiros de forma segura
 * @param {Array} ids - Array de IDs
 * @returns {Array} Array de inteiros
 */
function converterParaInteiros(ids) {
  if (!Array.isArray(ids)) return [];
  
  return ids
    .map(id => {
      const num = parseInt(id);
      return isNaN(num) ? null : num;
    })
    .filter(id => id !== null);
}

/**
 * Prepara dados de relação Many2many para Odoo
 * @param {Array} ids - Array de IDs
 * @returns {Array} Comando Odoo Many2many
 */
function prepararMany2many(ids) {
  if (!ids || ids.length === 0) return null;
  const idsInteiros = converterParaInteiros(ids);
  return idsInteiros.length > 0 ? [[6, 0, idsInteiros]] : null;
}

/**
 * Cria uma nova atualização cadastral
 * @param {Object} formData - Dados do formulário
 * @returns {Object} Resultado da criação
 */
function criarAtualizacaoCadastral(formData) {
  try {
    Logger.log('📝 Iniciando criação de atualização cadastral...');
    Logger.log(`📋 Dados recebidos: ${JSON.stringify(formData)}`);
    
    // Validar formulário
    const validacao = validarFormulario(formData);
    if (!validacao.valido) {
      Logger.log(`❌ Validação falhou: ${validacao.erros.join(', ')}`);
      throw new Error(`Erros de validação:\n${validacao.erros.join('\n')}`);
    }
    
    // Gerar nome do casal
    const nomeCasal = gerarNomeCasal(formData);
    Logger.log(`👥 Nome do casal gerado: ${nomeCasal}`);

    // Preparar dados para o Odoo
    const recordData = {
      x_name: nomeCasal,
      
      // ========== DADOS DO MARIDO ==========
      x_studio_marido_nome: formData.marido_nome.trim(),
      x_studio_marido_nome_usual: formData.marido_nome_usual?.trim() || '',
      x_studio_marido_data_nascimento: formData.marido_data_nascimento,
      x_studio_marido_telefone: formData.marido_telefone?.trim() || '',
      
      // Sacramentos do Marido (BOOLEAN)
      x_studio_marido_batizado: Boolean(formData.marido_batizado),
      x_studio_marido_primeira_eucaristia: Boolean(formData.marido_primeira_eucaristia),
      x_studio_marido_crismado: Boolean(formData.marido_crismado),
      
      // ========== DADOS DA ESPOSA ==========
      x_studio_esposa_nome: formData.esposa_nome.trim(),
      x_studio_esposa_nome_usual: formData.esposa_nome_usual?.trim() || '',
      x_studio_esposa_data_nascimento: formData.esposa_data_nascimento,
      x_studio_esposa_telefone: formData.esposa_telefone?.trim() || '',
      
      // Sacramentos da Esposa (BOOLEAN)
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
    
    // LOG DETALHADO DOS CAMPOS ECC
    Logger.log('🔵 ========== CAMPOS ECC RECEBIDOS ==========');
    Logger.log(`   fez_etapa_2 (recebido): ${formData.fez_etapa_2} (tipo: ${typeof formData.fez_etapa_2})`);
    Logger.log(`   fez_etapa_2 (processado): ${Boolean(formData.fez_etapa_2)}`);
    Logger.log(`   fez_etapa_3 (recebido): ${formData.fez_etapa_3} (tipo: ${typeof formData.fez_etapa_3})`);
    Logger.log(`   fez_etapa_3 (processado): ${Boolean(formData.fez_etapa_3)}`);
    Logger.log(`   encontro_2_etapa: ${formData.encontro_2_etapa}`);
    Logger.log(`   encontro_3_etapa: ${formData.encontro_3_etapa}`);
    Logger.log(`   circulo_ativo: ${formData.circulo_ativo}`);
    Logger.log(`   temario: ${formData.temario}`);
    Logger.log('============================================');
    
    // ========== CÍRCULO ATIVO (Seleção) ==========
    if (formData.circulo_ativo) {
      recordData.x_studio_circulo_ativo = formData.circulo_ativo;
      Logger.log(`🔄 Círculo Ativo: ${formData.circulo_ativo}`);
    }
    
    // ========== TEMÁRIO (Seleção) ==========
    if (formData.temario) {
      recordData.x_studio_temario = formData.temario;
      Logger.log(`📖 Temário: ${formData.temario}`);
    }
    
    // ========== COMUNIDADE (Many2one) ==========
    if (formData.comunidade_id) {
      const comunidadeId = parseInt(formData.comunidade_id);
      if (!isNaN(comunidadeId)) {
        recordData.x_studio_comunidade = comunidadeId;
        Logger.log(`⛪ Comunidade ID: ${comunidadeId}`);
      }
    }
    
    // ========== HABILIDADES (Many2many) ==========
    const habilidadesData = prepararMany2many(formData.habilidades);
    if (habilidadesData) {
      recordData.x_studio_habilidades = habilidadesData;
      Logger.log(`🎯 Habilidades: ${formData.habilidades.length} itens`);
    }
    
    // ========== ATUAÇÃO PASTORAL (Many2many) ==========
    const pastoraisData = prepararMany2many(formData.atuacao_pastoral);
    if (pastoraisData) {
      recordData.x_studio_atuacao_pastoral = pastoraisData;
      Logger.log(`🙏 Pastorais: ${formData.atuacao_pastoral.length} itens`);
    }
    
    // ========== FOTO DO CASAL (Google Drive) ==========
    let urlFoto = '';
    if (formData.imagem_base64) {
      try {
        Logger.log('📷 Salvando foto no Google Drive...');
        const resultadoDrive = salvarImagemNoDrive(formData.imagem_base64, nomeCasal);
        
        if (resultadoDrive.success) {
          urlFoto = resultadoDrive.url;
          recordData.x_studio_url_foto = urlFoto;
          Logger.log(`✅ Foto salva no Drive: ${urlFoto}`);
          Logger.log(`📊 Tamanho do arquivo: ${(resultadoDrive.size / 1024).toFixed(2)} KB`);
        } else {
          Logger.log('⚠️ Erro ao salvar foto no Drive, continuando sem foto');
        }
      } catch (driveError) {
        Logger.log(`⚠️ Erro ao salvar foto no Drive: ${driveError.toString()}`);
        Logger.log('⚠️ Continuando sem foto...');
      }
    }
    
    // Log final dos dados
    Logger.log('📊 Dados preparados para envio ao Odoo');
    
    // Criar registro no Odoo
    try {
      const recordId = odooCreate('x_ficha_cadastral', recordData);
      Logger.log(`✅ Atualização cadastral criada com sucesso! ID: ${recordId}`);
      
      return {
        success: true,
        id: recordId,
        message: 'Ficha cadastral enviada com sucesso!',
        casal: nomeCasal,
        urlFoto: urlFoto,
        timestamp: new Date().toISOString()
      };
    } catch (odooError) {
      Logger.log(`❌ ERRO AO CRIAR NO ODOO: ${odooError.toString()}`);
      Logger.log(`Stack: ${odooError.stack}`);
      throw new Error(`Erro do Odoo: ${odooError.message}`);
    }
    
  } catch (error) {
    Logger.log(`❌ Erro ao criar atualização cadastral: ${error.toString()}`);
    Logger.log(`Stack trace: ${error.stack}`);
    
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
    Logger.log(`🔍 Buscando atualizações do casal: ${nomeCasal}`);
    
    if (!nomeCasal || nomeCasal.trim() === '') {
      throw new Error('Nome do casal não pode estar vazio');
    }
    
    const atualizacoes = odooSearchRead(
      'x_ficha_cadastral',
      ['id', 'x_name', 'create_date', 'write_date', 
       'x_studio_marido_nome', 'x_studio_esposa_nome', 'x_studio_url_foto'],
      [['x_name', 'ilike', nomeCasal.trim()]],
      { order: 'create_date desc' }
    );
    
    Logger.log(`✅ Atualizações encontradas: ${atualizacoes?.length || 0}`);
    return atualizacoes || [];
    
  } catch (error) {
    Logger.log(`❌ Erro ao buscar atualizações: ${error.toString()}`);
    throw new Error(`Erro ao buscar atualizações: ${error.message}`);
  }
}

/**
 * Lista todas as atualizações cadastrais recentes
 * @param {number} limit - Limite de registros (padrão: 50, máx: 200)
 * @returns {Array} Lista de atualizações
 */
function listarAtualizacoesRecentes(limit) {
  try {
    // Validar e limitar o número de registros
    limit = parseInt(limit) || 50;
    limit = Math.min(Math.max(limit, 1), 200); // Entre 1 e 200
    
    Logger.log(`📋 Listando atualizações recentes (limite: ${limit})`);
    
    const atualizacoes = odooSearchRead(
      'x_ficha_cadastral',
      [
        'id', 
        'x_name', 
        'create_date', 
        'x_studio_marido_nome', 
        'x_studio_esposa_nome',
        'x_studio_comunidade',
        'x_studio_fez_etapa_2',
        'x_studio_fez_etapa_3',
        'x_studio_url_foto'
      ],
      [],
      { order: 'create_date desc', limit: limit }
    );
    
    Logger.log(`✅ Atualizações encontradas: ${atualizacoes?.length || 0}`);
    return atualizacoes || [];
    
  } catch (error) {
    Logger.log(`❌ Erro ao listar atualizações: ${error.toString()}`);
    throw new Error(`Erro ao listar atualizações: ${error.message}`);
  }
}

/**
 * Estatísticas de atualizações cadastrais
 * @returns {Object} Estatísticas gerais
 */
function obterEstatisticasAtualizacoes() {
  try {
    Logger.log('📊 Calculando estatísticas de atualizações...');
    
    const atualizacoes = odooSearchRead(
      'x_ficha_cadastral',
      [
        'id', 
        'create_date', 
        'x_studio_marido_batizado', 
        'x_studio_marido_primeira_eucaristia',
        'x_studio_marido_crismado',
        'x_studio_esposa_batizado',
        'x_studio_esposa_primeira_eucaristia',
        'x_studio_esposa_crismado',
        'x_studio_casamento_religioso',
        'x_studio_fez_etapa_2',
        'x_studio_fez_etapa_3',
        'x_studio_url_foto'
      ],
      []
    );
    
    const total = atualizacoes?.length || 0;
    
    if (total === 0) {
      Logger.log('⚠️ Nenhuma atualização encontrada');
      return {
        total: 0,
        message: 'Nenhuma ficha cadastral encontrada'
      };
    }
    
    // Contadores
    let maridosBatizados = 0;
    let maridosPrimeiraEucaristia = 0;
    let maridosCrismados = 0;
    let esposasBatizadas = 0;
    let esposasPrimeiraEucaristia = 0;
    let esposasCrismadas = 0;
    let casamentosReligiosos = 0;
    let fezEtapa2 = 0;
    let fezEtapa3 = 0;
    let comFoto = 0;
    
    atualizacoes.forEach(at => {
      if (at.x_studio_marido_batizado) maridosBatizados++;
      if (at.x_studio_marido_primeira_eucaristia) maridosPrimeiraEucaristia++;
      if (at.x_studio_marido_crismado) maridosCrismados++;
      if (at.x_studio_esposa_batizado) esposasBatizadas++;
      if (at.x_studio_esposa_primeira_eucaristia) esposasPrimeiraEucaristia++;
      if (at.x_studio_esposa_crismado) esposasCrismadas++;
      if (at.x_studio_casamento_religioso) casamentosReligiosos++;
      if (at.x_studio_fez_etapa_2) fezEtapa2++;
      if (at.x_studio_fez_etapa_3) fezEtapa3++;
      if (at.x_studio_url_foto) comFoto++;
    });
    
    const calcularPercentual = (valor) => {
      return total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0';
    };
    
    const estatisticas = {
      total: total,
      dataAtualizacao: new Date().toISOString(),
      fotos: {
        total: comFoto,
        percentual: calcularPercentual(comFoto)
      },
      casamento: {
        religiosos: casamentosReligiosos,
        percentual: calcularPercentual(casamentosReligiosos)
      },
      maridos: {
        batizados: maridosBatizados,
        primeiraEucaristia: maridosPrimeiraEucaristia,
        crismados: maridosCrismados,
        percentuais: {
          batizados: calcularPercentual(maridosBatizados),
          primeiraEucaristia: calcularPercentual(maridosPrimeiraEucaristia),
          crismados: calcularPercentual(maridosCrismados)
        }
      },
      esposas: {
        batizadas: esposasBatizadas,
        primeiraEucaristia: esposasPrimeiraEucaristia,
        crismadas: esposasCrismadas,
        percentuais: {
          batizadas: calcularPercentual(esposasBatizadas),
          primeiraEucaristia: calcularPercentual(esposasPrimeiraEucaristia),
          crismadas: calcularPercentual(esposasCrismadas)
        }
      },
      ecc: {
        etapa2: fezEtapa2,
        etapa3: fezEtapa3,
        percentuais: {
          etapa2: calcularPercentual(fezEtapa2),
          etapa3: calcularPercentual(fezEtapa3)
        }
      }
    };
    
    Logger.log(`✅ Estatísticas calculadas: ${total} fichas analisadas`);
    return estatisticas;
    
  } catch (error) {
    Logger.log(`❌ Erro ao calcular estatísticas: ${error.toString()}`);
    throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
  }
}

/**
 * Exporta dados para relatório
 * @param {Object} filtros - Filtros opcionais
 * @returns {Array} Dados formatados para exportação
 */
function exportarDadosRelatorio(filtros) {
  try {
    Logger.log('📤 Exportando dados para relatório...');
    
    const campos = [
      'id',
      'x_name',
      'create_date',
      'x_studio_marido_nome',
      'x_studio_esposa_nome',
      'x_studio_marido_batizado',
      'x_studio_marido_crismado',
      'x_studio_esposa_batizado',
      'x_studio_esposa_crismado',
      'x_studio_casamento_religioso',
      'x_studio_comunidade',
      'x_studio_bairro',
      'x_studio_fez_etapa_2',
      'x_studio_fez_etapa_3',
      'x_studio_circulo_ativo',
      'x_studio_temario',
      'x_studio_url_foto'
    ];
    
    const dominio = filtros?.dominio || [];
    
    const registros = odooSearchRead(
      'x_ficha_cadastral',
      campos,
      dominio,
      { order: 'create_date desc' }
    );
    
    Logger.log(`✅ ${registros?.length || 0} registros exportados`);
    return registros || [];
    
  } catch (error) {
    Logger.log(`❌ Erro ao exportar dados: ${error.toString()}`);
    throw new Error(`Erro ao exportar dados: ${error.message}`);
  }
}