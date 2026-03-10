# Horarius Front-end

Aplicacao front-end desenvolvida com React e Vite para gestao de agenda, clientes, profissionais e servicos.

## Tecnologias

- React 18
- React Router 7
- Vite 6
- Tailwind CSS 4
- Componentes baseados em Radix UI/shadcn

## Pre-requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Como executar o projeto

1. Abra um terminal na pasta do projeto (onde esta o arquivo package.json).
2. Instale as dependencias:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Acesse no navegador:

```text
http://localhost:5173
```

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
  