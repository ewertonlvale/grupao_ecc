// ================================================
// AVALIACAO_GRUPAO.GS - LÓGICA DE AVALIAÇÃO DO GRUPÃO
// ================================================
// Versão: 2.0.0
// Funções específicas para avaliação de grupão
// Inclui validação de período de 10 dias e busca de próximo grupão
// ================================================

/**
 * Busca o grupão mais recente (ativo) com validação de período
 * @returns {Object} Dados do grupão com informação se pode avaliar
 */
function buscarGrupaoComValidacao() {
  try {
    const hoje = new Date();
    const dataHoje = Utilities.formatDate(hoje, 'GMT-3', 'yyyy-MM-dd');
    
    Logger.log('📅 Buscando grupão ativo até: ' + dataHoje);
    
    // Buscar grupão mais recente até hoje
    const result = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data'],
      [['x_studio_data', '<=', dataHoje]],
      { order: 'x_studio_data desc', limit: 1 }
    );
    
    let grupaoAtual = null;
    let podeAvaliar = false;
    
    if (result && result.length > 0) {
      grupaoAtual = result[0];
      Logger.log('✅ Grupão encontrado: ' + grupaoAtual.x_name);
      
      // Validar se está dentro do período de 10 dias
      const dataGrupao = new Date(grupaoAtual.x_studio_data);
      const diferencaDias = calcularDiferencaDias(dataGrupao, hoje);
      
      Logger.log('📊 Diferença de dias: ' + diferencaDias);
      
      if (diferencaDias <= 10) {
        podeAvaliar = true;
        Logger.log('✅ Grupão está dentro do prazo de avaliação');
      } else {
        Logger.log('⏰ Grupão fora do prazo de avaliação (mais de 10 dias)');
      }
    } else {
      Logger.log('⚠️ Nenhum grupão ativo encontrado');
    }
    
    // Buscar próximo grupão
    const proximoGrupao = buscarProximoGrupao();
    
    return {
      grupaoAtual: grupaoAtual,
      podeAvaliar: podeAvaliar,
      proximoGrupao: proximoGrupao
    };
    
  } catch (error) {
    Logger.log('❌ Erro ao buscar grupão: ' + error.toString());
    throw new Error('Erro ao buscar grupão: ' + error.message);
  }
}

/**
 * Busca o próximo grupão (data futura mais recente)
 * @returns {Object|null} Dados do próximo grupão ou null se não encontrado
 */
