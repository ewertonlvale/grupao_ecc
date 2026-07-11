# Setup do notebook novo — Sistema ECC (Google Apps Script + clasp)

## 1. Node.js (obrigatório para o clasp)

Abra o **PowerShell** e rode:

```powershell
winget install OpenJS.NodeJS.LTS
```

Feche e reabra o PowerShell, depois confirme:

```powershell
node -v
npm -v
```

## 2. Instalar o clasp

```powershell
npm install -g @google/clasp
clasp -v
```

## 3. Habilitar a API do Apps Script

Acesse https://script.google.com/home/usersettings logado na **mesma conta Google dona do script** e ative "Google Apps Script API".

## 4. Login no clasp

```powershell
clasp login
```

Vai abrir o navegador — autorize com a conta dona do script.

## 5. Testar o vínculo com o projeto

Na pasta do projeto:

```powershell
cd "C:\Users\Greenwave\Claude\Pessoal\Sistema ECC"
clasp open-script
```

Se abrir o editor do Apps Script no navegador, o vínculo está OK (o `.clasp.json` já tem o scriptId).

⚠️ **Antes de sincronizar, decida a direção:**
- `clasp pull` — baixa o código do Google e **sobrescreve os arquivos locais**. Use se editou algo direto no editor web depois de 20/05.
- `clasp push` — envia o código local e **sobrescreve o que está no Google**. Use se a pasta local é a versão mais atual.

Na dúvida, faça um backup da pasta antes do primeiro `pull`.

## 6. Git + GitHub

```powershell
winget install Git.Git
```

Reabra o PowerShell e configure:

```powershell
git config --global user.name "GreenWave"
git config --global user.email "agent@greenwave.tec.br"
```

Chave SSH para o GitHub:

```powershell
ssh-keygen -t ed25519 -C "agent@greenwave.tec.br"
Get-Content ~\.ssh\id_ed25519.pub | clip
```

Cole a chave em https://github.com/settings/keys (New SSH key) e teste:

```powershell
ssh -T git@github.com
```

Inicializar o repositório do projeto:

```powershell
cd "C:\Users\Greenwave\Claude\Pessoal\Sistema ECC"
git init
git add .
git commit -m "Versão inicial do Sistema ECC"
```

Para publicar no GitHub, crie um repositório vazio (privado) em https://github.com/new e:

```powershell
git remote add origin git@github.com:SEU_USUARIO/sistema-ecc.git
git branch -M main
git push -u origin main
```

## Fluxo de trabalho diário

1. Editar arquivos localmente (VS Code ou outro editor)
2. `clasp push` — envia para o Apps Script
3. Testar no navegador (`clasp open-web-app` abre o web app)
4. `git add . && git commit -m "descrição"` — versiona
5. Nova versão do web app: publicar via editor web (Implantar → Gerenciar implantações)
