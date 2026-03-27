# Horarius Front-end

Aplicacao front-end desenvolvida com React e Vite para gestao de agenda, clientes, profissionais e servicos.

## Tecnologias

- React
- React Router
- Vite
- Tailwind CSS
- Componentes baseados em Radix UI/shadcn

## Pre-requisitos

- Node.js
- npm 10
## Como executar o projeto

1. Abrir um terminal na pasta do projeto (onde esta o arquivo package.json).
2. Instale as dependencias:

```bash
npm install
```

3. Crie o arquivo `.env` com base em `.env.example`.

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

5. Acesse no navegador:

```text
http://localhost:5173
```

## Variaveis de ambiente

- `VITE_API_BASE_URL`: endereco base da API do backend.

## Gerar build de producao

Para gerar os arquivos otimizados de producao:

```bash
npm run build
```

## Rotas principais

- /agenda/timeline
- /agenda/lista
- /clientes
- /profissionais
- /servicos
- /planos-clientes
- /assinatura
- /perfil

## Scripts disponiveis

- npm run dev: inicia o servidor local de desenvolvimento.
- npm run build: gera o build para producao.

## Estrutura resumida

- src/app/pages: paginas principais da aplicacao.
- src/app/components: componentes compartilhados e de interface.
- src/styles: estilos globais e tema.
  
