// ================================================
// AVALIACAO_GRUPAO.GS - LÓGICA DE AVALIAÇÃO DO GRUPÃO
// ================================================
// Versão: 3.0.0
//
// DEPENDÊNCIAS:
//   - config.gs      (ODOO_MODELS)
//   - odoo_service.gs (odooSearchRead, odooCreate)
//
// REGRAS DE NEGÓCIO:
//   - Avaliação permitida até 10 dias após o grupão
//   - Nota de 1 a 5 (obrigatória)
//   - Observação opcional (máx 1000 caracteres)
//   - Exibe informações do próximo grupão quando disponível
// ================================================

const PRAZO_AVALIACAO_DIAS = 10;

/**
 * Calcula a diferença em dias entre duas datas (valor absoluto)
 * @param {Date} data1
 * @param {Date} data2
 * @returns {number} Diferença em dias
 */
function calcularDiferencaDias(data1, data2) {
  const umDia = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(data2 - data1) / umDia);
}

/**
 * Busca o grupão mais recente com validação de período
 * @returns {Object} { grupaoAtual, podeAvaliar, proximoGrupao }
 */
function buscarGrupaoComValidacao() {
  try {
    const hoje = new Date();
    const dataHoje = Utilities.formatDate(hoje, 'GMT-3', 'yyyy-MM-dd');

    Logger.log('📅 Buscando grupão ativo até: ' + dataHoje);

    // Buscar grupão mais recente até hoje
    const result = odooSearchRead(
      ODOO_MODELS.GRUPAO,
      ['id', 'x_name', 'x_studio_data'],
      [['x_studio_data', '<=', dataHoje]],
      { order: 'x_studio_data desc', limit: 1 }
    );

    let grupaoAtual = null;
    let podeAvaliar = false;

    if (result && result.length > 0) {
      grupaoAtual = result[0];
      Logger.log('✅ Grupão encontrado: ' + grupaoAtual.x_name);

      // Validar prazo de avaliação
      const dataGrupao = new Date(grupaoAtual.x_studio_data);
      const diferencaDias = calcularDiferencaDias(dataGrupao, hoje);

      Logger.log(`📊 Diferença: ${diferencaDias} dias (prazo: ${PRAZO_AVALIACAO_DIAS})`);

      podeAvaliar = diferencaDias <= PRAZO_AVALIACAO_DIAS;
      Logger.log(podeAvaliar ? '✅ Dentro do prazo' : '⏰ Fora do prazo');
    } else {
      Logger.log('⚠️ Nenhum grupão ativo encontrado');
    }

    // Buscar próximo grupão
    const proximoGrupao = buscarProximoGrupao();

    return { grupaoAtual, podeAvaliar, proximoGrupao };

  } catch (error) {
    Logger.log('❌ Erro ao buscar grupão: ' + error.toString());
    throw new Error('Erro ao buscar grupão: ' + error.message);
  }
}

/**
 * Busca o grupão mais recente (compatibilidade)
 * @returns {Object|null} Dados do grupão
 */
function buscarGrupao() {
  try {
    const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd');

    const result = odooSearchRead(
      ODOO_MODELS.GRUPAO,
      ['id', 'x_name', 'x_studio_data'],
      [['x_studio_data', '<=', hoje]],
      { order: 'x_studio_data desc', limit: 1 }
    );

    return (result && result.length > 0) ? result[0] : null;

  } catch (error) {
    Logger.log('❌ Erro ao buscar grupão: ' + error.toString());
    throw new Error('Erro ao buscar grupão: ' + error.message);
  }
}

/**
 * Busca o próximo grupão (data futura mais recente)
 * @returns {Object|null} Dados do próximo grupão
 */
function buscarProximoGrupao() {
  try {
    const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd');

    Logger.log('🔮 Buscando próximo grupão após: ' + hoje);

    const result = odooSearchRead(
      ODOO_MODELS.GRUPAO,
      ['id', 'x_name', 'x_studio_data', 'x_studio_local'],
      [['x_studio_data', '>', hoje]],
      { order: 'x_studio_data asc', limit: 1 }
    );

    if (result && result.length > 0) {
      Logger.log('✅ Próximo: ' + result[0].x_name + ' em ' + result[0].x_studio_data);
      return result[0];
    }

    Logger.log('⚠️ Nenhum próximo grupão encontrado');
    return null;

  } catch (error) {
    Logger.log('❌ Erro ao buscar próximo grupão: ' + error.toString());
    return null;
  }
}

/**
 * Cria uma nova avaliação de grupão
 * @param {Object} formData - { grupao_id, avaliacao, observacao, nome_casal }
 * @returns {Object} Resultado { success, id, message, grupao, nota }
 */
