// ================================================
// GOOGLE_DRIVE_SERVICE.GS - UPLOAD DE FOTOS
// ================================================
// Versão: 3.2.0
//
// DEPENDÊNCIA: config.gs (getDrivePastaId, log)
//              Drive API v3 (Advanced Service)
//
// MELHORIAS v3.2.0:
//   - Migração de DriveApp para Drive API (Advanced Service)
//     para compatibilidade com projeto GCP custom
//   - setSharing → Drive.Permissions.create
//   - setName/setTrashed → Drive.Files.update
//   - Upload antecipado via salvarFotoAntecipada()
//   - Renomeação do arquivo após registro via renomearFotoCasal()
//   - Objeto de contexto para rastreabilidade completa
//   - Retry com backoff no createFile (3 tentativas)
/**
 * Salva uma imagem no Google Drive (upload antecipado)
 * Chamada imediatamente após o usuário selecionar a foto,
 * antes do envio do formulário. Usa nome temporário.
 * @param {string} base64Data - Dados da imagem em base64 (sem prefixo data:image)
 * @returns {Object} { success, url, fileId, size, compartilhado }
 */
function salvarFotoAntecipada(base64Data) {
  var nomeTemp = 'temp_' + new Date().getTime();
  log('📷 Upload antecipado de foto (nome temporário: ' + nomeTemp + ')');
  return salvarImagemNoDrive(base64Data, nomeTemp);
}

/**
 * Renomeia um arquivo de foto no Drive para o nome definitivo do casal.
 * Remove foto antiga com o mesmo nome, se existir.
 * Chamada após a criação do registro no Odoo.
 * @param {string} fileId - ID do arquivo no Google Drive
 * @param {string} nomeCasal - Nome do casal (ex: "João & Maria")
 * @returns {Object} { success, nomeArquivo }
 */
function renomearFotoCasal(fileId, nomeCasal) {
  try {
    var nomeArquivo = gerarNomeArquivo(nomeCasal);
    var pastaId = getDrivePastaId();
    var pasta = DriveApp.getFolderById(pastaId);

    // Remover foto antiga com o mesmo nome (se existir)
    var arquivosExistentes = pasta.getFilesByName(nomeArquivo);
    while (arquivosExistentes.hasNext()) {
      var arquivoAntigo = arquivosExistentes.next();
      // Não remover o próprio arquivo que está sendo renomeado
      if (arquivoAntigo.getId() !== fileId) {
        log('🗑️ Removendo foto antiga: ' + arquivoAntigo.getName(), 'info', {
          fotoAntigaId: arquivoAntigo.getId()
        });
       
        Drive.Files.update({ trashed: true }, arquivoAntigo.getId());
      }
    }

    // Renomear o arquivo via Drive API (Advanced Service)
    Drive.Files.update({ name: nomeArquivo }, fileId);

    log('✅ Foto renomeada para: ' + nomeArquivo, 'info', { fileId: fileId });
    return { success: true, nomeArquivo: nomeArquivo };

  } catch (error) {
    log('⚠️ Erro ao renomear foto: ' + error.toString(), 'warn', {
      fileId: fileId,
      nomeCasal: nomeCasal
    });
    return { success: false, error: error.message };
  }
}

/**
 * Salva uma imagem no Google Drive
 * @param {string} base64Data - Dados da imagem em base64 (sem prefixo data:image)
 * @param {string} nomeCasal - Nome do casal para nomear o arquivo
 * @returns {Object} { success, url, urlDownload, fileId, size, compartilhado, contexto }
 */
