# 🙏 ECC - Sistema Paroquial

**Encontro de Casais com Cristo**  
Paróquia Nossa Senhora da Conceição Aparecida

> *"Voltai para mim e eu voltarei vós"* — Malaquias 3:7

---

## 📋 Sobre o Projeto

Sistema web completo para gestão do ECC (Encontro de Casais com Cristo), oferecendo:

- **Atualização Cadastral** — Formulário para casais atualizarem dados pessoais, sacramentais e de endereço
- **Avaliação do Grupão** — Sistema de avaliação (1-5 estrelas) com prazo de 10 dias após cada encontro
- **Calendário de Eventos** — Visualização mensal de todos os eventos publicados (missas, grupões, encontros, etc.)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   USUÁRIO (Browser)                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         GitHub Pages (Frontend)               │   │
│  │  index.html ─ site_cadastro.html              │   │
│  │  site_avaliar_grupao.html                     │   │
│  │  site_calendario.html                         │   │
│  │  styles/shared.css ─ scripts/shared.js        │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ iframe                             │
│  ┌──────────────▼───────────────────────────────┐   │
│  │       Google Apps Script (Backend)            │   │
│  │  main.gs → config.gs → odoo_service.gs       │   │
│  │  atualizacao_cadastral.gs                     │   │
│  │  avaliacao_grupao.gs ─ calendario.gs          │   │
│  │  google_drive_service.gs                      │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ JSON-RPC                           │
│  ┌──────────────▼───────────────────────────────┐   │
│  │            Odoo (ERP / Banco de Dados)         │   │
│  │  ecc-pnscaparecida.odoo.com                   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada     | Tecnologia                  | Hospedagem         |
|------------|-----------------------------|--------------------|
| Frontend   | HTML, CSS, JavaScript       | GitHub Pages       |
| Backend    | Google Apps Script          | Google Cloud       |
| Banco      | Odoo (JSON-RPC)             | Odoo SaaS          |
| Storage    | Google Drive (fotos)        | Google Cloud       |
| Analytics  | Google Analytics (GA4)      | Google (condicional LGPD) |
| Domínio    | ecc.pnscaparecida.com       | DNS customizado    |

---

## 📂 Estrutura de Arquivos

### Frontend (GitHub Pages)

```
frontend/
├── index.html                  # Menu principal / landing page
├── site_cadastro.html          # Wrapper iframe: Atualização Cadastral
├── site_avaliar_grupao.html    # Wrapper iframe: Avaliação do Grupão
├── site_calendario.html        # Wrapper iframe: Calendário de Eventos
├── styles/
│   └── shared.css              # Estilos compartilhados (loading, botões, LGPD)
├── scripts/
│   └── shared.js               # JS compartilhado (loading, LGPD, GA condicional)
├── logo_ecc.png                # Logo do ECC
└── favicon.png                 # Favicon
```

### Backend (Google Apps Script)

```
backend/
├── config.gs                   # ⭐ Configuração centralizada (PropertiesService)
├── main.gs                     # Roteamento de páginas (doGet)
├── odoo_service.gs             # Serviço genérico de integração com Odoo
├── atualizacao_cadastral.gs    # Lógica de atualização cadastral de casais
├── avaliacao_grupao.gs         # Lógica de avaliação do grupão
├── calendario.gs               # Calendário de eventos
├── google_drive_service.gs     # Upload de fotos para Google Drive
├── teste_diagnostico.gs        # Funções de teste e diagnóstico
├── atualizar_cadastro.html     # Template: formulário de cadastro
├── avaliar_grupao.html         # Template: formulário de avaliação
└── exibir_calendario.html      # Template: calendário visual
```

---

## 🔧 Setup e Configuração

### Pré-requisitos

