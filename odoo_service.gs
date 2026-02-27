// ================================================
// ODOO_SERVICE.GS - SERVIÇO DE INTEGRAÇÃO COM ODOO
// ================================================
// Versão: 2.0.0
// Funções genéricas para comunicação com Odoo via JSON-RPC
//
// DEPENDÊNCIA: config.gs (getOdooConfig())
//
// Modelos Odoo utilizados neste projeto:
//   - x_ficha_cadastral    → Fichas cadastrais de casais
//   - x_comunidade         → Comunidades paroquiais
//   - x_habilidades        → Habilidades dos membros
//   - x_pastorais          → Pastorais/atuação pastoral
//   - x_grupao             → Grupões (encontros mensais)
//   - x_avaliacao_grupao   → Avaliações de grupão
//   - x_calendario         → Eventos do calendário
// ================================================

/**
 * Executa uma chamada JSON-RPC genérica ao Odoo
 * Centraliza a lógica de request/response para evitar repetição
 * @param {string} model - Nome do modelo Odoo
 * @param {string} method - Método a executar (search_read, create, write, unlink)
 * @param {Array} args - Argumentos do método
 * @param {Object} kwargs - Argumentos nomeados (opcional)
 * @returns {*} Resultado da chamada
 */
function odooExecute(model, method, args, kwargs) {
  const config = getOdooConfig();
  
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        config.database,
        config.uid,
        config.apiKey,
        model,
        method,
        args || [],
        kwargs || {}
      ]
    }
  };

  try {
    const response = UrlFetchApp.fetch(config.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      const errorMsg = result.error.data?.message || result.error.message || 'Erro desconhecido do Odoo';
      Logger.log(`❌ Erro Odoo [${model}.${method}]: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return result.result;

  } catch (error) {
    if (error.message && error.message.includes('Erro')) {
      throw error; // Re-throw erros do Odoo já formatados
    }
    Logger.log(`❌ Erro de conexão [${model}.${method}]: ${error.toString()}`);
    throw new Error(`Falha na comunicação com o Odoo: ${error.message}`);
  }
}

/**
 * Busca registros no Odoo (search_read)
 * @param {string} model - Nome do modelo Odoo
 * @param {Array} fields - Campos a retornar
 * @param {Array} [domain=[]] - Filtros de busca
 * @param {Object} [options={}] - Opções (order, limit, offset)
 * @returns {Array} Lista de registros
 */
function odooSearchRead(model, fields, domain, options) {
  domain = domain || [];
  options = options || {};

  const kwargs = {
    fields: fields,
    order: options.order || 'id asc',
    limit: options.limit || 100,
    offset: options.offset || 0
  };

  Logger.log(`🔍 Buscando: ${model} | Filtros: ${JSON.stringify(domain)} | Limite: ${kwargs.limit}`);

  const result = odooExecute(model, 'search_read', [domain], kwargs);

  Logger.log(`✅ Encontrados: ${result ? result.length : 0} registros`);
  return result || [];
}

/**
 * Cria um novo registro no Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {Object} data - Dados do novo registro
 * @returns {number} ID do registro criado
 */
function odooCreate(model, data) {
  Logger.log(`➕ Criando registro: ${model}`);
  Logger.log(`📋 Dados: ${JSON.stringify(data)}`);

  const result = odooExecute(model, 'create', [data]);

  Logger.log(`✅ Registro criado com ID: ${result}`);
  return result;
}

/**
 * Atualiza um registro existente no Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {number} recordId - ID do registro
 * @param {Object} data - Dados a atualizar
 * @returns {boolean} True se sucesso
 */
function odooWrite(model, recordId, data) {
  Logger.log(`✏️ Atualizando: ${model} ID ${recordId}`);

  const result = odooExecute(model, 'write', [[recordId], data]);

  Logger.log('✅ Registro atualizado');
  return result;
}

/**
 * Deleta um registro do Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {number} recordId - ID do registro
 * @returns {boolean} True se sucesso
 */
function odooUnlink(model, recordId) {
  Logger.log(`🗑️ Deletando: ${model} ID ${recordId}`);

  const result = odooExecute(model, 'unlink', [[recordId]]);

  Logger.log('✅ Registro deletado');
  return result;
}

/**
 * Verifica conexão com o Odoo
 * @returns {Object} Status da conexão
 */
function testarConexaoOdoo() {
  try {
    const config = getOdooConfig();

    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'version'
      }
    };

    const response = UrlFetchApp.fetch(config.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { status: 'erro', mensagem: 'Erro ao conectar', erro: result.error };
    }

    return { status: 'sucesso', mensagem: 'Conexão OK', versao: result.result };

  } catch (error) {
    return { status: 'erro', mensagem: error.toString() };
  }
}