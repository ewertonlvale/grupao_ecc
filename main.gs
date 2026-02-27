// ================================================
// MAIN.GS - ROTEAMENTO E CONFIGURAÇÃO PRINCIPAL
// ================================================
// Versão: 3.0.0
// Sistema: ECC - Paróquia Nossa Senhora da Conceição Aparecida
// ================================================

/**
 * Função principal - serve as páginas HTML
 * @param {Object} e - Event object do Apps Script
 * @returns {HtmlOutput} Página HTML correspondente
 */
function doGet(e) {
  const page = e.parameter.page || 'atualizar';
  
  Logger.log('📄 Página solicitada: ' + page);
  Logger.log('📋 Parâmetros: ' + JSON.stringify(e.parameter));

  try {
    switch (page) {
      case 'avaliar':
      case 'avaliacao':
        return criarPagina('avaliar_grupao', 'Avaliação do Grupão - ECC');

      case 'atualizar':
      case 'atualizacao':
        return criarPagina('atualizar_cadastro', 'Atualização Cadastral - ECC');

      case 'calendario':
        return criarPagina('exibir_calendario', 'Calendário de Eventos - ECC');

      default:
        return criarPagina('atualizar_cadastro', 'Atualização Cadastral - ECC');
    }
  } catch (error) {
    Logger.log('❌ Erro ao carregar página: ' + error.toString());
    return criarPaginaErro(error.message);
  }
}

/**
 * Cria uma página HTML com configurações padrão
 * Evita repetição de código no switch/case
 * @param {string} arquivo - Nome do arquivo HTML (sem extensão)
 * @param {string} titulo - Título da página
 * @returns {HtmlOutput} Página configurada
 */
function criarPagina(arquivo, titulo) {
  return HtmlService
    .createHtmlOutputFromFile(arquivo)
    .setTitle(titulo)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Cria uma página de erro com visual consistente (tema verde)
 * @param {string} mensagem - Mensagem de erro
 * @returns {HtmlOutput} Página de erro
 */
function criarPaginaErro(mensagem) {
  return HtmlService
    .createHtmlOutput(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro - ECC</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a4d2e 0%, #228b22 50%, #2d7a4f 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .error-container {
            max-width: 500px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
          }
          h1 { font-size: 3rem; margin: 0 0 10px; }
          h2 { margin: 0 0 15px; font-weight: 600; }
          p { font-size: 1.1rem; opacity: 0.9; }
          a {
            display: inline-block;
            margin-top: 20px;
            color: white;
            background: rgba(255,255,255,0.2);
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: background 0.3s;
          }
          a:hover { background: rgba(255,255,255,0.3); }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>❌</h1>
          <h2>Erro ao carregar página</h2>
          <p>${mensagem || 'Erro desconhecido'}</p>
          <p><small>Entre em contato com o suporte.</small></p>
        </div>
      </body>
      </html>
    `)
    .setTitle('Erro - ECC');
}

/**
 * Retorna informações do sistema para diagnóstico
 * @returns {Object} Informações do sistema
 */
function testarSistema() {
  const config = getAppConfig();
  const info = {
    ...config,
    dataHora: new Date().toISOString(),
    timezone: Session.getScriptTimeZone(),
    usuarioAtivo: Session.getActiveUser().getEmail(),
    status: 'OK'
  };

  Logger.log('📊 Informações do Sistema:');
  Logger.log(JSON.stringify(info, null, 2));
  return info;
}

/**
 * Retorna configurações do app para o frontend
 * @returns {Object} Configurações públicas
 */
function obterConfigApp() {
  return getAppConfig();
}