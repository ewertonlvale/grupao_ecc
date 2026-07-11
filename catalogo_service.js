// ================================================
// CATALOGO.GS - CATÁLOGO DE SERVIÇOS E COMÉRCIOS
// ================================================
// Versão: 2.0.0
//
// Taxonomia em 3 modelos Odoo:
//   - x_grupo_catalogo      (10 grupos)
//   - x_categoria_catalogo  (~80 categorias, Many2one → grupo)
//   - x_catalogo            (os negócios, Many2one → categoria)
//
// DEPENDÊNCIAS:
//   - Config.gs       (ODOO_MODELS, log)
//   - odoo_service.gs (odooSearchRead, odooCreate)
// ================================================

// ================================================
// SEED DA TAXONOMIA
// ================================================
// Usado APENAS na primeira implantação por seedCatalogoTaxonomia().
// Depois do seed, a fonte de verdade é o Odoo.
// ================================================

const CATALOGO_TAXONOMIA_SEED = [
  { grupo: 'Construção & Reforma', icone: '🔨', cor: '#C8963E', ordem: 1, categorias: [
    { nome: 'Construção',       icone: '🧱' },
    { nome: 'Elétrica',         icone: '⚡' },
    { nome: 'Encanamento',      icone: '🚰' },
    { nome: 'Pintura',          icone: '🎨' },
    { nome: 'Marcenaria',       icone: '🪵' },
    { nome: 'Serralheria',      icone: '🔩' },
    { nome: 'Gesso / Drywall',  icone: '🏗️' },
    { nome: 'Vidraçaria',       icone: '🪟' },
    { nome: 'Jardinagem',       icone: '🌱' },
    { nome: 'Dedetização',      icone: '🐜' }
  ]},
  { grupo: 'Alimentação', icone: '🍽️', cor: '#C8963E', ordem: 2, categorias: [
    { nome: 'Marmitex / Comida caseira', icone: '🍱' },
    { nome: 'Doces e bolos',             icone: '🍰' },
    { nome: 'Confeitaria para festas',   icone: '🎂' },
    { nome: 'Salgados',                  icone: '🥟' },
    { nome: 'Padaria / Quitanda',        icone: '🥖' },
    { nome: 'Delivery',                  icone: '🛵' },
    { nome: 'Buffet',                    icone: '🍽️' },
    { nome: 'Bebidas',                   icone: '🥤' }
  ]},
  { grupo: 'Beleza & Estética', icone: '💇', cor: '#E8C87A', ordem: 3, categorias: [
    { nome: 'Cabeleireiro',             icone: '💇' },
    { nome: 'Barbearia',                icone: '💈' },
    { nome: 'Manicure / Pedicure',      icone: '💅' },
    { nome: 'Design de sobrancelhas',   icone: '👁️' },
    { nome: 'Maquiagem',                icone: '💄' },
    { nome: 'Depilação',                icone: '✨' },
    { nome: 'Estética facial/corporal', icone: '🧴' }
  ]},
  { grupo: 'Saúde & Bem-estar', icone: '🏥', cor: '#3D5289', ordem: 4, categorias: [
    { nome: 'Fisioterapia',          icone: '🩺' },
    { nome: 'Nutrição',              icone: '🥗' },
    { nome: 'Psicologia',            icone: '🧠' },
    { nome: 'Enfermagem',            icone: '💉' },
    { nome: 'Cuidador(a) de idosos', icone: '🧓' },
    { nome: 'Massoterapia',          icone: '💆' },
    { nome: 'Personal trainer',      icone: '💪' },
    { nome: 'Odontologia',           icone: '🦷' }
  ]},
  { grupo: 'Casa, Pet & Limpeza', icone: '🏠', cor: '#2C3E6B', ordem: 5, categorias: [
    { nome: 'Diarista',             icone: '🧹' },
    { nome: 'Lavanderia',           icone: '🧺' },
    { nome: 'Lavagem de estofados', icone: '🛋️' },
    { nome: 'Passadoria',           icone: '👔' },
    { nome: 'Costura / Reparos',    icone: '🪡' },
    { nome: 'Banho e tosa',         icone: '🐶' },
    { nome: 'Pet sitter',           icone: '🐾' },
    { nome: 'Adestramento',         icone: '🦮' }
  ]},
  { grupo: 'Educação & Cultura', icone: '📚', cor: '#1B2A4A', ordem: 6, categorias: [
    { nome: 'Aulas particulares',             icone: '📖' },
    { nome: 'Idiomas',                        icone: '🌐' },
    { nome: 'Música',                         icone: '🎵' },
    { nome: 'Dança',                          icone: '💃' },
    { nome: 'Cursos livres',                  icone: '🎓' },
    { nome: 'Catequese / Formação religiosa', icone: '✝️' }
  ]},
  { grupo: 'Eventos & Celebrações', icone: '🎉', cor: '#C8963E', ordem: 7, categorias: [
    { nome: 'Fotografia de eventos',   icone: '📸' },
    { nome: 'Vídeo',                   icone: '🎥' },
    { nome: 'DJ / Som',                icone: '🎧' },
    { nome: 'Decoração de festas',     icone: '🎈' },
    { nome: 'Aluguel de trajes',       icone: '👗' },
    { nome: 'Brinquedos / Animação',   icone: '🎪' },
    { nome: 'Convites',                icone: '💌' }
  ]},
  { grupo: 'Profissional, Técnico & Digital', icone: '💼', cor: '#1B2A4A', ordem: 8, categorias: [
    { nome: 'Contabilidade',              icone: '📊' },
    { nome: 'Advocacia',                  icone: '⚖️' },
    { nome: 'Arquitetura / Engenharia',   icone: '📐' },
    { nome: 'Corretor de imóveis',        icone: '🏡' },
    { nome: 'Design / Identidade visual', icone: '🖌️' },
    { nome: 'Informática / Suporte',      icone: '💻' },
    { nome: 'Desenvolvimento web',        icone: '🌐' },
    { nome: 'Redes sociais',              icone: '📱' }
  ]},
  { grupo: 'Automotivo & Transporte', icone: '🚗', cor: '#2C3E6B', ordem: 9, categorias: [
    { nome: 'Mecânica',                icone: '🔧' },
    { nome: 'Auto elétrica',           icone: '🔋' },
    { nome: 'Funilaria / Pintura',     icone: '🛠️' },
    { nome: 'Lava-jato',               icone: '🧽' },
    { nome: 'Estética automotiva',     icone: '✨' },
    { nome: 'Frete / Mudança',         icone: '🚚' },
    { nome: 'Motorista de aplicativo', icone: '🚕' },
    { nome: 'Entregas',                icone: '📦' },
    { nome: 'Transporte escolar',      icone: '🚌' }
  ]},
  { grupo: 'Comércio Variado', icone: '🛍️', cor: '#C8963E', ordem: 10, categorias: [
    { nome: 'Moda / Roupas',         icone: '👕' },
    { nome: 'Cosméticos',            icone: '💄' },
    { nome: 'Semi-joias / Bijuteria',icone: '💎' },
    { nome: 'Artesanato',            icone: '🎨' },
    { nome: 'Papelaria',             icone: '📎' },
    { nome: 'Variedades',            icone: '🛒' },
    { nome: 'Sacolão / Feira',       icone: '🥬' }
  ]}
];