function salvarImagemNoDrive(base64Data, nomeCasal) {
  // Objeto de contexto — preenchido a cada etapa para rastreabilidade
  var contexto = {
    nomeCasal: nomeCasal,
    nomeArquivo: '',
    pastaId: '',
    fileId: '',
    tamanhoBase64: base64Data ? base64Data.length : 0,
    tamanhoBlob: 0,
    tamanhoArquivo: 0,
    fotoAntigaRemovida: false,
    fotoAntigaId: '',
    arquivoCriado: false,
    compartilhado: false,
    tentativasCompartilhamento: 0,
    timestamp: new Date().toISOString()
  };

  try {
    var pastaId = getDrivePastaId();
    contexto.pastaId = pastaId;
    contexto.nomeArquivo = gerarNomeArquivo(nomeCasal);

    log('📁 Salvando imagem no Google Drive...', 'info', {
      casal: nomeCasal,
      nomeArquivo: contexto.nomeArquivo,
      tamanhoBase64: contexto.tamanhoBase64
    });

    // Decodificar base64
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      contexto.nomeArquivo
    );
    contexto.tamanhoBlob = blob.getBytes().length;

    // Obter pasta e criar arquivo — com retry para erros transientes
    var pasta = null;
    var arquivo = null;
    var MAX_TENTATIVAS_DRIVE = 3;

    for (var tentativaDrive = 1; tentativaDrive <= MAX_TENTATIVAS_DRIVE; tentativaDrive++) {
      try {
        if (!pasta) {
          pasta = DriveApp.getFolderById(pastaId);
        }

        // Remover foto antiga (se existir) — apenas na primeira tentativa
        if (tentativaDrive === 1) {
          var arquivosExistentes = pasta.getFilesByName(contexto.nomeArquivo);
          if (arquivosExistentes.hasNext()) {
            var arquivoAntigo = arquivosExistentes.next();
            contexto.fotoAntigaId = arquivoAntigo.getId();
            log('🗑️ Removendo foto antiga: ' + arquivoAntigo.getName(), 'info', {
              fotoAntigaId: contexto.fotoAntigaId
            });
            Drive.Files.update({ trashed: true }, arquivoAntigo.getId());
            contexto.fotoAntigaRemovida = true;
          }
        }

        // Criar novo arquivo
        arquivo = pasta.createFile(blob);
        break; // Sucesso — sair do loop
      } catch (driveError) {
        log('⚠️ Tentativa ' + tentativaDrive + '/' + MAX_TENTATIVAS_DRIVE + ' de upload falhou: ' + driveError.toString(), 'warn', {
          tentativa: tentativaDrive,
          erro: driveError.toString()
        });
        if (tentativaDrive < MAX_TENTATIVAS_DRIVE) {
          Utilities.sleep(1000 * tentativaDrive); // Backoff: 1s, 2s
        } else {
          throw driveError; // Repassar erro na última tentativa
        }
      }
    }

    contexto.fileId = arquivo.getId();
    contexto.arquivoCriado = true;
    contexto.tamanhoArquivo = arquivo.getSize();

    log('✅ Arquivo criado no Drive', 'info', {
      fileId: contexto.fileId,
      tamanhoKB: (contexto.tamanhoArquivo / 1024).toFixed(2)
    });

    // Tornar público - via Drive API (Advanced Service)
    try {
      Drive.Permissions.create(
        { role: 'reader', type: 'anyone' },
        contexto.fileId
      );
      contexto.compartilhado = true;
      log('🔓 Compartilhamento configurado com sucesso');
    } catch (sharingError) {
      contexto.erroCompartilhamento = sharingError.toString();
      log('⚠️ Compartilhamento falhou: ' + sharingError.toString(), 'warn', contexto);
    }

    var urlVisualizacao = 'https://drive.google.com/thumbnail?id=' + contexto.fileId + '&sz=w800';
    var urlDownload = 'https://drive.google.com/uc?export=download&id=' + contexto.fileId;

    // Log completo de sucesso (sempre, mesmo sem erro)
    log('✅ Imagem salva com sucesso!', 'info', {
      fileId: contexto.fileId,
      url: urlVisualizacao,
      tamanhoKB: (contexto.tamanhoArquivo / 1024).toFixed(2),
      compartilhado: contexto.compartilhado,
      fotoAntigaRemovida: contexto.fotoAntigaRemovida,
      fotoAntigaId: contexto.fotoAntigaId || 'nenhuma'
    });

    return {
      success: true,
      url: urlVisualizacao,
      urlDownload: urlDownload,
      fileId: contexto.fileId,
      size: contexto.tamanhoArquivo,
      compartilhado: contexto.compartilhado,
      contexto: contexto
    };

  } catch (error) {
    contexto.erro = error.toString();
    contexto.stack = error.stack || '';

    log('❌ Erro ao salvar imagem: ' + error.toString(), 'error', contexto);

    return {
      success: false,
      error: error.message,
      contexto: contexto
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
  var nomeNormalizado = nomeCasal
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')       // Remove especiais
    .replace(/\s+/g, '_')              // Espaços → underscores
    .substring(0, 50);                 // Limitar tamanho

  return 'foto_' + nomeNormalizado + '.jpg';
}

/**
 * Remove foto de um casal do Google Drive
 * @param {string} nomeCasal - Nome do casal
 * @returns {Object} { success, message }
 */
function removerFotoCasal(nomeCasal) {
  try {
    var pastaId = getDrivePastaId();
    var pasta = DriveApp.getFolderById(pastaId);
    var nomeArquivo = gerarNomeArquivo(nomeCasal);

    var arquivos = pasta.getFilesByName(nomeArquivo);
    var removidos = 0;

    while (arquivos.hasNext()) {
      var arquivo = arquivos.next();
      log('🗑️ Removendo foto: ' + arquivo.getName(), 'info', { fileId: arquivo.getId() });
      Drive.Files.update({ trashed: true }, arquivo.getId());
      removidos++;
    }

    log('✅ Fotos removidas: ' + removidos, 'info', { casal: nomeCasal });
    return {
      success: true,
      message: removidos + ' arquivo(s) removido(s)'
    };

  } catch (error) {
    log('❌ Erro ao remover foto: ' + error.toString(), 'error', { casal: nomeCasal });
    return { success: false, error: error.message };
  }
}