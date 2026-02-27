// ================================================
// ODOO_SERVICE.GS - SERVIÇO DE INTEGRAÇÃO COM ODOO
// ================================================
// Versão: 1.0.0
// Funções genéricas para comunicação com Odoo via JSON-RPC
// ================================================

// ================================================
// CONFIGURAÇÕES ODOO
// ================================================

const ODOO_CONFIG = {
  url: 'https://ecc-pnscaparecida.odoo.com',
  database: 'ecc-pnscaparecida',
  uid: 6,
  apiKey: 'a04215fca15a6ed7a838e40510c681dc05fc23e3'
};

// ================================================
// FUNÇÕES GENÉRICAS ODOO
// ================================================

/**
 * Busca registros no Odoo (search_read)
 * @param {string} model - Nome do modelo Odoo (ex: 'x_comunidade')
 * @param {Array} fields - Lista de campos a retornar (ex: ['id', 'x_name'])
 * @param {Array} domain - Filtros de busca (ex: [['active', '=', true]])
 * @param {Object} options - Opções adicionais (order, limit, offset)
 * @returns {Array} Lista de registros encontrados
 */
function odooSearchRead(model, fields, domain, options) {
  domain = domain || [];
  options = options || {};
  
  // Configurações padrão
  const defaultOptions = {
    order: options.order || 'id asc',
    limit: options.limit || 100,
    offset: options.offset || 0
  };
  
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_CONFIG.database,
        ODOO_CONFIG.uid,
        ODOO_CONFIG.apiKey,
        model,
        'search_read',
        [domain],
        {
          fields: fields,
          order: defaultOptions.order,
          limit: defaultOptions.limit,
          offset: defaultOptions.offset
        }
      ]
    }
  };
  
  try {
    Logger.log('🔍 Buscando no Odoo - Modelo: ' + model);
    Logger.log('Filtros: ' + JSON.stringify(domain));
    
    const response = UrlFetchApp.fetch(ODOO_CONFIG.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    // Verificar se houve erro
    if (result.error) {
      Logger.log('❌ Erro Odoo: ' + JSON.stringify(result.error));
      throw new Error(result.error.data?.message || result.error.message || 'Erro ao buscar dados do Odoo');
    }
    
    Logger.log('✅ Registros encontrados: ' + (result.result?.length || 0));
    return result.result || [];
    
  } catch (error) {
    Logger.log('❌ Erro completo: ' + error.toString());
    throw error;
  }
}

/**
 * Cria um novo registro no Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {Object} data - Dados do registro a ser criado
 * @returns {number} ID do registro criado
 */
function odooCreate(model, data) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_CONFIG.database,
        ODOO_CONFIG.uid,
        ODOO_CONFIG.apiKey,
        model,
        'create',
        [data]
      ]
    }
  };
  
  try {
    Logger.log('➕ Criando registro no Odoo - Modelo: ' + model);
    Logger.log('Dados: ' + JSON.stringify(data));
    
    const response = UrlFetchApp.fetch(ODOO_CONFIG.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    // Verificar se houve erro
    if (result.error) {
      Logger.log('❌ Erro Odoo: ' + JSON.stringify(result.error));
      throw new Error(result.error.data?.message || result.error.message || 'Erro ao criar registro no Odoo');
    }
    
    Logger.log('✅ Registro criado com ID: ' + result.result);
    return result.result;
    
  } catch (error) {
    Logger.log('❌ Erro completo: ' + error.toString());
    throw error;
  }
}

/**
 * Atualiza um registro existente no Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {number} recordId - ID do registro a atualizar
 * @param {Object} data - Dados a serem atualizados
 * @returns {boolean} True se atualizado com sucesso
 */
function odooWrite(model, recordId, data) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_CONFIG.database,
        ODOO_CONFIG.uid,
        ODOO_CONFIG.apiKey,
        model,
        'write',
        [[recordId], data]
      ]
    }
  };
  
  try {
    Logger.log('✏️ Atualizando registro no Odoo - Modelo: ' + model + ', ID: ' + recordId);
    Logger.log('Dados: ' + JSON.stringify(data));
    
    const response = UrlFetchApp.fetch(ODOO_CONFIG.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      Logger.log('❌ Erro Odoo: ' + JSON.stringify(result.error));
      throw new Error(result.error.data?.message || result.error.message || 'Erro ao atualizar registro no Odoo');
    }
    
    Logger.log('✅ Registro atualizado com sucesso');
    return result.result;
    
  } catch (error) {
    Logger.log('❌ Erro completo: ' + error.toString());
    throw error;
  }
}

/**
 * Deleta um registro do Odoo
 * @param {string} model - Nome do modelo Odoo
 * @param {number} recordId - ID do registro a deletar
 * @returns {boolean} True se deletado com sucesso
 */
function odooUnlink(model, recordId) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_CONFIG.database,
        ODOO_CONFIG.uid,
        ODOO_CONFIG.apiKey,
        model,
        'unlink',
        [[recordId]]
      ]
    }
  };
  
  try {
    Logger.log('🗑️ Deletando registro no Odoo - Modelo: ' + model + ', ID: ' + recordId);
    
    const response = UrlFetchApp.fetch(ODOO_CONFIG.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      Logger.log('❌ Erro Odoo: ' + JSON.stringify(result.error));
      throw new Error(result.error.data?.message || result.error.message || 'Erro ao deletar registro no Odoo');
    }
    
    Logger.log('✅ Registro deletado com sucesso');
    return result.result;
    
  } catch (error) {
    Logger.log('❌ Erro completo: ' + error.toString());
    throw error;
  }
}

/**
 * Verifica conexão com Odoo
 * @returns {Object} Status da conexão
 */
function testarConexaoOdoo() {
  try {
    // Tentar buscar versão do Odoo
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'version'
      }
    };
    
    const response = UrlFetchApp.fetch(ODOO_CONFIG.url + '/jsonrpc', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      return {
        status: 'erro',
        mensagem: 'Erro ao conectar com Odoo',
        erro: result.error
      };
    }
    
    return {
      status: 'sucesso',
      mensagem: 'Conexão OK',
      versao: result.result
    };
    
  } catch (error) {
    return {
      status: 'erro',
      mensagem: error.toString()
    };
  }
}