1. Conta Google com acesso ao [Apps Script](https://script.google.com)
2. Instância Odoo configurada com os modelos customizados
3. Repositório GitHub com GitHub Pages habilitado
4. (Opcional) Domínio customizado configurado

### 1. Configurar o Backend (Apps Script)

1. Crie um novo projeto no [Google Apps Script](https://script.google.com)
2. Copie todos os arquivos `.gs` e `.html` da pasta `backend/`
3. **Configure as credenciais** (escolha um dos métodos):

**Método A — Via interface (recomendado):**
- Vá em ⚙️ Configurações do projeto > Propriedades do script
- Adicione cada propriedade:

| Propriedade       | Valor                                    |
|-------------------|------------------------------------------|
| `ODOO_URL`        | `https://ecc-pnscaparecida.odoo.com`    |
| `ODOO_DATABASE`   | `ecc-pnscaparecida`                     |
| `ODOO_UID`        | `6`                                      |
| `ODOO_API_KEY`    | Sua chave API do Odoo                    |
| `DRIVE_PASTA_ID`  | ID da pasta do Google Drive para fotos   |
| `AUTH_TOKEN`      | Token de autenticação (gere um seguro)   |

**Método B — Via função (uma vez):**
- Edite os valores em `configurarPropriedadesIniciais()` no `config.gs`
- Execute a função
- **Remova as credenciais do código** após executar

4. Faça o deploy como Web App:
   - Implantar > Nova implantação
   - Tipo: Aplicativo da Web
   - Executar como: Eu mesmo
   - Acesso: Qualquer pessoa
5. Copie a URL do deploy

### 2. Configurar o Frontend (GitHub Pages)

1. Clone o repositório
2. Atualize as URLs do Apps Script nos arquivos `site_*.html` (atributo `src` do iframe)
3. Faça push para o repositório
4. Habilite GitHub Pages em Settings > Pages
5. (Opcional) Configure domínio customizado

### 3. Verificar a Instalação

Execute no editor do Apps Script:

```javascript
// Verificar todas as configurações
verificarConfiguracoes();

// Testar conexão com Odoo
testarConexaoOdoo();

// Executar todos os testes
executarTodosTestes();
```

---

## 🔒 Segurança

### Credenciais

- **API Keys nunca no código-fonte**: Todas as credenciais ficam no `PropertiesService` do Apps Script
- **Repositório**: Pode ser público sem risco de vazamento de credenciais
- **Histórico Git**: Verifique se credenciais antigas foram removidas do histórico

### LGPD

- **Banner de consentimento**: Exibido no primeiro acesso em todas as páginas
- **Google Analytics condicional**: Só carrega após aceite do usuário
- **Cookies removidos**: Se o usuário recusar, cookies do GA são limpos
- **Consentimento salvo**: Via `localStorage` com chave `ecc_lgpd_consent`

---

## 📊 Modelos Odoo

| Constante (config.gs) | Modelo Odoo          | Descrição                    |
|------------------------|----------------------|------------------------------|
| `FICHA_CADASTRAL`      | `x_ficha_cadastral`  | Fichas cadastrais de casais  |
| `COMUNIDADE`           | `x_comunidade`       | Comunidades paroquiais       |
| `HABILIDADES`          | `x_habilidades`      | Habilidades dos membros      |
| `PASTORAIS`            | `x_pastorais`        | Pastorais/atuação pastoral   |
| `GRUPAO`               | `x_grupao`           | Grupões (encontros mensais)  |
| `AVALIACAO_GRUPAO`     | `x_avaliacao_grupao` | Avaliações de grupão         |
| `CALENDARIO`           | `x_calendario`       | Eventos do calendário        |

> **Nota**: Alguns modelos podem existir no singular (`x_habilidade`, `x_pastoral`). O sistema tenta automaticamente a versão alternativa se a principal falhar.

---

## 🚀 Deploy

### Frontend

```bash
git add .
git commit -m "feat: atualização do sistema"
git push origin main
```

O GitHub Pages faz deploy automático após o push.

### Backend

1. No editor do Apps Script, vá em **Implantar > Gerenciar implantações**
2. Edite a implantação existente ou crie uma nova
3. Selecione a versão mais recente
4. Clique em **Implantar**

> **Importante**: Após cada alteração no backend, é necessário criar uma nova versão do deploy para que as mudanças tenham efeito.

---

## 🧪 Testes

O arquivo `teste_diagnostico.gs` contém testes para cada componente:

| Teste | Função | O que verifica |
|-------|--------|---------------|
| 1 | `teste1_Configuracoes()` | PropertiesService configurado |
| 2 | `teste2_ConexaoOdoo()` | Conexão com Odoo |
| 3 | `teste3_BuscarComunidades()` | Busca de dados |
| 4 | `teste4_UploadDrive()` | Upload de fotos |
| 5 | `teste5_FluxoCompleto()` | Criação de ficha cadastral |
| 6 | `teste6_BuscarGrupao()` | Busca de grupão + validação |
| 7 | `teste7_Calendario()` | Calendário de eventos |

Execute `executarTodosTestes()` para rodar todos de uma vez.

---

## 📝 Changelog

### v3.0.0 (2026)
- ✅ Credenciais migradas para PropertiesService (segurança)
- ✅ CSS/JS compartilhado extraído (DRY)
- ✅ Banner LGPD com Google Analytics condicional
- ✅ Constantes ODOO_MODELS para modelos documentados
- ✅ Função `odooExecute()` centralizada (menos código repetido)
- ✅ README completo com documentação de setup e deploy
- ✅ Página de erro com tema verde consistente
- ✅ Testes de diagnóstico atualizados

### v2.0.0 (2025-2026)
- Redesign com paleta verde
- Integração com Google Drive para fotos
- Calendário de eventos
- Sistema de avaliação com prazo de 10 dias

### v1.0.0 (2025)
- Versão inicial com atualização cadastral e avaliação

---

## 👥 Contribuição

Sistema mantido pela equipe de coordenação do ECC.
Para suporte técnico, entre em contato com o administrador do sistema.

---

**© 2026 ECC - Paróquia Nossa Senhora da Conceição Aparecida**
