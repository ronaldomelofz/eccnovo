# ECC ALIMENTO DO AMOR

Site oficial do ECC (Encontro de Casais com Cristo) Alimento do Amor, apresentando a agenda de encontros com fotos e informações dos eventos.

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Linguagem de programação
- **Tailwind CSS** - Framework de CSS
- **React** - Biblioteca de interface

## 📋 Funcionalidades

- 📅 Agenda de encontros por ano (2023, 2024, 2025)
- 🖼️ Galeria de fotos dos encontros
- 🎵 Player de música integrado
- 📱 Layout responsivo
- 🖱️ Modal para ampliar fotos
- 🎨 Interface moderna e intuitiva

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd SITEECC
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🌐 Deploy no Netlify

### Método 1: Deploy Automático via Git

1. Faça push do código para um repositório Git (GitHub, GitLab, etc.)
2. Conecte sua conta Netlify ao repositório
3. Configure as seguintes opções de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Node version**: `18`

### Método 2: Deploy Manual

1. Faça o build do projeto:
```bash
npm run build
```

2. Faça upload da pasta `out` diretamente no Netlify

### Configurações Importantes

O projeto já está configurado com:
- ✅ `netlify.toml` - Configurações de build e redirecionamentos
- ✅ Static export habilitado no Next.js
- ✅ Otimizações de performance
- ✅ Headers de segurança
- ✅ Cache para assets estáticos

## 📁 Estrutura do Projeto

```
├── app/
│   ├── data/
│   │   └── encontros.ts      # Dados dos encontros
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página inicial
├── public/
│   └── FOTOS/               # Imagens e música
├── netlify.toml             # Configurações Netlify
├── next.config.js           # Configurações Next.js
├── tailwind.config.js       # Configurações Tailwind
└── package.json             # Dependências
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Verificação de código

## 📸 Adicionando Novos Encontros

Para adicionar um novo encontro, edite o arquivo `app/data/encontros.ts`:

```typescript
{
  dia: "15",
  mes: "Janeiro",
  ano: 2024,
  anfitriao: "Nome do Casal",
  foto: "/FOTOS/nome-da-foto.jpg", // ou null se não tiver foto
  semFoto: false // true se não tiver foto
}
```

## 📝 Licença

© 2024 ECC ALIMENTO DO AMOR. Todos os direitos reservados.

## 🤝 Suporte

Para dúvidas ou problemas, entre em contato com a equipe do ECC Alimento do Amor. 