function criarAvaliacaoGrupao(formData) {
  try {
    Logger.log('📝 Criando avaliação de grupão...');

    // Validações
    if (!formData.grupao_id) throw new Error('ID do grupão é obrigatório');
    if (!formData.avaliacao) throw new Error('Avaliação é obrigatória');

    const nota = parseInt(formData.avaliacao);
    if (isNaN(nota) || nota < 1 || nota > 5) {
      throw new Error('Avaliação deve ser entre 1 e 5');
    }

    // Verificar se o grupão existe e está no prazo
    const grupao = odooSearchRead(
      ODOO_MODELS.GRUPAO,
      ['id', 'x_name', 'x_studio_data'],
      [['id', '=', parseInt(formData.grupao_id)]],
      { limit: 1 }
    );

    if (!grupao || grupao.length === 0) {
      throw new Error('Grupão não encontrado');
    }

    const dataGrupao = new Date(grupao[0].x_studio_data);
    const diferencaDias = calcularDiferencaDias(dataGrupao, new Date());

    if (diferencaDias > PRAZO_AVALIACAO_DIAS) {
      throw new Error(`Prazo expirado (máximo ${PRAZO_AVALIACAO_DIAS} dias)`);
    }

    // Criar registro
    const recordData = {
      x_studio_grupao: parseInt(formData.grupao_id),
      x_studio_avaliacao: nota.toString(),
      x_studio_observacao: formData.observacao || '',
      x_name: formData.nome_casal || 'Avaliação Anônima',
      x_studio_data_hora_avaliacao: Utilities.formatDate(
        new Date(), 'GMT-3', 'yyyy-MM-dd HH:mm:ss'
      )
    };

    const recordId = odooCreate(ODOO_MODELS.AVALIACAO_GRUPAO, recordData);
    Logger.log('✅ Avaliação criada com ID: ' + recordId);

    return {
      success: true,
      id: recordId,
      message: 'Avaliação enviada com sucesso!',
      grupao: formData.grupao_id,
      nota: nota
    };

  } catch (error) {
    Logger.log('❌ Erro ao criar avaliação: ' + error.toString());
    throw new Error('Erro ao salvar avaliação: ' + error.message);
  }
}

/**
 * Busca avaliações de um grupão específico
 * @param {number} grupaoId - ID do grupão
 * @returns {Array} Lista de avaliações
 */
function buscarAvaliacoesGrupao(grupaoId) {
  try {
    Logger.log('📊 Buscando avaliações do grupão: ' + grupaoId);

    const avaliacoes = odooSearchRead(
      ODOO_MODELS.AVALIACAO_GRUPAO,
      ['id', 'x_name', 'x_studio_avaliacao', 'x_studio_observacao', 'x_studio_data_hora_avaliacao'],
      [['x_studio_grupao', '=', parseInt(grupaoId)]],
      { order: 'x_studio_data_hora_avaliacao desc' }
    );

    Logger.log('✅ Avaliações encontradas: ' + avaliacoes.length);
    return avaliacoes;

  } catch (error) {
    Logger.log('❌ Erro ao buscar avaliações: ' + error.toString());
    throw new Error('Erro ao buscar avaliações: ' + error.message);
  }
}

/**
 * Calcula estatísticas de avaliações de um grupão
 * @param {number} grupaoId - ID do grupão
 * @returns {Object} { media, total, distribuicao }
 */
function calcularEstatisticasGrupao(grupaoId) {
  try {
    Logger.log('📈 Calculando estatísticas do grupão: ' + grupaoId);

    const avaliacoes = buscarAvaliacoesGrupao(grupaoId);

    if (avaliacoes.length === 0) {
      return { media: 0, total: 0, distribuicao: {} };
    }

    const notas = avaliacoes.map(a => parseInt(a.x_studio_avaliacao)).filter(n => !isNaN(n));
    const soma = notas.reduce((acc, n) => acc + n, 0);
    const media = notas.length > 0 ? (soma / notas.length).toFixed(1) : 0;

    // Distribuição por nota
    const distribuicao = {};
    for (let i = 1; i <= 5; i++) {
      distribuicao[i] = notas.filter(n => n === i).length;
    }

    return { media: parseFloat(media), total: notas.length, distribuicao };

  } catch (error) {
    Logger.log('❌ Erro ao calcular estatísticas: ' + error.toString());
    throw new Error('Erro ao calcular estatísticas: ' + error.message);
  }
}

/**
 * Verifica o prazo de avaliação de um grupão
 * @param {number} grupaoId - ID do grupão
 * @returns {Object} { diasPassados, diasRestantes, podeAvaliar, prazoExpirado }
 */
function verificarPrazoAvaliacao(grupaoId) {
  try {
    const grupao = odooSearchRead(
      ODOO_MODELS.GRUPAO,
      ['id', 'x_studio_data'],
      [['id', '=', parseInt(grupaoId)]],
      { limit: 1 }
    );

    if (!grupao || grupao.length === 0) {
      throw new Error('Grupão não encontrado');
    }

    const dataGrupao = new Date(grupao[0].x_studio_data);
    const diferencaDias = calcularDiferencaDias(dataGrupao, new Date());

    return {
      diasPassados: diferencaDias,
      diasRestantes: Math.max(0, PRAZO_AVALIACAO_DIAS - diferencaDias),
      podeAvaliar: diferencaDias <= PRAZO_AVALIACAO_DIAS,
      prazoExpirado: diferencaDias > PRAZO_AVALIACAO_DIAS
    };

  } catch (error) {
    Logger.log('❌ Erro ao verificar prazo: ' + error.toString());
    throw new Error('Erro ao verificar prazo: ' + error.message);
  }
}