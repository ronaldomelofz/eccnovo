# ECC Alimento do Amor - Site de Encontros

Este é o site oficial do ECC Alimento do Amor, desenvolvido com Next.js e deploy automático no Netlify.

## 🚀 Funcionalidades

- **Sistema de Administração**: Interface para adicionar novos encontros
- **Salvamento Automático**: Os encontros são salvos automaticamente sem necessidade de build manual
- **Deploy Automático**: Integração com GitHub Actions para deploy automático no Netlify
- **Interface Responsiva**: Design adaptado para desktop e mobile
- **Galeria de Fotos**: Visualização ampliada das fotos dos encontros

## 🛠️ Tecnologias Utilizadas

- **Next.js 14**: Framework React para aplicações web
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS para estilização
- **GitHub Actions**: CI/CD para deploy automático
- **Netlify**: Hospedagem estática

## 📋 Configuração do Deploy Automático

### 1. Configurar Secrets no GitHub

No repositório GitHub, vá em **Settings > Secrets and variables > Actions** e adicione:

- `NETLIFY_AUTH_TOKEN`: Token de autenticação do Netlify
- `NETLIFY_SITE_ID`: ID do site no Netlify

### 2. Obter Token do Netlify

1. Acesse [Netlify](https://netlify.com)
2. Vá em **User settings > Applications > Personal access tokens**
3. Crie um novo token e copie o valor
4. Cole no secret `NETLIFY_AUTH_TOKEN` do GitHub

### 3. Obter Site ID do Netlify

1. No Netlify, vá para o seu site
2. Em **Site settings > General > Site details**
3. Copie o **Site ID**
4. Cole no secret `NETLIFY_SITE_ID` do GitHub

### 4. Configurar Build Settings no Netlify

No Netlify, configure:

- **Build command**: `npm run build && npm run export`
- **Publish directory**: `out`
- **Node version**: `18`

## 🔧 Como Funciona o Sistema

### Salvamento Automático

O sistema utiliza uma API route (`/api/encontros`) que:

1. **Recebe dados** do formulário de administração
2. **Salva diretamente** no arquivo `app/data/encontros.ts`
3. **Atualiza automaticamente** a página principal
4. **Não requer build manual** para publicar mudanças

### Deploy Automático

Quando você faz push para a branch `main`:

1. **GitHub Actions** detecta a mudança
2. **Instala dependências** e faz build do projeto
3. **Deploy automático** para o Netlify
4. **Site atualizado** em poucos minutos

## 📱 Como Usar

### Para Administradores

1. Acesse `/admin` no site
2. Digite a senha: `amoragape`
3. Preencha os dados do encontro
4. Clique em "Salvar Encontro"
5. O encontro será salvo automaticamente e aparecerá no site

### Para Visitantes

1. Acesse a página principal
2. Navegue pelos encontros organizados por ano
3. Clique nas fotos para visualização ampliada
4. Use as setas ou teclado para navegar entre fotos

## 🔒 Segurança

- **Autenticação**: Área administrativa protegida por senha
- **Validação**: Dados validados antes do salvamento
- **Backup**: Dados salvos em arquivo TypeScript versionado

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe técnica do ECC Alimento do Amor.

---

**Desenvolvido com ❤️ para o ECC Alimento do Amor**
