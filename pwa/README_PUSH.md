# Push Notifications para o Catálogo PWA

Implementação de notificações push usando **OneSignal** como provedor.
Suporta Android, desktop (Chrome/Edge/Firefox) e iOS 16.4+.

## Por que OneSignal e não VAPID direto?

Push notifications "cruas" (Web Push Protocol + VAPID) exigem assinar
tokens JWT com ECDSA P-256 (ES256) e criptografar payloads com AES-GCM
+ ECDH. O Apps Script não tem uma biblioteca oficial para isso, e
implementar na mão é frágil.

OneSignal resolve isso: eles são o relay entre você e os serviços de
push (FCM do Google, APNs da Apple, Mozilla push). Você dispara uma
chamada REST simples com API Key, e o OneSignal entrega em todos os
dispositivos.

**Plano free**: ilimitado para web push até 10.000 inscritos. Suficiente
para uma paróquia por muito tempo.

## Arquivos desta pasta

| Arquivo             | O que é |
|---------------------|---------|
| `site_catalogo.html`| Versão da shell PWA com OneSignal SDK v16 integrado |
| `sw.js`             | Service Worker que importa o SW do OneSignal + mantém cache da shell |
| `push_service.gs`   | Wrapper Apps Script para disparar notificações do backend |
| `README_PUSH.md`    | Este arquivo |

Os ícones (`icon-192.png`, `icon-512.png`, etc.) **continuam sendo
reaproveitados** da pasta `/pwa/` — não duplique. Na hora de subir pra
hospedagem, os arquivos desta pasta vão pra mesma raiz.

---

## Passo a passo: do zero ao primeiro push

### 1. Criar conta no OneSignal

- Acesse https://onesignal.com e crie conta (free).
- New App/Website → escolha **Web** como plataforma.
- Nome da app: `Catálogo Comunidade ECC`.
- Site URL: `https://eccparoquianscaparecida.com.br`
  (ou seu domínio real — precisa ser HTTPS).
- Default Icon URL: `https://eccparoquianscaparecida.com.br/icon-192.png`
  (opcional, mas recomendado).
- **Site Setup**: escolha "**Typical Site**" (não é WordPress/Shopify).

### 2. Copiar as credenciais

No painel do app, vá em **Settings → Keys & IDs** e copie:

- **OneSignal App ID** — identificador público, vai no HTML.
- **REST API Key** — SECRETA, só vai no Apps Script (nunca no HTML).

### 3. Configurar o HTML

Abra `site_catalogo.html` (deste pasta) e localize:

```js
window.ONESIGNAL_APP_ID = 'COLE-AQUI-O-APP-ID-DO-ONESIGNAL';
```

Substitua pelo App ID copiado no passo 2. Salve.

### 4. Subir pra hospedagem

Copie para a raiz do site (mesma pasta do `index.html`), **substituindo**
os antigos:

```
/
├── site_catalogo.html   (esta versão, COM OneSignal)
├── sw.js                (esta versão, COM OneSignal)
├── manifest.json        (mantém o da pasta /pwa/)
├── icon-192.png
├── icon-512.png
├── icon-512-maskable.png
├── apple-touch-icon.png
└── favicon.png
```

> **Importante**: o `sw.js` tem que estar na **raiz**, não em uma
> subpasta, senão o OneSignal recusa.

### 5. Configurar o Apps Script

No editor do seu projeto Apps Script:

1. Crie (ou cole) o arquivo `push_service.gs` deste pacote.
2. **Project Settings** (ícone ⚙) → role até **Script Properties**.
3. Adicione duas propriedades:
   - `ONESIGNAL_APP_ID` = (o App ID)
   - `ONESIGNAL_REST_API_KEY` = (a REST API Key — SECRETA)
4. Salve.

### 6. Primeiro teste

**Pelo painel OneSignal (mais simples):**
1. Abra o `site_catalogo.html` no Chrome desktop ou Android.
2. Após ~8 segundos, o prompt "Quer receber avisos?" aparece.
3. Aceite. Agora você é um inscrito.
4. Volte no OneSignal → **Messages → New Push**.
5. Título: "Oi!" / Mensagem: "Primeiro teste".
6. Audience: **Subscribed Users**.
7. Send → deve chegar em segundos.

**Pelo Apps Script:**
1. No editor do Apps Script, abra `push_service.gs`.
2. No seletor de função, escolha `enviar_TESTE`.
3. Clique ▶ (Run). Autorize permissões na primeira vez.
4. Veja logs (Execution log) — deve mostrar `recipients: 1` (ou quantos).

---

## iOS: a pegadinha

Safari só aceita push **se o PWA estiver instalado na tela inicial**
(iOS 16.4+). O fluxo é:

