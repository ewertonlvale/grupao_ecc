/**
 * ================================================
 * push_service.gs — Envio de Push via OneSignal
 * ================================================
 * Wrapper Apps Script para a API REST do OneSignal.
 * Permite disparar notificações a partir do backend,
 * agendá-las via triggers, ou expô-las para admins.
 *
 * Pré-requisitos:
 *   - Conta OneSignal (free) com app "Catálogo ECC" criado.
 *   - App ID + REST API Key copiados do painel (Settings → Keys & IDs).
 *   - Service Worker do OneSignal já subido na hospedagem
 *     (/pwa/push/sw.js inclui importScripts do OneSignal).
 *
 * Configuração:
 *   No editor do Apps Script: Project Settings → Script Properties → Add.
 *     ONESIGNAL_APP_ID        = (ex: 12345678-abcd-...)
 *     ONESIGNAL_REST_API_KEY  = (ex: os_v2_app_...)
 *
 *   NUNCA hardcode a REST API Key no código — use Script Properties.
 * ================================================ */

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

/**
 * Envia uma notificação para todos os inscritos.
 *
 * @param {Object} params
 * @param {string} params.titulo    - Título curto (até ~50 caracteres).
 * @param {string} params.mensagem  - Corpo da notificação.
 * @param {string} [params.url]     - URL que abre ao clicar. Default: app principal.
 * @param {string} [params.icone]   - URL absoluta de um ícone personalizado.
 * @param {string} [params.segmento]- Nome de segmento OneSignal. Default: "Subscribed Users".
 *
 * @returns {Object} Resposta do OneSignal (id, recipients).
 */
function enviarPushParaTodos(params) {
  const appId = getProp_('ONESIGNAL_APP_ID');
  const apiKey = getProp_('ONESIGNAL_REST_API_KEY');

  if (!appId || !apiKey) {
    throw new Error('Defina ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY em Script Properties.');
  }
  if (!params || !params.titulo || !params.mensagem) {
    throw new Error('enviarPushParaTodos requer { titulo, mensagem }.');
  }

  const payload = {
    app_id: appId,
    included_segments: [params.segmento || 'Subscribed Users'],
    headings: { en: params.titulo, pt: params.titulo },
    contents: { en: params.mensagem, pt: params.mensagem },
    url: params.url || 'https://eccparoquianscaparecida.com.br/site_catalogo.html',
  };

  if (params.icone) {
    payload.chrome_web_icon = params.icone;
    payload.chrome_icon = params.icone;
    payload.firefox_icon = params.icone;
  }

  const response = UrlFetchApp.fetch(ONESIGNAL_API, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic ' + apiKey,
      Accept: 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    console.error('[push_service] Erro do OneSignal:', code, body);
    throw new Error('OneSignal respondeu ' + code + ': ' + body);
  }

  const json = JSON.parse(body);

  // OneSignal devolve 200 mesmo quando não há destinatários —
  // nesse caso 'id' vem vazio e 'errors' explica o motivo.
  if (!json.id) {
    const msg = Array.isArray(json.errors) ? json.errors.join('; ')
                                           : JSON.stringify(json.errors || json);
    console.warn('[push_service] Nenhum destinatário. OneSignal disse: %s', msg);
    console.warn('[push_service] Provavelmente ninguém aceitou o prompt de push ainda.');
    return json;
  }

  console.log('[push_service] Enviado. ID=%s, destinatários=%s',
              json.id, json.recipients);
  return json;
}

/**
 * Envia push para um segmento específico (Tag match).
 * Exemplo: só usuários com tag "cidade"="Tupã".
 *
 * @param {Object} params
 * @param {string} params.titulo
 * @param {string} params.mensagem
 * @param {Array<{field:string,key:string,relation:string,value:string}>} params.filtros
 *   - Ver https://documentation.onesignal.com/reference/create-notification
 *   - Ex: [{ field:'tag', key:'cidade', relation:'=', value:'Tupã' }]
 * @param {string} [params.url]
 *
 * @returns {Object}
 */
function enviarPushComFiltros(params) {
  const appId = getProp_('ONESIGNAL_APP_ID');
  const apiKey = getProp_('ONESIGNAL_REST_API_KEY');

  if (!appId || !apiKey) {
    throw new Error('Defina ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY em Script Properties.');
  }
  if (!params || !params.filtros || !params.filtros.length) {
    throw new Error('enviarPushComFiltros requer ao menos um filtro.');
  }

  const payload = {
    app_id: appId,
    filters: params.filtros,
    headings: { en: params.titulo, pt: params.titulo },
    contents: { en: params.mensagem, pt: params.mensagem },
    url: params.url || 'https://eccparoquianscaparecida.com.br/site_catalogo.html',
  };

  const response = UrlFetchApp.fetch(ONESIGNAL_API, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic ' + apiKey,
      Accept: 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('OneSignal respondeu ' + code + ': ' + body);
  }
  return JSON.parse(body);
}

/**
 * Consulta estatísticas de uma notificação enviada.
 * Útil para dashboards (visualizações, cliques).
 *
 * @param {string} notificationId - ID devolvido por enviarPushParaTodos().
 */
