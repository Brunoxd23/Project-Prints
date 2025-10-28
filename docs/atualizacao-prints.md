# Funcionalidade de Atualização de Prints

## 📋 Visão Geral

A funcionalidade de atualização de prints permite capturar automaticamente novos screenshots das seções "Local e Horário" (08) e "Valor do Curso" (09) de qualquer semestre, preservando os prints originais e criando versões atualizadas com timestamp.

## 🚀 Como Funciona

### 1. **Botão Atualizar**
- Localizado nos cards dos semestres na interface
- Ao clicar, inicia o processo de captura automática
- Mostra spinner de carregamento durante a execução

### 2. **Processo de Captura**
1. **Navegação**: Acessa a URL correta do curso baseada na pasta
2. **Cookies**: Remove automaticamente banners de cookies
3. **Local e Horário**: Navega para a seção e captura screenshot
4. **Valor do Curso**: Navega para a seção e captura screenshot
5. **Salvamento**: Salva com sufixo de data e hora

### 3. **Nomenclatura dos Arquivos**
```
08- Atualizado DD-MM-YYYY HH-MM - Local e Horário.png
09- Atualizado DD-MM-YYYY HH-MM - Valor do Curso.png
```

**Exemplo:**
```
08- Atualizado 15-12-2024 14-30 - Local e Horário.png
09- Atualizado 15-12-2024 14-30 - Valor do Curso.png
```

## 🔧 Implementação Técnica

### Backend (`server.js`)
- **Rota**: `POST /update-prints/:pasta/:semester`
- **Parâmetros**: 
  - `pasta`: Nome da pasta do curso (ex: "Paliativos_Quinzenal")
  - `semester`: Semestre (ex: "2025-2")
- **Retorno**: JSON com status e lista de arquivos atualizados

### Frontend (`semesterView.js`)
- **Chamada**: `fetch(/update-prints/${curso.pasta}/${semester})`
- **Feedback**: Toast com informações detalhadas
- **Recarregamento**: Atualiza a visualização automaticamente

## 📁 Estrutura de Arquivos

```
public/
├── Paliativos_Quinzenal_2025-2/
│   ├── 08_Local_e_Horario.png (original)
│   ├── 09_Valor_do_Curso.png (original)
│   ├── 08- Atualizado 15-12-2024 14-30 - Local e Horário.png (atualizado)
│   └── 09- Atualizado 15-12-2024 14-30 - Valor do Curso.png (atualizado)
```

## 🎯 URLs Suportadas

| Curso | URL Base |
|-------|----------|
| Cuidados Paliativos | `https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p` |
| Dependência Química | `https://ensino.einstein.br/pos_dependencia_quimica_p0082/p` |
| Outros | URL padrão (Cuidados Paliativos) |

## ✅ Benefícios

1. **Preservação**: Mantém prints originais intactos
2. **Rastreabilidade**: Timestamp permite identificar quando foi atualizado
3. **Automação**: Processo totalmente automatizado
4. **Flexibilidade**: Funciona com qualquer semestre
5. **Feedback**: Usuário recebe informações detalhadas do processo

## 🔍 Monitoramento

### Logs do Servidor
```
Navegando para: https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p
✅ Cookie banner fechado usando seletor: #inicia_cookies
Capturando Local e Horário...
✅ Local e Horário capturado: 08- Atualizado 15-12-2024 14-30 - Local e Horário.png
Capturando Valor do Curso...
✅ Valor do Curso capturado: 09- Atualizado 15-12-2024 14-30 - Valor do Curso.png
```

### Toast Notifications
- **Sucesso**: "Prints atualizados com sucesso! Arquivos: 08- Atualizado..., 09- Atualizado..."
- **Erro**: "Erro ao atualizar prints: [detalhes do erro]"

## 🚨 Tratamento de Erros

- **Pasta não encontrada**: Retorna erro 404
- **Falha na navegação**: Log de erro específico
- **Timeout**: Aguarda até 10 segundos por seção
- **Falha na captura**: Continua com próxima seção

## 🔄 Fluxo Completo

1. Usuário clica em "Atualizar" no card do semestre
2. Frontend envia requisição para `/update-prints/:pasta/:semester`
3. Backend inicia Puppeteer e navega para a URL do curso
4. Remove banners de cookies automaticamente
5. Captura screenshot da seção "Local e Horário"
6. Captura screenshot da seção "Valor do Curso"
7. Salva arquivos com timestamp
8. Retorna lista de arquivos atualizados
9. Frontend mostra toast de sucesso
10. Interface recarrega automaticamente para mostrar novos arquivos

## 📝 Exemplo de Uso

```javascript
// Chamada manual (se necessário)
fetch('/update-prints/Paliativos_Quinzenal/2025-2', {
  method: 'POST'
})
.then(response => response.json())
.then(data => {
  console.log('Arquivos atualizados:', data.updatedFiles);
});
```

## 🎉 Resultado Final

Após a execução, o usuário terá:
- ✅ Prints originais preservados
- ✅ Novos prints com timestamp
- ✅ Feedback visual do processo
- ✅ Interface atualizada automaticamente
- ✅ Logs detalhados no console