1. Usuário abre o site no **Safari** (não Chrome).
2. Botão compartilhar ↑ → "Adicionar à Tela de Início".
3. Abre pelo ícone na home screen (modo standalone).
4. Agora sim, o prompt de push aparece e funciona.

No Android não tem essa restrição — push funciona direto no Chrome.

**Recomendação**: depois que o app estiver rodando, coloque uma nota no
`index.html` explicando o fluxo para usuários de iPhone.

---

## Como disparar notificações no dia a dia

### Opção A — Painel web (não-técnicos)

Qualquer pessoa da equipe pode entrar em https://onesignal.com, ir em
**Messages → New Push** e enviar. É o jeito mais simples para avisos
ocasionais.

Vantagens:
- Sem código.
- Pré-visualização antes de enviar.
- Agendamento nativo (enviar daqui a 2h, toda terça, etc).
- Relatório de cliques/visualizações por campanha.

### Opção B — Apps Script programático

Use quando quiser disparar automaticamente (ex: novo comércio cadastrado,
resumo semanal automatizado).

```javascript
// Chamar de qualquer lugar do projeto:
enviarPushParaTodos({
  titulo: '🆕 Novo na comunidade',
  mensagem: 'Padaria São José entrou no catálogo',
  url: 'https://eccparoquianscaparecida.com.br/site_catalogo.html'
});
```

Para agendar um resumo semanal automático:
- Apps Script editor → ⏰ Triggers → Add Trigger.
- Function: `resumoSemanal` (já definida no `push_service.gs`).
- Event source: Time-driven → Week timer → Monday 9am.

### Opção C — Segmentação por tag

O `site_catalogo.html` já aplica a tag `origem=catalogo_pwa` em cada
inscrito. Você pode adicionar mais tags dinamicamente (cidade, bairro,
interesses) via `OneSignal.User.addTag(...)` e depois segmentar pelo
painel ou pelo `enviarPushComFiltros()` do `push_service.gs`.

Exemplo — só inscritos da cidade X:

```javascript
enviarPushComFiltros({
  titulo: 'Missa especial em Tupã',
  mensagem: 'Sábado 19h na Matriz',
  filtros: [
    { field: 'tag', key: 'cidade', relation: '=', value: 'Tupã' }
  ]
});
```

---

## Boas práticas

- **Frequência**: não mande mais que 2-3 pushes por semana. Taxa de
  desinscrição sobe rápido acima disso.
- **Janela horária**: evite antes de 9h e depois de 21h.
- **Assunto útil**: "Novo comércio", "Nova promoção", "Evento amanhã".
  Nada de push vazio tipo "Confira nosso app!".
- **Deep links**: sempre aponte `url` para a página específica relevante,
  não sempre a home.
- **A/B testing**: o painel OneSignal permite variantes do mesmo push.
  Útil para títulos que fazem mais clicar.

---

## Troubleshooting

**"O prompt não aparece"**
- Só aparece em HTTPS ou localhost.
- Já negou uma vez? Chrome bloqueia por 7 dias — teste em aba anônima
  ou reset em `chrome://settings/content/notifications`.
- Esperou os 8 segundos configurados?
- O App ID no HTML está correto?

**"Registra no painel mas não chega push"**
- Teste em outro navegador/dispositivo primeiro.
- Verifique em **Messages → Delivery** do OneSignal — mostra erros por
  dispositivo (ex: "FCM returned 404" = inscrição velha).
- Service Worker pode estar em conflito. Em Chrome DevTools →
  Application → Service Workers → Unregister e recarregue.

**"iOS não aceita"**
- iOS precisa do PWA **instalado** (não basta abrir no Safari).
- Versão do iOS precisa ser 16.4+.
- Depois de instalado, o prompt aparece na primeira visita dentro do
  app standalone.

**"Apps Script retorna 401/403"**
- REST API Key errada ou em Script Properties errado.
- Está usando a `User Auth Key` em vez da `REST API Key`? Troque —
  são coisas diferentes.

---

## Custos esperados

- **OneSignal Free**: até 10.000 subscribers web push — ilimitado.
- **Acima disso**: plano Growth ~$9/mês (30k subs).
- **Apps Script**: cota de `UrlFetchApp` é 20.000 calls/dia — mais que
  suficiente para push da paróquia.

## O que NÃO fazer

- ❌ Nunca subir a **REST API Key** para GitHub ou colocar no HTML.
  Ela permite disparar push em nome do seu app.
- ❌ Nunca mandar push com conteúdo pessoal/sensível de paroquianos.
  A mensagem fica visível na tela de bloqueio.
- ❌ Não duplique o registro do Service Worker — OneSignal já registra
  o `sw.js` no `init()`. Não faça `navigator.serviceWorker.register()`
  manualmente, ou haverá conflito e o push falha silenciosamente.
