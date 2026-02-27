// ================================================
// MAIN.GS - ROTEAMENTO E CONFIGURAÇÃO PRINCIPAL
// ================================================
// Versão: 2.0.0
// Sistema: ECC - Paróquia Nossa Senhora da Conceição Aparecida
// ================================================

/**
 * Função principal - serve as páginas HTML
 * @param {Object} e - Event object do Apps Script
 * @returns {HtmlOutput} Página HTML correspondente
 */
function doGet(e) {
  // Obter parâmetro 'page' da URL (default: atualizar)
  const page = e.parameter.page || 'atualizar';
  
  // Log para debug
  Logger.log('Página solicitada: ' + page);
  Logger.log('Parâmetros recebidos: ' + JSON.stringify(e.parameter));
  
  // Roteamento de páginas
  try {
    switch(page) {
      case 'avaliar':
      case 'avaliacao':
        return HtmlService
          .createHtmlOutputFromFile('avaliar_grupao')
          .setTitle('Avaliação do Grupão - ECC')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        
      case 'atualizar':
      case 'atualizacao':
        return HtmlService
          .createHtmlOutputFromFile('atualizar_cadastro')
          .setTitle('Atualização Cadastral - ECC')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        
      case 'calendario':
        return HtmlService
          .createHtmlOutputFromFile('exibir_calendario')
          .setTitle('Calendário de Eventos - ECC')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        
      default:
        // Página padrão: Atualização Cadastral
        return HtmlService
          .createHtmlOutputFromFile('atualizar_cadastro')
          .setTitle('Atualização Cadastral - ECC')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    }
  } catch (error) {
    Logger.log('Erro ao carregar página: ' + error.toString());
    
    // Retornar página de erro
    return HtmlService
      .createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro - ECC</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .error-container {
              max-width: 500px;
            }
            h1 { font-size: 3rem; margin: 0; }
            p { font-size: 1.2rem; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>❌</h1>
            <h2>Erro ao carregar página</h2>
            <p>${error.message || 'Erro desconhecido'}</p>
            <p><small>Entre em contato com o suporte.</small></p>
          </div>
        </body>
        </html>
      `)
      .setTitle('Erro - ECC');
  }
}

/**
 * Função de teste - retorna informações do sistema
 * Útil para verificar se o Apps Script está funcionando
 */
function testarSistema() {
  const info = {
    versao: '2.0.0',
    dataHora: new Date().toISOString(),
    timezone: Session.getScriptTimeZone(),
    usuarioAtivo: Session.getActiveUser().getEmail(),
    status: 'OK'
  };
  
  Logger.log('Informações do Sistema:');
  Logger.log(JSON.stringify(info, null, 2));
  
  return info;
}

/**
 * Função para obter configurações do aplicativo
 * Pode ser chamada pelo frontend via google.script.run
 */
function obterConfigApp() {
  return {
    nome: 'ECC - Sistema Paroquial',
    versao: '2.0.0',
    paroquia: 'Nossa Senhora da Conceição Aparecida',
    ambiente: 'Produção'
  };
}