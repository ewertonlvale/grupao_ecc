// ================================================
// CALENDARIO.GS - CALENDÁRIO DE EVENTOS ECC
// ================================================
// Versão: 1.0.0
// Exibe eventos do Odoo (x_calendario) filtrados por publicado
// ================================================

/**
 * Busca eventos publicados do Odoo
 * @returns {Array} Lista de eventos publicados
 */
function buscarEventosPublicados() {
  try {
    Logger.log('📅 Buscando eventos publicados do calendário...');
    
    // Buscar apenas eventos publicados (x_studio_publicado = true)
    const eventos = odooSearchRead(
      'x_calendario',
      ['id', 'x_name', 'x_studio_date', 'x_studio_data_fim', 'x_studio_tipo_de_evento', 'x_studio_publicado'],
      [['x_studio_publicado', '=', true]],
      { order: 'x_studio_date asc', limit: 1000 }
    );
    
    Logger.log(`✅ Eventos encontrados: ${eventos.length}`);
    
    // Processar e organizar eventos por mês
    const eventosProcessados = eventos.map(evento => ({
      id: evento.id,
      nome: evento.x_name || 'Evento sem nome',
      dataInicio: evento.x_studio_date || '',
      dataFim: evento.x_studio_data_fim || '',
      tipo: evento.x_studio_tipo_de_evento || 'Evento',
      publicado: evento.x_studio_publicado
    }));
    
    return eventosProcessados;
    
  } catch (error) {
    Logger.log('❌ Erro ao buscar eventos: ' + error.toString());
    throw error;
  }
}

/**
 * Organiza eventos por mês/ano
 * Para eventos com múltiplos dias, adiciona o evento em cada mês que ele ocorre
 * @param {Array} eventos - Lista de eventos
 * @returns {Object} Eventos organizados por mês
 */
function organizarEventosPorMes(eventos) {
  const eventosPorMes = {};
  
  eventos.forEach(evento => {
    if (!evento.dataInicio) return;
    
    const dataInicio = new Date(evento.dataInicio + 'T00:00:00');
    const dataFim = evento.dataFim ? new Date(evento.dataFim + 'T00:00:00') : new Date(evento.dataInicio + 'T00:00:00');
    
    // Percorrer todos os dias entre dataInicio e dataFim
    const dataAtual = new Date(dataInicio);
    const mesesJaAdicionados = new Set();
    
    while (dataAtual <= dataFim) {
      const mesAno = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;
      
      // Adicionar evento apenas uma vez por mês
      if (!mesesJaAdicionados.has(mesAno)) {
        if (!eventosPorMes[mesAno]) {
          eventosPorMes[mesAno] = [];
        }
        
        eventosPorMes[mesAno].push(evento);
        mesesJaAdicionados.add(mesAno);
      }
      
      // Avançar para o próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  });
  
  return eventosPorMes;
}

/**
 * Renderiza a página do calendário
 * @returns {string} HTML da página
 */
function renderizarCalendario() {
  try {
    const eventos = buscarEventosPublicados();
    const eventosPorMes = organizarEventosPorMes(eventos);
    
    return HtmlService.createTemplateFromFile('calendario_interface')
      .evaluate()
      .setTitle('Calendário ECC')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('❌ Erro ao renderizar calendário: ' + error.toString());
    return HtmlService.createHtmlOutput('<h1>Erro ao carregar calendário</h1><p>' + error.toString() + '</p>');
  }
}

/**
 * Função exposta para buscar eventos via AJAX
 * @returns {Object} Eventos organizados por mês
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