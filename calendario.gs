// ================================================
// CALENDARIO.GS - CALENDÁRIO DE EVENTOS ECC
// ================================================
// Versão: 2.0.0
//
// DEPENDÊNCIAS:
//   - config.gs      (ODOO_MODELS)
//   - odoo_service.gs (odooSearchRead)
//
// MODELO ODOO: x_calendario
//   Campos: x_name, x_studio_date, x_studio_data_fim,
//           x_studio_tipo_de_evento, x_studio_publicado
// ================================================

/**
 * Busca eventos publicados do Odoo
 * @returns {Array} Lista de eventos processados
 */
function buscarEventosPublicados() {
  try {
    Logger.log('📅 Buscando eventos publicados...');

    const eventos = odooSearchRead(
      ODOO_MODELS.CALENDARIO,
      ['id', 'x_name', 'x_studio_date', 'x_studio_data_fim',
       'x_studio_tipo_de_evento', 'x_studio_publicado'],
      [['x_studio_publicado', '=', true]],
      { order: 'x_studio_date asc', limit: 1000 }
    );

    Logger.log(`✅ Eventos encontrados: ${eventos.length}`);

    return eventos.map(evento => ({
      id: evento.id,
      nome: evento.x_name || 'Evento sem nome',
      dataInicio: evento.x_studio_date || '',
      dataFim: evento.x_studio_data_fim || '',
      tipo: evento.x_studio_tipo_de_evento || 'Evento',
      publicado: evento.x_studio_publicado
    }));

  } catch (error) {
    Logger.log('❌ Erro ao buscar eventos: ' + error.toString());
    throw error;
  }
}

/**
 * Organiza eventos por mês/ano
 * Eventos multi-dia são adicionados em cada mês que ocupam
 * @param {Array} eventos - Lista de eventos
 * @returns {Object} Eventos organizados { "2026-01": [...], ... }
 */
function organizarEventosPorMes(eventos) {
  const eventosPorMes = {};

  eventos.forEach(evento => {
    if (!evento.dataInicio) return;

    const dataInicio = new Date(evento.dataInicio + 'T00:00:00');
    const dataFim = evento.dataFim
      ? new Date(evento.dataFim + 'T00:00:00')
      : new Date(evento.dataInicio + 'T00:00:00');

    const dataAtual = new Date(dataInicio);
    const mesesJaAdicionados = new Set();

    while (dataAtual <= dataFim) {
      const mesAno = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;

      if (!mesesJaAdicionados.has(mesAno)) {
        if (!eventosPorMes[mesAno]) {
          eventosPorMes[mesAno] = [];
        }
        eventosPorMes[mesAno].push(evento);
        mesesJaAdicionados.add(mesAno);
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  });

  return eventosPorMes;
}

/**
 * Função exposta para buscar eventos via AJAX (frontend)
 * @returns {Object} { sucesso, eventos, eventosPorMes }
 */
function obterEventosCalendario() {
  try {
    const eventos = buscarEventosPublicados();
    const eventosPorMes = organizarEventosPorMes(eventos);

    return {
      sucesso: true,
      eventos: eventos,
      eventosPorMes: eventosPorMes
    };

  } catch (error) {
    return {
      sucesso: false,
      erro: error.toString()
    };
  }
}