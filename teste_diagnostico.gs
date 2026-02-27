// ================================================
// TESTE_DIAGNOSTICO.GS - DIAGNÓSTICO DE PROBLEMAS
// ================================================

/**
 * TESTE 1: Verificar acesso à pasta do Drive
 */
function teste1_AcessoPasta() {
  const PASTA_ID = '1bMJe6wN3ajozGRCFDR7dQk4j3SQVSEnR';
  
  try {
    Logger.log('🧪 TESTE 1: Verificando acesso à pasta...');
    
    const pasta = DriveApp.getFolderById(PASTA_ID);
    const nomePasta = pasta.getName();
    
    Logger.log('✅ Pasta encontrada: ' + nomePasta);
    Logger.log('✅ ID da pasta: ' + PASTA_ID);
    
    // Listar arquivos existentes
    const arquivos = pasta.getFiles();
    let count = 0;
    while (arquivos.hasNext()) {
      const arquivo = arquivos.next();
      count++;
      Logger.log(`   - ${arquivo.getName()} (${arquivo.getSize()} bytes)`);
    }
    
    Logger.log(`✅ Total de arquivos na pasta: ${count}`);
    return { success: true, pasta: nomePasta, arquivos: count };
    
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 2: Criar arquivo de teste
 */
function teste2_CriarArquivoTeste() {
  const PASTA_ID = '1bMJe6wN3ajozGRCFDR7dQk4j3SQVSEnR';
  
  try {
    Logger.log('🧪 TESTE 2: Criando arquivo de teste...');
    
    const pasta = DriveApp.getFolderById(PASTA_ID);
    
    // Criar um arquivo de texto simples
    const conteudo = 'Teste de upload - ' + new Date().toISOString();
    const blob = Utilities.newBlob(conteudo, 'text/plain', 'teste_' + Date.now() + '.txt');
    
    const arquivo = pasta.createFile(blob);
    
    Logger.log('✅ Arquivo criado: ' + arquivo.getName());
    Logger.log('✅ ID do arquivo: ' + arquivo.getId());
    Logger.log('✅ URL: ' + arquivo.getUrl());
    
    return { success: true, fileId: arquivo.getId(), fileName: arquivo.getName() };
    
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 3: Salvar imagem de teste (pequena)
 */
function teste3_SalvarImagemTeste() {
  const PASTA_ID = '1bMJe6wN3ajozGRCFDR7dQk4j3SQVSEnR';
  
  try {
    Logger.log('🧪 TESTE 3: Salvando imagem de teste...');
    
    // Criar uma imagem PNG mínima (1x1 pixel vermelho)
    const base64ImagemTeste = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    const pasta = DriveApp.getFolderById(PASTA_ID);
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64ImagemTeste),
      'image/png',
      'teste_imagem_' + Date.now() + '.png'
    );
    
    const arquivo = pasta.createFile(blob);
    
    // Tornar público
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = arquivo.getId();
    const urlVisualizacao = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    Logger.log('✅ Imagem criada: ' + arquivo.getName());
    Logger.log('✅ ID do arquivo: ' + fileId);
    Logger.log('✅ URL de visualização: ' + urlVisualizacao);
    Logger.log('✅ Tamanho: ' + arquivo.getSize() + ' bytes');
    
    return { 
      success: true, 
      fileId: fileId, 
      fileName: arquivo.getName(),
      url: urlVisualizacao,
      size: arquivo.getSize()
    };
    
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * TESTE 4: Verificar se a função salvarImagemNoDrive existe e funciona
 */
function teste4_FuncaoSalvarImagem() {
  try {
    Logger.log('🧪 TESTE 4: Testando função salvarImagemNoDrive...');
    
    // Verificar se a função existe
    if (typeof salvarImagemNoDrive === 'undefined') {
      Logger.log('❌ ERRO: Função salvarImagemNoDrive não encontrada!');
      Logger.log('⚠️ Verifique se o arquivo google_drive_service.gs foi adicionado ao projeto');
      return { success: false, error: 'Função não encontrada' };
    }
    
    Logger.log('✅ Função salvarImagemNoDrive encontrada');
    
    // Testar a função com imagem pequena
    const base64ImagemTeste = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    const resultado = salvarImagemNoDrive(base64ImagemTeste, 'Teste Casal');
    
    Logger.log('✅ Função executada com sucesso');
    Logger.log('📊 Resultado: ' + JSON.stringify(resultado));
    
    return resultado;
    
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * TESTE 5: Testar fluxo completo (simulado)
 */
function teste5_FluxoCompleto() {
  try {
    Logger.log('🧪 TESTE 5: Testando fluxo completo...');
    
    // Dados simulados de um formulário
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
    
    Logger.log('📋 Dados de teste preparados');
    Logger.log('📸 Imagem incluída: ' + (formDataTeste.imagem_base64 ? 'Sim' : 'Não'));
    
    // Testar apenas a parte da imagem
    if (formDataTeste.imagem_base64 && typeof salvarImagemNoDrive !== 'undefined') {
      Logger.log('💾 Tentando salvar imagem...');
      
      const nomeCasal = 'João e Maria';
      const resultadoDrive = salvarImagemNoDrive(formDataTeste.imagem_base64, nomeCasal);
      
      Logger.log('✅ Resultado do Drive: ' + JSON.stringify(resultadoDrive));
      
      if (resultadoDrive.success) {
        Logger.log('✅ URL da foto: ' + resultadoDrive.url);
        return { success: true, urlFoto: resultadoDrive.url };
      } else {
        Logger.log('❌ Falha ao salvar no Drive');
        return { success: false, error: 'Falha ao salvar' };
      }
    } else {
      Logger.log('⚠️ Função salvarImagemNoDrive não disponível ou sem imagem');
      return { success: false, error: 'Função não disponível' };
    }
    
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * EXECUTAR TODOS OS TESTES
 */
function executarTodosTestes() {
  Logger.log('');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('🧪 INICIANDO BATERIA DE TESTES');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('');
  
  const resultados = {
    teste1: teste1_AcessoPasta(),
    teste2: teste2_CriarArquivoTeste(),
    teste3: teste3_SalvarImagemTeste(),
    teste4: teste4_FuncaoSalvarImagem(),
    teste5: teste5_FluxoCompleto()
  };
  
  Logger.log('');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('📊 RESUMO DOS TESTES');
  Logger.log('═══════════════════════════════════════════');
  
  for (let teste in resultados) {
    const status = resultados[teste].success ? '✅ PASSOU' : '❌ FALHOU';
    Logger.log(`${teste}: ${status}`);
    if (!resultados[teste].success) {
      Logger.log(`   Erro: ${resultados[teste].error}`);
    }
  }
  
  Logger.log('═══════════════════════════════════════════');
  
  return resultados;
}