function consultarPush(notificationId) {
  const appId = getProp_('ONESIGNAL_APP_ID');
  const apiKey = getProp_('ONESIGNAL_REST_API_KEY');

  const url = ONESIGNAL_API + '/' + notificationId + '?app_id=' + appId;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Basic ' + apiKey },
    muteHttpExceptions: true,
  });

  return JSON.parse(response.getContentText());
}

// ================================================
// Helpers
// ================================================

function getProp_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

// ================================================
// EXEMPLOS — rode manualmente do editor para testar
// ================================================

/**
 * Teste rápido: envia "Olá, teste!" pra todo mundo.
 * Rode uma vez do editor (botão ▶ com enviar_TESTE selecionado).
 */
function enviar_TESTE() {
  const r = enviarPushParaTodos({
    titulo: '🎉 Catálogo da Comunidade',
    mensagem: 'Teste de notificação — tudo funcionando!',
  });
  console.log('OK, recebedores:', r.recipients);
}

/**
 * Teste alternativo — segmento "Total Subscriptions" (nome novo no
 * OneSignal pós-2024, alguns accounts só têm esse).
 */
function enviar_TESTE_SEGMENTO_ALTERNATIVO() {
  const r = enviarPushParaTodos({
    titulo: '🎉 Catálogo da Comunidade',
    mensagem: 'Teste via Total Subscriptions',
    segmento: 'Total Subscriptions',
  });
  console.log('OK, recebedores:', r.recipients);
}

/**
 * Diagnóstico definitivo: busca todas as subscriptions via API e envia
 * direto por include_subscription_ids (sem depender de segmento nominal).
 * Se essa função entregar, mas 'enviar_TESTE' não, o problema é nome do segmento.
 */
function enviar_TESTE_POR_ID() {
  const appId = getProp_('ONESIGNAL_APP_ID');
  const apiKey = getProp_('ONESIGNAL_REST_API_KEY');
  if (!appId || !apiKey) throw new Error('Configure Script Properties primeiro.');

  // 1. Listar players (= subscriptions, na API v1 clássica).
  //    Esse endpoint aceita GET e lista tudo com limit até 300.
  const listUrl = 'https://onesignal.com/api/v1/players?app_id=' + appId + '&limit=300';
  const listResp = UrlFetchApp.fetch(listUrl, {
    method: 'get',
    headers: { Authorization: 'Basic ' + apiKey },
    muteHttpExceptions: true,
  });
  const listCode = listResp.getResponseCode();
  console.log('[diag] Status list:', listCode);
  const listText = listResp.getContentText();

  if (listCode !== 200) {
    console.error('[diag] Erro ao listar players:', listText);
    throw new Error('Falha ao listar players: HTTP ' + listCode);
  }

  const listBody = JSON.parse(listText);
  const players = listBody.players || [];
  console.log('[diag] Total players:', listBody.total_count, '— retornados nesta página:', players.length);

  // IMPORTANTE: o SDK v16 moderno não preenche 'notification_types' na /players
  // (é um campo legacy). Então filtrar por isso exclui todo mundo.
  // Filtramos apenas o que é claramente inválido: invalid_identifier=true.
  const ativos = players.filter(function(p) {
    return p.invalid_identifier !== true;
  });
  console.log('[diag] Players válidos (não-invalid_identifier):', ativos.length);

  // Debug: resumo de cada player
  players.forEach(function(p, i) {
    console.log('[diag][#' + i + '] id=' + p.id +
                ' | device_type=' + p.device_type +
                ' | notification_types=' + p.notification_types +
                ' | invalid_identifier=' + p.invalid_identifier +
                ' | last_active=' + p.last_active);
  });

  const playerIds = ativos.map(function(p) { return p.id; });
  if (!playerIds.length) {
    console.warn('[diag] Nenhum player válido. Algo bem estranho.');
    return;
  }

  // 2. Enviar via include_player_ids (v1 clássica — funciona sempre).
  const payload = {
    app_id: appId,
    include_player_ids: playerIds,
    headings: { en: '🎯 Teste direto', pt: '🎯 Teste direto' },
    contents: { en: 'Entregue por include_player_ids',
                pt: 'Entregue por include_player_ids' },
  };

  const sendResp = UrlFetchApp.fetch('https://onesignal.com/api/v1/notifications', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Basic ' + apiKey, Accept: 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = sendResp.getResponseCode();
  const body = sendResp.getContentText();
  console.log('[diag] Status send:', code);
  console.log('[diag] Body:', body);
}

/**
 * Exemplo: anunciar novo comércio cadastrado.
 * Pode ser chamado de um onEdit do Odoo via webhook,
 * ou de um trigger diário que varre registros "recentes".
 */
function anunciarNovoComercio(nomeComercio, categoria, urlPagina) {
  return enviarPushParaTodos({
    titulo: '🆕 Novo na comunidade',
    mensagem: nomeComercio + ' entrou em ' + categoria,
    url: urlPagina,
  });
}

/**
 * Exemplo agendável: resumo semanal.
 * Criar trigger em Edit → Current project's triggers → Add trigger:
 *   - Function: resumoSemanal
 *   - Event source: Time-driven
 *   - Type: Week timer (Seg 09:00)
 */
function resumoSemanal() {
  enviarPushParaTodos({
    titulo: '📅 Bom dia, comunidade!',
    mensagem: 'Confira os destaques da semana no Catálogo.',
    url: 'https://eccparoquianscaparecida.com.br/site_catalogo.html?utm=semanal',
  });
}