// ================================================
// CACHE HELPERS
// ================================================

const _CATALOGO_CACHE_TTL = 300; // 5 minutos

function _cacheGet(chave) {
  try {
    var raw = CacheService.getScriptCache().get(chave);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function _cachePut(chave, valor, ttlSegundos) {
  try {
    var s = JSON.stringify(valor);
    if (s.length > 100000) return; // limite do CacheService por entrada
    CacheService.getScriptCache().put(chave, s, ttlSegundos || _CATALOGO_CACHE_TTL);
  } catch (e) { /* silenciar */ }
}

/**
 * [EXPOSTO AO FRONTEND / ADMIN]
 * Limpa o cache da taxonomia. Chame depois de editar grupos/categorias no Odoo.
 */
function invalidarCacheCatalogo() {
  try {
    CacheService.getScriptCache().removeAll([
      'catalogo_grupos_v2',
      'catalogo_categorias_v2'
    ]);
    log('♻️ Cache do catálogo invalidado');
    return { sucesso: true };
  } catch (e) {
    log('❌ Erro ao invalidar cache: ' + e.toString(), 'error');
    return { sucesso: false, erro: e.toString() };
  }
}

// ================================================
// HELPERS DE FORMATAÇÃO
// ================================================

function _parseTags(raw) {
  if (!raw) return [];
  return String(raw).split(',')
    .map(function (t) { return t.trim(); })
    .filter(function (t) { return t.length > 0; });
}

function _normalizarTelefone(raw) {
  if (!raw) return '';
  var digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  return digits;
}

function _normalizarInstagram(raw) {
  if (!raw) return '';
  var v = String(raw).trim();
  v = v.replace(/^@/, '');
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  v = v.replace(/\/$/, '');
  return v;
}

function _many2oneId(v)   { return Array.isArray(v) ? v[0] : null; }
function _many2oneNome(v) { return Array.isArray(v) ? v[1] : ''; }

// ================================================
// MAPEADORES
// ================================================

function _mapGrupoRecord(r) {
  return {
    id: r.id,
    nome: r.x_name || '',
    icone: r.x_studio_icone || '',
    cor: r.x_studio_cor || '',
    descricao: r.x_studio_descricao || '',
    ordem: r.x_studio_ordem || 0,
    ativo: !!r.x_active
  };
}

function _mapCategoriaRecord(r) {
  return {
    id: r.id,
    nome: r.x_name || '',
    icone: r.x_studio_icone || '',
    grupoId: _many2oneId(r.x_studio_grupo_id),
    grupoNome: _many2oneNome(r.x_studio_grupo_id),
    ordem: r.x_studio_ordem || 0,
    ativo: !!r.x_active
  };
}

/**
 * Mapeia um registro cru de x_catalogo para o formato consumido pelo frontend.
 * @param {Object} r        - registro do Odoo
 * @param {Object} catIndex - índice {nomeCategoria: categoriaObj} (para resolver grupo)
 */
function _mapCatalogoRecord(r, catIndex) {
  var catId = _many2oneId(r.x_studio_categoria_id);
  var catNome = _many2oneNome(r.x_studio_categoria_id);
  var catInfo = (catIndex && catNome) ? catIndex[catNome] : null;

  return {
    id: r.id,
    nome: r.x_name || 'Sem nome',
    responsavel: r.x_studio_responsavel || '',
    tipo: (r.x_studio_tipo || '').toLowerCase(),       // 'comercio' | 'servico'
    categoriaId: catId,
    categoria: catNome,
    categoriaIcone: catInfo ? catInfo.icone : '',
    grupoId: catInfo ? catInfo.grupoId : null,
    grupo: catInfo ? catInfo.grupoNome : '',
    descricao: r.x_studio_descricao || '',
    tags: _parseTags(r.x_studio_tags),
    fotoUrl: r.x_studio_foto_url || '',
    emoji: r.x_studio_emoji || (catInfo && catInfo.icone) || '🏠',
    whatsapp: _normalizarTelefone(r.x_studio_whatsapp),
    telefone: _normalizarTelefone(r.x_studio_telefone),
    instagram: _normalizarInstagram(r.x_studio_instagram),
    destaque: !!r.x_studio_destaque,
    ordem: r.x_studio_ordem || 0
  };
}

// ================================================
// LEITURA: GRUPOS E CATEGORIAS
// ================================================

/**
 * Busca grupos ativos do catálogo (com cache).
 * @returns {Array<{id,nome,icone,cor,ordem,ativo}>}
 */
function buscarGruposCatalogo() {
  var cached = _cacheGet('catalogo_grupos_v2');
  if (cached) return cached;

  var grupos = odooSearchRead(
    ODOO_MODELS.CATALOGO_GRUPO,
    ['id', 'x_name', 'x_studio_icone', 'x_studio_cor',
     'x_studio_descricao', 'x_studio_ordem', 'x_active'],
    [['x_active', '=', true]],
    { order: 'x_studio_ordem asc, x_name asc', limit: 100 }
  ).map(_mapGrupoRecord);

  _cachePut('catalogo_grupos_v2', grupos);
  return grupos;
}

/**
 * Busca categorias ativas do catálogo (com cache).
 * @returns {Array<{id,nome,icone,grupoId,grupoNome,ordem,ativo}>}
 */
function buscarCategoriasCatalogo() {
  var cached = _cacheGet('catalogo_categorias_v2');
  if (cached) return cached;

  var categorias = odooSearchRead(
    ODOO_MODELS.CATALOGO_CATEGORIA,
    ['id', 'x_name', 'x_studio_icone', 'x_studio_grupo_id',
     'x_studio_ordem', 'x_active'],
    [['x_active', '=', true]],
    { order: 'x_studio_ordem asc, x_name asc', limit: 500 }
  ).map(_mapCategoriaRecord);

  _cachePut('catalogo_categorias_v2', categorias);
  return categorias;
}

// ================================================
// LEITURA: CATÁLOGO (NEGÓCIOS)
// ================================================

/**
 * Busca registros crus de x_catalogo do Odoo (sem mapping).
 * @param {Object} [opts] { apenasDestaques, tipo, categoriaId }
 */
function _buscarCatalogoRaw(opts) {
  opts = opts || {};
  var domain = [['x_studio_publicado', '=', true]];
  if (opts.apenasDestaques) domain.push(['x_studio_destaque', '=', true]);
  if (opts.tipo)            domain.push(['x_studio_tipo', '=', opts.tipo]);
  if (opts.categoriaId)     domain.push(['x_studio_categoria_id', '=', opts.categoriaId]);

  return odooSearchRead(
    ODOO_MODELS.CATALOGO,
    [
      'id', 'x_name', 'x_studio_responsavel',
      'x_studio_tipo', 'x_studio_categoria_id',
      'x_studio_descricao', 'x_studio_tags',
      'x_studio_foto_url', 'x_studio_emoji',
      'x_studio_whatsapp', 'x_studio_telefone', 'x_studio_instagram',
      'x_studio_destaque', 'x_studio_ordem'
    ],
    domain,
    { order: 'x_studio_ordem asc, x_name asc', limit: 500 }
  );
}

// ================================================
// ENDPOINTS EXPOSTOS AO FRONTEND
// ================================================

/**
 * [EXPOSTO] Retorna tudo que a página de catálogo precisa em UMA chamada.
 *
 * Contrato:
 * {
 *   sucesso: true,
 *   itens: [{ id, nome, responsavel, tipo, categoria, grupo, tags[], ... }],
 *   destaques: [...],
 *   total: N,
 *   grupos: [{ id, nome, icone, cor, ordem }],
 *   categorias: [{ id, nome, icone, grupoId, grupoNome, ordem }],
 *   categoriasPorGrupo: { 'Construção & Reforma': ['Construção', 'Elétrica', ...], ... }
 * }
 */
function obterCatalogoCompleto() {
  try {
    log('📚 Carregando catálogo completo (v2)...');

    var grupos     = buscarGruposCatalogo();
    var categorias = buscarCategoriasCatalogo();

    // Se a taxonomia não foi populada, avisa mas ainda retorna o que dá
    if (grupos.length === 0 || categorias.length === 0) {
      log('⚠️ Taxonomia vazia. Execute seedCatalogoTaxonomia() no editor.', 'warn');
    }

    // Index para resolver grupo em cada item
    var catByNome = {};
    categorias.forEach(function (c) { catByNome[c.nome] = c; });

    // Itens do catálogo
    var itensCrus = _buscarCatalogoRaw();
    var itens = itensCrus.map(function (r) { return _mapCatalogoRecord(r, catByNome); });

    // Destaques: flag no Odoo; se não houver nenhum, pega os 4 primeiros
    var destaques = itens.filter(function (i) { return i.destaque; });
    if (destaques.length === 0) destaques = itens.slice(0, 4);

    // Estrutura agrupada para o <optgroup> do frontend
    var categoriasPorGrupo = {};
    grupos.forEach(function (g) {
      categoriasPorGrupo[g.nome] = categorias
        .filter(function (c) { return c.grupoId === g.id; })
        .sort(function (a, b) { return (a.ordem || 0) - (b.ordem || 0); })
        .map(function (c) { return c.nome; });
    });

    log('✅ Catálogo carregado', 'info', {
      itens: itens.length,
      destaques: destaques.length,
      grupos: grupos.length,
      categorias: categorias.length
    });

    return {
      sucesso: true,
      itens: itens,
      destaques: destaques,
      total: itens.length,
      grupos: grupos,
      categorias: categorias,
      categoriasPorGrupo: categoriasPorGrupo
    };

  } catch (error) {
    log('❌ Erro em obterCatalogoCompleto: ' + error.toString(), 'error');
    return {
      sucesso: false,
      erro: error.toString(),
      itens: [], destaques: [], total: 0,
      grupos: [], categorias: [], categoriasPorGrupo: {}
    };
  }
}

/**
 * [EXPOSTO] Retorna apenas os destaques (carrossel).
 */
function obterDestaquesCatalogo() {
  try {
    var categorias = buscarCategoriasCatalogo();
    var catByNome = {};
    categorias.forEach(function (c) { catByNome[c.nome] = c; });

    var destaques = _buscarCatalogoRaw({ apenasDestaques: true })
      .map(function (r) { return _mapCatalogoRecord(r, catByNome); });

    return { sucesso: true, destaques: destaques };
  } catch (error) {
    log('❌ Erro em obterDestaquesCatalogo: ' + error.toString(), 'error');
    return { sucesso: false, erro: error.toString(), destaques: [] };
  }
}

/**
 * [EXPOSTO] Só grupos + categorias (útil para dropdowns em outras páginas).
 */
function obterTaxonomiaCatalogo() {
  try {
    return {
      sucesso: true,
      grupos: buscarGruposCatalogo(),
      categorias: buscarCategoriasCatalogo()
    };
  } catch (error) {
    return { sucesso: false, erro: error.toString(), grupos: [], categorias: [] };
  }
}

// ================================================
// SEED (executar UMA vez no editor do Apps Script)
// ================================================

/**
 * Popula x_grupo_catalogo e x_categoria_catalogo com a taxonomia inicial.
 * É idempotente: se já existirem grupos, aborta.
 * Use seedCatalogoTaxonomia_force() se quiser rodar mesmo assim.
 */
function seedCatalogoTaxonomia() {
  try {
    var existentes = odooSearchRead(
      ODOO_MODELS.CATALOGO_GRUPO, ['id'], [], { limit: 1 }
    );
    if (existentes.length > 0) {
      log('⚠️ Já existem grupos em x_grupo_catalogo. Abortando seed.', 'warn');
      log('💡 Para forçar, use seedCatalogoTaxonomia_force() (pode duplicar!).', 'warn');
      return { sucesso: false, motivo: 'ja_populado' };
    }
    return _executarSeed();
  } catch (error) {
    log('❌ Erro no seed: ' + error.toString(), 'error');
    return { sucesso: false, erro: error.toString() };
  }
}

/** Força o seed mesmo com dados existentes (pode duplicar — use com cuidado). */
function seedCatalogoTaxonomia_force() {
  try {
    return _executarSeed();
  } catch (error) {
    log('❌ Erro no seed (force): ' + error.toString(), 'error');
    return { sucesso: false, erro: error.toString() };
  }
}

function _executarSeed() {
  var gruposCriados = 0;
  var categoriasCriadas = 0;

  CATALOGO_TAXONOMIA_SEED.forEach(function (gData) {
    var grupoId = odooCreate(ODOO_MODELS.CATALOGO_GRUPO, {
      x_name: gData.grupo,
      x_studio_icone: gData.icone || '',
      x_studio_cor: gData.cor || '',
      x_studio_ordem: gData.ordem || 0,
      x_active: true
    });
    gruposCriados++;
    log('✅ Grupo criado: ' + gData.grupo + ' (id=' + grupoId + ')');

    (gData.categorias || []).forEach(function (cData, idx) {
      odooCreate(ODOO_MODELS.CATALOGO_CATEGORIA, {
        x_name: cData.nome,
        x_studio_icone: cData.icone || gData.icone || '',
        x_studio_grupo_id: grupoId,
        x_studio_ordem: idx + 1,
        x_active: true
      });
      categoriasCriadas++;
    });
    log('   → ' + (gData.categorias || []).length + ' categorias criadas');
  });

  invalidarCacheCatalogo();

  log('🌱 Seed concluído', 'info', {
    grupos: gruposCriados,
    categorias: categoriasCriadas
  });

  return { sucesso: true, gruposCriados: gruposCriados, categoriasCriadas: categoriasCriadas };
}

// ================================================
// TESTES (executar no editor do Apps Script)
// ================================================

function teste_Catalogo() {
  Logger.log('🧪 TESTE: Catálogo v2 (3 modelos)');
  try {
    var resultado = obterCatalogoCompleto();
    Logger.log('📊 Sucesso? ' + resultado.sucesso);
    Logger.log('📊 Itens: ' + resultado.total);
    Logger.log('📊 Destaques: ' + resultado.destaques.length);
    Logger.log('📊 Grupos: ' + resultado.grupos.length);
    Logger.log('📊 Categorias: ' + resultado.categorias.length);
    (resultado.grupos || []).forEach(function (g) {
      var cats = resultado.categoriasPorGrupo[g.nome] || [];
      Logger.log('   ' + (g.icone || '') + ' ' + g.nome + ': ' + cats.length + ' cats');
    });
    return resultado;
  } catch (e) {
    Logger.log('❌ ERRO: ' + e.toString());
    return { sucesso: false, erro: e.toString() };
  }
}

function teste_Taxonomia() {
  Logger.log('🧪 TESTE: buscar apenas taxonomia');
  var t = obterTaxonomiaCatalogo();
  Logger.log('📊 Sucesso? ' + t.sucesso);
  Logger.log('📊 Grupos: ' + t.grupos.length);
  Logger.log('📊 Categorias: ' + t.categorias.length);
  return t;
}