function buscarProximoGrupao() {
  try {
    const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd');
    
    Logger.log('🔮 Buscando próximo grupão após: ' + hoje);
    
    const result = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data', 'x_studio_local'],
      [['x_studio_data', '>', hoje]],
      { order: 'x_studio_data asc', limit: 1 }
    );
    
    if (result && result.length > 0) {
      Logger.log('✅ Próximo grupão encontrado: ' + result[0].x_name + ' em ' + result[0].x_studio_data);
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
 * Calcula a diferença em dias entre duas datas
 * @param {Date} data1 - Data inicial
 * @param {Date} data2 - Data final
 * @returns {number} Diferença em dias (valor absoluto)
 */
function calcularDiferencaDias(data1, data2) {
  const umDia = 24 * 60 * 60 * 1000; // milissegundos em um dia
  const diferenca = Math.abs(data2 - data1);
  return Math.floor(diferenca / umDia);
}

/**
 * Busca o grupão mais recente (função original mantida para compatibilidade)
 * @returns {Object|null} Dados do grupão ou null se não encontrado
 */
function buscarGrupao() {
  try {
    const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd');
    
    Logger.log('📅 Buscando grupão ativo até: ' + hoje);
    
    const result = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data'],
      [['x_studio_data', '<=', hoje]],
      { order: 'x_studio_data desc', limit: 1 }
    );
    
    if (result && result.length > 0) {
      Logger.log('✅ Grupão encontrado: ' + result[0].x_name);
      return result[0];
    }
    
    Logger.log('⚠️ Nenhum grupão ativo encontrado');
    return null;
    
  } catch (error) {
    Logger.log('❌ Erro ao buscar grupão: ' + error.toString());
    throw new Error('Erro ao buscar grupão: ' + error.message);
  }
}

/**
 * Cria uma nova avaliação de grupão
 * @param {Object} formData - Dados do formulário de avaliação
 * @returns {Object} Resultado da criação
 */
function criarAvaliacaoGrupao(formData) {
  try {
    Logger.log('📝 Criando avaliação de grupão...');
    Logger.log('Dados recebidos: ' + JSON.stringify(formData));
    
    // Validar dados obrigatórios
    if (!formData.grupao_id) {
      throw new Error('ID do grupão é obrigatório');
    }
    
    if (!formData.avaliacao) {
      throw new Error('Avaliação é obrigatória');
    }
    
    // Validar nota (1-5)
    const nota = parseInt(formData.avaliacao);
    if (isNaN(nota) || nota < 1 || nota > 5) {
      throw new Error('Avaliação deve ser um número entre 1 e 5');
    }
    
    // Validar se o grupão ainda está no prazo de avaliação
    const grupao = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data'],
      [['id', '=', parseInt(formData.grupao_id)]],
      { limit: 1 }
    );
    
    if (!grupao || grupao.length === 0) {
      throw new Error('Grupão não encontrado');
    }
    
    const dataGrupao = new Date(grupao[0].x_studio_data);
    const hoje = new Date();
    const diferencaDias = calcularDiferencaDias(dataGrupao, hoje);
    
    if (diferencaDias > 10) {
      throw new Error('Prazo para avaliar este grupão já expirou (máximo de 10 dias)');
    }
    
    // Preparar dados para o Odoo
    const recordData = {
      x_studio_grupao: parseInt(formData.grupao_id),
      x_studio_avaliacao: nota.toString(),
      x_studio_observacao: formData.observacao || '',
      x_name: formData.nome_casal || 'Avaliação Anônima',
      x_studio_data_hora_avaliacao: Utilities.formatDate(
        new Date(),
        'GMT-3',
        'yyyy-MM-dd HH:mm:ss'
      )
    };
    
    // Criar registro no Odoo
    const recordId = odooCreate('x_avaliacao_grupao', recordData);
    
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
 * Busca todas as avaliações de um grupão específico
 * @param {number} grupaoId - ID do grupão
 * @returns {Array} Lista de avaliações
 */
function buscarAvaliacoesGrupao(grupaoId) {
  try {
    Logger.log('📊 Buscando avaliações do grupão: ' + grupaoId);
    
    const avaliacoes = odooSearchRead(
      'x_avaliacao_grupao',
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
 * @returns {Object} Estatísticas (média, total, distribuição)
 */
function calcularEstatisticasGrupao(grupaoId) {
  try {
    Logger.log('📈 Calculando estatísticas do grupão: ' + grupaoId);
    
    const avaliacoes = buscarAvaliacoesGrupao(grupaoId);
    
    if (avaliacoes.length === 0) {
      return {
        total: 0,
        media: 0,
        distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    // Calcular distribuição e média
    const distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let soma = 0;
    
    avaliacoes.forEach(function(av) {
      const nota = av.x_studio_avaliacao;
      distribuicao[nota]++;
      soma += nota;
    });
    
    const media = (soma / avaliacoes.length).toFixed(2);
    
    const estatisticas = {
      total: avaliacoes.length,
      media: parseFloat(media),
      distribuicao: distribuicao,
      percentuais: {
        1: ((distribuicao[1] / avaliacoes.length) * 100).toFixed(1),
        2: ((distribuicao[2] / avaliacoes.length) * 100).toFixed(1),
        3: ((distribuicao[3] / avaliacoes.length) * 100).toFixed(1),
        4: ((distribuicao[4] / avaliacoes.length) * 100).toFixed(1),
        5: ((distribuicao[5] / avaliacoes.length) * 100).toFixed(1)
      }
    };
    
    Logger.log('✅ Estatísticas calculadas: Média = ' + media + ', Total = ' + avaliacoes.length);
    return estatisticas;
    
  } catch (error) {
    Logger.log('❌ Erro ao calcular estatísticas: ' + error.toString());
    throw new Error('Erro ao calcular estatísticas: ' + error.message);
  }
}

/**
 * Lista todos os grupões (histórico)
 * @param {number} limit - Limite de registros
 * @returns {Array} Lista de grupões
 */
function listarGrupoes(limit) {
  try {
    limit = limit || 50;
    
    Logger.log('📋 Listando grupões (limite: ' + limit + ')');
    
    const grupoes = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data'],
      [],
      { order: 'x_studio_data desc', limit: limit }
    );
    
    Logger.log('✅ Grupões encontrados: ' + grupoes.length);
    return grupoes;
    
  } catch (error) {
    Logger.log('❌ Erro ao listar grupões: ' + error.toString());
    throw new Error('Erro ao listar grupões: ' + error.message);
  }
}

/**
 * Verifica se um grupão está no prazo de avaliação
 * @param {number} grupaoId - ID do grupão
 * @returns {Object} Informações sobre o prazo
 */
function verificarPrazoAvaliacao(grupaoId) {
  try {
    const grupao = odooSearchRead(
      'x_grupao',
      ['id', 'x_name', 'x_studio_data'],
      [['id', '=', parseInt(grupaoId)]],
      { limit: 1 }
    );
    
    if (!grupao || grupao.length === 0) {
      throw new Error('Grupão não encontrado');
    }
    
    const dataGrupao = new Date(grupao[0].x_studio_data);
    const hoje = new Date();
    const diferencaDias = calcularDiferencaDias(dataGrupao, hoje);
    const diasRestantes = 10 - diferencaDias;
    
    return {
      grupao: grupao[0],
      diferencaDias: diferencaDias,
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
      podeAvaliar: diferencaDias <= 10,
      prazoExpirado: diferencaDias > 10
    };
    
  } catch (error) {
    Logger.log('❌ Erro ao verificar prazo: ' + error.toString());
    throw new Error('Erro ao verificar prazo: ' + error.message);
  }
}