// ================================================
// SHARED.JS - Scripts compartilhados ECC
// ================================================
// Versão: 3.0.0
// Funcionalidades:
//   - Gerenciamento do loading spinner
//   - Banner LGPD para cookies/analytics
//   - Google Analytics condicional
// ================================================

(function () {
  'use strict';

  // ========== CONSTANTES ==========
  const LGPD_CONSENT_KEY = 'ecc_lgpd_consent';
  const GA_TRACKING_ID = 'G-5VFSZQS0H8';
  const LOADING_TIMEOUT_MS = 10000;

  // ========== LOADING SPINNER ==========

  /**
   * Inicializa o loading spinner com timeout de segurança
   * @param {string} iframeId - ID do iframe (default: 'appFrame')
   */
  function initLoading(iframeId) {
    const iframe = document.getElementById(iframeId || 'appFrame');
    const loading = document.getElementById('loading');

    if (!iframe || !loading) return;

    // Remover loading quando iframe carregar
    iframe.addEventListener('load', function () {
      console.log('✅ Aplicação carregada com sucesso!');
      setTimeout(function () {
        loading.classList.add('hide');
      }, 500);
    });

    // Timeout de segurança
    setTimeout(function () {
      if (!loading.classList.contains('hide')) {
        console.warn('⚠️ Loading removido por timeout');
        loading.classList.add('hide');
      }
    }, LOADING_TIMEOUT_MS);
  }

  // ========== LGPD / COOKIES ==========

  /**
   * Verifica se o usuário já deu consentimento
   * @returns {string|null} 'accepted', 'rejected', ou null
   */
  function getConsentStatus() {
    try {
      return localStorage.getItem(LGPD_CONSENT_KEY);
    } catch (e) {
      // localStorage indisponível (navegação privada, etc.)
      return null;
    }
  }

  /**
   * Salva o consentimento do usuário
   * @param {string} status - 'accepted' ou 'rejected'
   */
  function setConsentStatus(status) {
    try {
      localStorage.setItem(LGPD_CONSENT_KEY, status);
    } catch (e) {
      // Ignora se localStorage indisponível
    }
  }

  /**
   * Carrega o Google Analytics (somente se consentido)
   */
  function loadGoogleAnalytics() {
    if (document.querySelector('script[src*="googletagmanager"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_TRACKING_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID);

    console.log('📊 Google Analytics carregado');
  }

  /**
   * Remove cookies do Google Analytics
   */
  function removeAnalyticsCookies() {
    const cookiesToRemove = ['_ga', '_gid', '_gat'];
    const domain = '.' + window.location.hostname;

    cookiesToRemove.forEach(function (name) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain;
    });
  }

  /**
   * Aceita cookies - carrega Analytics e esconde banner
   */
  function acceptCookies() {
    setConsentStatus('accepted');
    loadGoogleAnalytics();
    hideBanner();
  }

  /**
   * Rejeita cookies - remove Analytics e esconde banner
   */
  function rejectCookies() {
    setConsentStatus('rejected');
    removeAnalyticsCookies();
    hideBanner();
  }

  /**
   * Esconde o banner LGPD
   */
  function hideBanner() {
    var banner = document.getElementById('lgpdBanner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  /**
   * Mostra o banner LGPD
   */
  function showBanner() {
    var banner = document.getElementById('lgpdBanner');
    if (banner) {
      banner.classList.add('show');
    }
  }

  /**
   * Inicializa o sistema LGPD
   * - Se já consentiu: carrega Analytics
   * - Se rejeitou: não faz nada
   * - Se não decidiu: mostra banner
   */
  function initLGPD() {
    var consent = getConsentStatus();

    if (consent === 'accepted') {
      loadGoogleAnalytics();
    } else if (consent === null) {
      // Primeiro acesso - mostrar banner com pequeno delay
      setTimeout(showBanner, 1000);
    }
    // Se 'rejected', não faz nada
  }

  // ========== INICIALIZAÇÃO ==========

  /**
   * Inicializa todos os componentes compartilhados
   * Chamado automaticamente no DOMContentLoaded
   */
  function init() {
    initLoading();
    initLGPD();

    // Bind dos botões LGPD
    var btnAccept = document.getElementById('lgpdAccept');
    var btnReject = document.getElementById('lgpdReject');

    if (btnAccept) btnAccept.addEventListener('click', acceptCookies);
    if (btnReject) btnReject.addEventListener('click', rejectCookies);
  }

  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expor funções globais (para uso inline se necessário)
  window.ECC = {
    acceptCookies: acceptCookies,
    rejectCookies: rejectCookies,
    initLoading: initLoading
  };

})();
