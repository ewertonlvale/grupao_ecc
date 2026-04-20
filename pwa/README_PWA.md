# Catálogo da Comunidade — PWA

Transformação do catálogo em **app instalável** (Progressive Web App).
Não precisa de Play Store nem App Store, não precisa pagar taxa de
desenvolvedor, e reaproveita 100% do HTML já feito.

## O que é uma PWA, em 1 parágrafo

É um site que o usuário pode "instalar" na tela inicial do celular. Depois
de instalado, abre em tela cheia (sem barra do navegador), tem ícone próprio,
funciona offline (em partes) e, no iOS/Android modernos, é indistinguível
visualmente de um app nativo — só que vive no seu próprio domínio.

## Conteúdo desta pasta

| Arquivo                 | Para que serve |
|-------------------------|----------------|
| `site_catalogo.html`    | Shell principal do app (substitui o `site_catalogo.html` atual) |
| `manifest.json`         | Manifesto da PWA — define nome, ícones, cor do tema |
| `sw.js`                 | Service Worker — cache do app shell + offline resiliente |
| `icon-192.png`          | Ícone 192×192 (Android, install prompt) |
| `icon-512.png`          | Ícone 512×512 (splash screen Android, stores) |
| `icon-512-maskable.png` | Variante "adaptive" do Android com *safe zone* |
| `apple-touch-icon.png`  | Ícone iOS 180×180 (tela inicial do iPhone/iPad) |
| `favicon.png`           | Favicon 64×64 da aba do navegador |
| `gerar_icones.py`       | Script Python que gera todos os ícones (para regerar no futuro) |

## Como publicar

### 1. Suba todos os arquivos para a raiz da hospedagem

Copie o conteúdo desta pasta para a **mesma pasta** onde hoje está o seu
`site_catalogo.html` original. Estrutura final no servidor:

```
/  (raiz do site)
├── index.html              (seu menu principal, já existe)
├── site_catalogo.html      (SUBSTITUÍDO pela versão desta pasta)
├── manifest.json           (novo)
├── sw.js                   (novo)
├── icon-192.png            (novo)
├── icon-512.png            (novo)
├── icon-512-maskable.png   (novo)
├── apple-touch-icon.png    (novo)
└── favicon.png             (novo ou substitui o atual)
```

**Atenção ao escopo:** o Service Worker só consegue controlar arquivos
que estão no **mesmo diretório ou subdiretório** dele. Se você quiser que
outras páginas (cadastro, calendário) também virem PWAs no futuro, o `sw.js`
precisa ficar na raiz do site.

### 2. Certifique-se de estar em HTTPS

PWAs **exigem HTTPS** (exceto em `localhost` para testes). Quase toda
hospedagem moderna já entrega HTTPS automaticamente — se a sua não entrega,
use Cloudflare na frente como CDN gratuito.

### 3. Publique a nova versão do Apps Script (se ainda não fez)

O iframe do app continua apontando para o Web App. Garanta que a URL dentro
do `site_catalogo.html` (linha do `<iframe src=...>`) está apontando para a
versão v2 do Apps Script (3 modelos).

### 4. Teste antes de divulgar

**Desktop (Chrome ou Edge):**
1. Abra `https://seusite/site_catalogo.html`
2. Barra de URL → clique no ícone "Instalar" (📲 do lado direito)
3. O app abre em janela separada, com ícone próprio no taskbar

**Android (Chrome):**
1. Abra a URL no Chrome
2. Depois de 3 segundos, aparece o banner "Instalar na tela inicial"
3. Ou: menu de 3 pontinhos → "Instalar app"
4. Ícone aparece na tela inicial; ao abrir, roda em tela cheia

**iOS (Safari — Chrome não aceita no iOS):**
1. Abra a URL no **Safari** (obrigatoriamente)
2. Toque no botão de compartilhar (quadrado com seta ↑)
3. Role para baixo → "Adicionar à Tela de Início"
4. Ícone aparece na tela inicial; ao abrir, roda em tela cheia

> O iOS não suporta o banner automático de instalação — os usuários precisam
> saber que têm que usar o botão de compartilhar. Vale colocar uma dica no
> `index.html` explicando isso.

### 5. Validação técnica (opcional, para conferir)

No Chrome:
1. Abra a página
2. F12 → aba **Application** → **Manifest** (deve listar seus ícones e cores)
3. Aba **Service Workers** (deve mostrar `sw.js` ativado)
4. Aba **Lighthouse** → rodar auditoria *Progressive Web App* → nota 100/100

## Atualizações no futuro

Quando você mudar código HTML/CSS/JS e quiser que usuários já instalados
recebam a nova versão:

1. Edite o arquivo `sw.js` e **incremente a constante `VERSION`**:
   ```js
   const VERSION = 'v1.0.1';  // era v1.0.0
   ```
2. Suba o novo `sw.js` + os arquivos alterados.
3. Na próxima vez que o usuário abrir o app, o novo SW é detectado, instala
   em background, e substitui o antigo na recarga seguinte.

Sem incrementar `VERSION`, o browser pode continuar servindo a versão antiga
do cache por horas ou dias.

## Limitações conhecidas

- **Notificações push**: não implementadas nesta versão. Requer backend para
  envio (Firebase Cloud Messaging ou similar) — é um projeto à parte.
- **Offline completo**: o iframe carrega do Apps Script, que **exige
  internet**. O shell do app (botões, ícones) abre offline, mas o conteúdo
  do catálogo não. Isso é fundamental da arquitetura iframe + Apps Script.
- **iOS + banner automático**: o iOS não expõe a API `beforeinstallprompt`,
  então o banner "Instalar" só aparece em Android/desktop. Usuários de iPhone
  precisam usar o compartilhar manualmente.
- **Analytics dentro do PWA standalone**: quando o usuário abre pela tela
  inicial, o GA conta como sessão separada do site na web. Se quiser
  diferenciar no relatório, adicione um parâmetro `?source=pwa` no
  `start_url` do manifest e filtre por ele.

## Regenerar os ícones

Se quiser mudar a identidade visual (cor, letra, símbolo), edite o script:

```bash
cd pwa/
python3 gerar_icones.py
```

Isso gera todos os 5 PNGs de uma vez. Depois, suba os novos arquivos pro
servidor e incremente a `VERSION` no `sw.js` (senão o cache antigo continua
mostrando o ícone velho).

## Quando faz sentido ir para app nativo?

Só considere migrar para React Native / Flutter se aparecer uma das
necessidades abaixo:

- Notificações push nativas (iOS especialmente — apesar de 16.4+ aceitar via
  PWA, suporte ainda é inconsistente);
- Acesso a hardware sensível (GPS contínuo em background, câmera com
  processamento, Bluetooth, NFC);
- Distribuição via Play Store/App Store como selo de confiança para um
  público mais amplo;
- Integração profunda com o sistema operacional (widgets, atalhos Siri,
  compartilhamento nativo como destino).

Para o caso do catálogo paroquial, **nenhum desses aplica** — a PWA deve
servir bem por muito tempo.
