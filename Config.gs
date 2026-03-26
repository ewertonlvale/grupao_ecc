// ================================================
// CONFIG.GS - CONFIGURAÇÃO CENTRALIZADA
// ================================================
// Versão: 3.0.0
// Sistema: ECC - Paróquia Nossa Senhora da Conceição Aparecida
//
// SEGURANÇA: Todas as credenciais são armazenadas no
// PropertiesService do Apps Script
// ================================================

/**
 * Cache em memória para evitar chamadas repetidas ao PropertiesService
 * @type {Object|null}
 */
let _configCache = null;

/**
 * Obtém configuração do Odoo a partir do PropertiesService
 * Usa cache em memória para performance
 * @returns {Object} Configurações do Odoo
 */
function getOdooConfig() {
  if (_configCache) return _configCache;

  const props = PropertiesService.getScriptProperties();
  
  _configCache = {
    url: props.getProperty('ODOO_URL') || '',
    database: props.getProperty('ODOO_DATABASE') || '',
    uid: parseInt(props.getProperty('ODOO_UID') || '0'),
    apiKey: props.getProperty('ODOO_API_KEY') || ''
  };

  // Validar configurações essenciais
  if (!_configCache.url || !_configCache.apiKey) {
    throw new Error(
      'Configurações do Odoo não encontradas. Execute configurarPropriedadesIniciais() ' +
      'ou adicione as propriedades manualmente em Configurações > Propriedades do script.'
    );
  }

  return _configCache;
}

/**
 * Obtém o ID da pasta do Google Drive para fotos
 * @returns {string} ID da pasta
 */
function getDrivePastaId() {
  const props = PropertiesService.getScriptProperties();
  const pastaId = props.getProperty('DRIVE_PASTA_ID');
  
  if (!pastaId) {
    throw new Error('ID da pasta do Google Drive não configurado. Adicione DRIVE_PASTA_ID nas propriedades do script.');
  }
  
  return pastaId;
}

/**
 * Obtém o token de autenticação para formulários
 * @returns {string} Token de autenticação
 */
function getAuthToken() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('AUTH_TOKEN') || '';
}

/**
 * Obtém configurações gerais do aplicativo
 * @returns {Object} Configurações da aplicação
 */
function getAppConfig() {
  return {
    nome: 'ECC - Sistema Paroquial',
    versao: '3.0.0',
    paroquia: 'Nossa Senhora da Conceição Aparecida',
    ambiente: 'Produção'
  };
}

/**
 * Limpa o cache de configurações
 * Útil quando as propriedades são atualizadas
 */
function limparCacheConfig() {
  _configCache = null;
  Logger.log('🔄 Cache de configurações limpo');
}

/**
 * Função de setup inicial - configura todas as propriedades necessárias
 * 
 * ⚠️ IMPORTANTE: Edite os valores abaixo ANTES de executar.
 * Após executar, as credenciais ficam seguras no PropertiesService
 * e DEVEM ser removidas deste código-fonte.
 * 
 * Execute apenas UMA VEZ no editor do Apps Script.
 */
function configurarPropriedadesIniciais() {
  const props = PropertiesService.getScriptProperties();
  
  props.setProperties({
    'ODOO_URL': 'https://ecc-pnscaparecida.odoo.com',
    'ODOO_DATABASE': 'ecc-pnscaparecida',
    'ODOO_UID': '6',
    'ODOO_API_KEY': 'SUA_CHAVE_API_AQUI',           // ⚠️ Substituir!
    'DRIVE_PASTA_ID': 'SEU_ID_DA_PASTA_AQUI',       // ⚠️ Substituir!
    'AUTH_TOKEN': 'SEU_TOKEN_AQUI'                   // ⚠️ Substituir!
  });

  Logger.log('✅ Propriedades configuradas com sucesso!');
  Logger.log('⚠️ REMOVA as credenciais deste código-fonte agora.');
  Logger.log('📋 Propriedades salvas:');
  
  const allProps = props.getProperties();
  Object.keys(allProps).forEach(key => {
    // Mascarar valores sensíveis no log
    const valor = key.includes('KEY') || key.includes('TOKEN') 
      ? allProps[key].substring(0, 4) + '****' 
      : allProps[key];
    Logger.log(`   ${key} = ${valor}`);
  });
}

/**
 * Verifica se todas as configurações estão presentes
 * @returns {Object} Status de cada configuração
 */
function verificarConfiguracoes() {
  const props = PropertiesService.getScriptProperties();
  const requiredProps = [
    'ODOO_URL', 'ODOO_DATABASE', 'ODOO_UID', 'ODOO_API_KEY',
    'DRIVE_PASTA_ID', 'AUTH_TOKEN'
  ];

  const status = {};
  let todasOk = true;

  requiredProps.forEach(prop => {
    const valor = props.getProperty(prop);
    const configurado = !!valor && valor.length > 0;
    
    if (!configurado) todasOk = false;
    
    status[prop] = {
      configurado: configurado,
      tamanho: valor ? valor.length : 0
    };
  });

  Logger.log('📋 Status das configurações:');
  Logger.log(JSON.stringify(status, null, 2));
  Logger.log(todasOk ? '✅ Todas configurações OK' : '❌ Configurações faltando');

  return { todasOk, status };
}

// ================================================
// MAPEAMENTO DE MODELOS ODOO
// ================================================
// Documentação centralizada dos nomes corretos dos
// modelos customizados no Odoo para evitar inconsistências
// ================================================

const ODOO_MODELS = {
  // Modelo de fichas cadastrais de casais
  FICHA_CADASTRAL: 'x_ficha_cadastral',
  
  // Modelo de comunidades paroquiais
  COMUNIDADE: 'x_comunidade',
  
  // Modelo de habilidades dos membros
  // Nota: O modelo pode ser singular ou plural dependendo da instalação
  HABILIDADES: 'x_habilidades',
  HABILIDADES_ALT: 'x_habilidade',
  
  // Modelo de pastorais/atuação pastoral
  PASTORAIS: 'x_pastoral',
  PASTORAIS_ALT: 'x_pastoral',
  
  // Modelo de grupões (encontros mensais)
  GRUPAO: 'x_grupao',
  
  // Modelo de avaliações de grupão
  AVALIACAO_GRUPAO: 'x_avaliacao_grupao',
  
  // Modelo de eventos do calendário
  CALENDARIO: 'x_calendario'
};