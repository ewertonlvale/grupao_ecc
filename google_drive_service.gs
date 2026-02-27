// ================================================
// GOOGLE_DRIVE_SERVICE.GS - SERVIÇO DE UPLOAD PARA GOOGLE DRIVE
// ================================================
// Versão: 1.0.0
// Funções para salvar imagens no Google Drive e retornar URLs públicas
// ================================================

// ID da pasta pública do Google Drive
const PASTA_FOTOS_ID = '1bMJe6wN3ajozGRCFDR7dQk4j3SQVSEnR';

/**
 * Salva uma imagem no Google Drive
 * @param {string} base64Data - Dados da imagem em base64 (sem prefixo data:image)
 * @param {string} nomeCasal - Nome do casal para o arquivo
 * @returns {Object} Informações do arquivo salvo
 */
function salvarImagemNoDrive(base64Data, nomeCasal) {
  try {
    Logger.log('📁 Salvando imagem no Google Drive...');
    Logger.log('👥 Casal: ' + nomeCasal);
    
    // Decodificar base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      gerarNomeArquivo(nomeCasal)
    );
    
    // Obter pasta
    const pasta = DriveApp.getFolderById(PASTA_FOTOS_ID);
    
    // Verificar se já existe uma foto do casal
    const arquivosExistentes = pasta.getFilesByName(blob.getName());
    if (arquivosExistentes.hasNext()) {
      // Deletar foto antiga
      const arquivoAntigo = arquivosExistentes.next();
      Logger.log('🗑️ Removendo foto antiga: ' + arquivoAntigo.getName());
      arquivoAntigo.setTrashed(true);
    }
    
    // Criar novo arquivo
    const arquivo = pasta.createFile(blob);
    
    // Tornar público (qualquer pessoa com o link pode ver)
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Obter URL de visualização direta
    const fileId = arquivo.getId();
    // URL no formato que o Odoo image_url aceita
    const urlVisualizacao = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    const urlDownload = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    Logger.log('✅ Imagem salva com sucesso!');
    Logger.log('🔗 URL: ' + urlVisualizacao);
    
    return {
      success: true,
      fileId: fileId,
      fileName: arquivo.getName(),
      url: urlVisualizacao,
      urlDownload: urlDownload,
      size: arquivo.getSize(),
      mimeType: arquivo.getMimeType(),
      dateCreated: arquivo.getDateCreated()
    };
    
  } catch (error) {
    Logger.log('❌ Erro ao salvar no Drive: ' + error.toString());
    throw new Error('Erro ao salvar imagem: ' + error.message);
  }
}

/**
 * Gera nome de arquivo único para a foto
 * @param {string} nomeCasal - Nome do casal
 * @returns {string} Nome do arquivo
 */
function gerarNomeArquivo(nomeCasal) {
  // Remover caracteres especiais e espaços
  const nomeNormalizado = nomeCasal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove caracteres especiais
    .replace(/\s+/g, '_')             // Substitui espaços por underscore
    .toLowerCase();
  
  // Adicionar timestamp para evitar conflitos
  const timestamp = new Date().getTime();
  
  return `foto_${nomeNormalizado}_${timestamp}.jpg`;
}

/**
 * Lista todas as fotos na pasta
 * @returns {Array} Lista de arquivos
 */
function listarFotosDrive() {
  try {
    Logger.log('📋 Listando fotos no Drive...');
    
    const pasta = DriveApp.getFolderById(PASTA_FOTOS_ID);
    const arquivos = pasta.getFiles();
    const listaFotos = [];
    
    while (arquivos.hasNext()) {
      const arquivo = arquivos.next();
      const fileId = arquivo.getId();
      
      listaFotos.push({
        id: fileId,
        name: arquivo.getName(),
        url: `https://drive.google.com/uc?export=view&id=${fileId}`,
        size: arquivo.getSize(),
        dateCreated: arquivo.getDateCreated(),
        mimeType: arquivo.getMimeType()
      });
    }
    
    Logger.log(`✅ ${listaFotos.length} fotos encontradas`);
    return listaFotos;
    
  } catch (error) {
    Logger.log('❌ Erro ao listar fotos: ' + error.toString());
    throw new Error('Erro ao listar fotos: ' + error.message);
  }
}

/**
 * Deleta uma foto do Drive
 * @param {string} fileId - ID do arquivo no Drive
 * @returns {boolean} True se deletado com sucesso
 */
function deletarFotoDrive(fileId) {
  try {
    Logger.log('🗑️ Deletando foto: ' + fileId);
    
    const arquivo = DriveApp.getFileById(fileId);
    arquivo.setTrashed(true);
    
    Logger.log('✅ Foto deletada com sucesso');
    return true;
    
  } catch (error) {
    Logger.log('❌ Erro ao deletar foto: ' + error.toString());
    throw new Error('Erro ao deletar foto: ' + error.message);
  }
}

/**
 * Obtém informações de uma foto
 * @param {string} fileId - ID do arquivo
 * @returns {Object} Informações do arquivo
 */
function obterInfoFoto(fileId) {
  try {
    const arquivo = DriveApp.getFileById(fileId);
    
    return {
      id: fileId,
      name: arquivo.getName(),
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
      size: arquivo.getSize(),
      dateCreated: arquivo.getDateCreated(),
      dateModified: arquivo.getLastUpdated(),
      mimeType: arquivo.getMimeType(),
      owners: arquivo.getOwners().map(owner => owner.getEmail())
    };
    
  } catch (error) {
    Logger.log('❌ Erro ao obter info da foto: ' + error.toString());
    throw new Error('Erro ao obter informações: ' + error.message);
  }
}

/**
 * Testa acesso à pasta do Drive
 * @returns {Object} Status do teste
 */
function testarAcessoDrive() {
  try {
    const pasta = DriveApp.getFolderById(PASTA_FOTOS_ID);
    const nome = pasta.getName();
    const arquivos = pasta.getFiles();
    
    let contador = 0;
    while (arquivos.hasNext()) {
      arquivos.next();
      contador++;
    }
    
    return {
      status: 'sucesso',
      mensagem: 'Acesso OK',
      pastaNome: nome,
      pastaId: PASTA_FOTOS_ID,
      totalArquivos: contador
    };
    
  } catch (error) {
    return {
      status: 'erro',
      mensagem: error.toString()
    };
  }
}

/**
 * Limpa fotos antigas (opcional - usar com cuidado!)
 * @param {number} diasAtras - Remover fotos mais antigas que X dias
 * @returns {number} Quantidade de fotos removidas
 */
function limparFotosAntigas(diasAtras) {
  try {
    Logger.log(`🧹 Limpando fotos com mais de ${diasAtras} dias...`);
    
    const pasta = DriveApp.getFolderById(PASTA_FOTOS_ID);
    const arquivos = pasta.getFiles();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);
    
    let removidos = 0;
    
    while (arquivos.hasNext()) {
      const arquivo = arquivos.next();
      if (arquivo.getDateCreated() < dataLimite) {
        arquivo.setTrashed(true);
        removidos++;
        Logger.log(`🗑️ Removido: ${arquivo.getName()}`);
      }
    }
    
    Logger.log(`✅ ${removidos} fotos antigas removidas`);
    return removidos;
    
  } catch (error) {
    Logger.log('❌ Erro ao limpar fotos: ' + error.toString());
    throw new Error('Erro ao limpar fotos antigas: ' + error.message);
  }
}