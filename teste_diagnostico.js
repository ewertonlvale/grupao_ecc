// ================================================
// TESTE_DIAGNOSTICO.GS - TESTES E DIAGNÓSTICOS
// ================================================
// Versão: 3.0.0
//
// Funções para testar e diagnosticar o sistema.
// Execute individualmente no editor do Apps Script.
// ================================================

/**
 * TESTE 1: Verificar configurações do PropertiesService
 */
function teste1_Configuracoes() {
  Logger.log('🧪 TESTE 1: Verificando configurações...');

  try {
    const resultado = verificarConfiguracoes();
    Logger.log(resultado.todasOk
      ? '✅ Todas as configurações estão OK!'
      : '❌ Algumas configurações estão faltando'
    );
    return resultado;
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 2: Testar conexão com Odoo
 */
function teste2_ConexaoOdoo() {
  Logger.log('🧪 TESTE 2: Testando conexão com Odoo...');

  try {
    const resultado = testarConexaoOdoo();
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));
    return resultado;
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 3: Testar busca de comunidades
 */
function teste3_BuscarComunidades() {
  Logger.log('🧪 TESTE 3: Buscando comunidades...');

  try {
    const comunidades = buscarComunidades();
    Logger.log(`✅ Encontradas: ${comunidades.length} comunidades`);
    comunidades.forEach(c => Logger.log(`   - [${c.id}] ${c.x_name}`));
    return { success: true, total: comunidades.length, dados: comunidades };
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 4: Testar upload de imagem no Drive
 */
function teste4_UploadDrive() {
  Logger.log('🧪 TESTE 4: Testando upload no Google Drive...');

  try {
    if (typeof salvarImagemNoDrive !== 'function') {
      Logger.log('⚠️ Função salvarImagemNoDrive não encontrada');
      return { success: false, error: 'Função não encontrada' };
    }

    // Imagem de teste (1x1 pixel PNG transparente)
    const base64Teste = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const resultado = salvarImagemNoDrive(base64Teste, 'Teste Casal');
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));
    return resultado;

  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 5: Testar fluxo completo (simulado)
 */
function teste5_FluxoCompleto() {
  Logger.log('🧪 TESTE 5: Testando fluxo completo...');

  try {
    const formDataTeste = {
      marido_nome: 'João da Silva Teste',
      marido_nome_usual: 'João',
      marido_data_nascimento: '1990-01-15',
      marido_telefone: '(85) 98888-7777',
      marido_batizado: true,
      marido_primeira_eucaristia: true,
      marido_crismado: false,

      esposa_nome: 'Maria da Silva Teste',
      esposa_nome_usual: 'Maria',
      esposa_data_nascimento: '1992-05-20',
      esposa_telefone: '(85) 98888-6666',
      esposa_batizado: true,
      esposa_primeira_eucaristia: true,
      esposa_crismado: true,

      casamento_religioso: true,
      data_casamento: '2015-12-25',

      rua: 'Rua Teste',
      numero: '123',
      bairro: 'Bairro Teste',
      referencia: 'Perto da praça',

      habilidades: [],
      atuacao_pastoral: [],

      fez_etapa_2: false,
      fez_etapa_3: false,

      // Imagem de teste (1x1 pixel)
      imagem_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    };

    Logger.log('📋 Dados preparados, criando atualização...');
    const resultado = criarAtualizacaoCadastral(formDataTeste);
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));

    return resultado;

  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * TESTE 6: Testar busca de grupão e avaliação
 */
function teste6_BuscarGrupao() {
  Logger.log('🧪 TESTE 6: Testando busca de grupão...');

  try {
    const resultado = buscarGrupaoComValidacao();
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));
    return resultado;
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 7: Testar calendário de eventos
 */
function teste7_Calendario() {
  Logger.log('🧪 TESTE 7: Testando calendário de eventos...');

  try {
    const resultado = obterEventosCalendario();
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));
    return resultado;
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * Executa todos os testes sequencialmente
 */
function executarTodosTestes() {
  Logger.log('🚀 ========================================');
  Logger.log('🚀 EXECUTANDO TODOS OS TESTES');
  Logger.log('🚀 ========================================\n');

  const testes = [
    { nome: 'Configurações', fn: teste1_Configuracoes },
    { nome: 'Conexão Odoo', fn: teste2_ConexaoOdoo },
    { nome: 'Buscar Comunidades', fn: teste3_BuscarComunidades },
    { nome: 'Upload Drive', fn: teste4_UploadDrive },
    { nome: 'Buscar Grupão', fn: teste6_BuscarGrupao },
    { nome: 'Calendário', fn: teste7_Calendario }
  ];

  const resultados = {};

  testes.forEach((teste, i) => {
    Logger.log(`\n${'='.repeat(40)}`);
    Logger.log(`Teste ${i + 1}/${testes.length}: ${teste.nome}`);
    Logger.log('='.repeat(40));

    try {
      resultados[teste.nome] = teste.fn();
    } catch (error) {
      resultados[teste.nome] = { success: false, error: error.message };
    }
  });

  Logger.log('\n\n📊 ========== RESUMO DOS TESTES ==========');
  Object.entries(resultados).forEach(([nome, resultado]) => {
    const status = resultado?.success !== false ? '✅' : '❌';
    Logger.log(`${status} ${nome}`);
  });

  return resultados;
}