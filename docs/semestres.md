# Implementação de Pastas por Semestre

Este documento descreve a implementação do sistema de pastas por semestre para o aplicativo de geração de prints.

## Estrutura de Pastas

As pastas de prints agora são organizadas por semestre no formato:

```
public/
  ├── [Nome_do_Curso]_[AAAA-S]/
```

Onde:

- `[Nome_do_Curso]` é o nome do curso (ex: Pratica_Estendida)
- `[AAAA-S]` é o ano e semestre (ex: 2025-2, 2026-1)

## Funcionalidades

1. **Verificação e Criação de Pasta**:

   - Ao executar um script, o sistema verifica se a pasta do semestre atual já existe
   - Se existir, cria automaticamente a pasta do próximo semestre

2. **Visualização de Semestres**:

   - O botão "Ver Prints" exibe todos os semestres disponíveis
   - Cada semestre é mostrado como um card
   - Ao clicar no card, o usuário pode ver os prints daquele semestre

3. **Navegação**:
   - Ao visualizar os prints, o usuário pode voltar para a lista de semestres
   - Da lista de semestres, pode voltar para a lista de subcursos

## Como Usar

1. Clique em "Executar Script" para gerar prints do semestre atual ou próximo
2. Clique em "Ver Prints" para visualizar todos os semestres disponíveis
3. Selecione um semestre para visualizar seus prints
4. Use o botão "Voltar" para navegar entre as diferentes visualizações
