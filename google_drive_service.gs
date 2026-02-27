// ================================================
// GOOGLE_DRIVE_SERVICE.GS - UPLOAD DE FOTOS
// ================================================
// Versão: 2.0.0
//
// DEPENDÊNCIA: config.gs (getDrivePastaId)
//
// Upload de fotos de casais para Google Drive com URL pública.
// O ID da pasta é obtido do PropertiesService (DRIVE_PASTA_ID).
// ================================================

/**
 * Salva uma imagem no Google Drive
 * @param {string} base64Data - Dados da imagem em base64 (sem prefixo data:image)
 * @param {string} nomeCasal - Nome do casal para nomear o arquivo
 * @returns {Object} { success, url, urlDownload, fileId, size }
 */
function salvarImagemNoDrive(base64Data, nomeCasal) {
  try {
    const pastaId = getDrivePastaId();

    Logger.log('📁 Salvando imagem no Google Drive...');
    Logger.log('👥 Casal: ' + nomeCasal);

    // Decodificar base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      gerarNomeArquivo(nomeCasal)
    );

    // Obter pasta
    const pasta = DriveApp.getFolderById(pastaId);

    // Remover foto antiga (se existir)
    const arquivosExistentes = pasta.getFilesByName(blob.getName());
    if (arquivosExistentes.hasNext()) {
      const arquivoAntigo = arquivosExistentes.next();
      Logger.log('🗑️ Removendo foto antiga: ' + arquivoAntigo.getName());
      arquivoAntigo.setTrashed(true);
    }

    // Criar novo arquivo
    const arquivo = pasta.createFile(blob);

    // Tornar público (qualquer pessoa com o link pode ver)
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = arquivo.getId();
    const urlVisualizacao = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    const urlDownload = `https://drive.google.com/uc?export=download&id=${fileId}`;

    Logger.log('✅ Imagem salva com sucesso!');
    Logger.log('🔗 URL: ' + urlVisualizacao);

    return {
      success: true,
      url: urlVisualizacao,
      urlDownload: urlDownload,
      fileId: fileId,
      size: arquivo.getSize()
    };

  } catch (error) {
    Logger.log('❌ Erro ao salvar imagem: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gera nome de arquivo padronizado para a foto do casal
 * Remove caracteres especiais e acentos
 * @param {string} nomeCasal - Nome do casal
 * @returns {string} Nome do arquivo (ex: "foto_joao_maria.jpg")
 */
function gerarNomeArquivo(nomeCasal) {
  const nomeNormalizado = nomeCasal
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')       // Remove especiais
    .replace(/\s+/g, '_')              // Espaços → underscores
    .substring(0, 50);                 // Limitar tamanho

  return `foto_${nomeNormalizado}.jpg`;
}

/**
 * Remove foto de um casal do Google Drive
 * @param {string} nomeCasal - Nome do casal
 * @returns {Object} { success, message }
 */
function removerFotoCasal(nomeCasal) {
  try {
    const pastaId = getDrivePastaId();
    const pasta = DriveApp.getFolderById(pastaId);
    const nomeArquivo = gerarNomeArquivo(nomeCasal);

    const arquivos = pasta.getFilesByName(nomeArquivo);
    let removidos = 0;

    while (arquivos.hasNext()) {
      arquivos.next().setTrashed(true);
      removidos++;
    }

    return {
      success: true,
      message: `${removidos} arquivo(s) removido(s)`
    };

  } catch (error) {
    Logger.log('❌ Erro ao remover foto: ' + error.toString());
    return { success: false, error: error.message };
  }
}