---
tags: [dominio, modelo]
---

# Modelo de Domínio

## Hierarquia

```
Categoria
  └─ define template de campos (categoria_campos_medicao)
       └─ Instrumento
            └─ herda campos via instrumento_campos_medicao
                 └─ Calibração
                      ├─ cabeçalho (datas, responsável, PDF)
                      ├─ payload estruturado em observacoes
                      └─ calibracao_resultados (conformidade por campo)
```

## Categoria

- Define o **template** de calibração reutilizável
- Campos com: `name`, `measurementId`, `groupName`, `subgroupName`, `slug`, `hint`
- Ao editar categoria: campos dos instrumentos vinculados são sincronizados
- Não pode ser deletada se houver instrumentos vinculados

## Instrumento

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `tag` | string | sim (ou gerado) |
| `categoria_id` | number | sim |
| `fabricante` | string | não |
| `setor_id` | number | não (FK → `setores`, `ON DELETE SET NULL`) |
| `data_ultima_calibracao` | date | não |
| `proxima_calibracao` | date | não |

- Herda campos da categoria via `instrumento_campos_medicao`
- Tag salva tem prioridade; se parecer UUID, usa `buildInstrumentDisplayTag`
- `setor` é resolvido em `mapInstrumentRow` via `setoresById: Map<number, SetorItem>`

## Calibração

| Campo | Tipo | Notas |
|-------|------|-------|
| `data_calibracao` | date | obrigatório |
| `arquivo_certificado_url` | string | PDF obrigatório |
| `observacoes` | text | pode conter JSON estruturado |
| `calibracao_resultados` | tabela | conformidade por campo (opcional) |

- PDF upload é obrigatório para criar calibração
- Nome do PDF serve como fallback de identificação no log
- `calibracao_resultados` guarda conformidade; valores completos ficam em `observacoes`

## Relacionado
- [[arquitetura/data-layer]] — schemas e tabelas reais
- [[dominio/regras-criticas]] — regras que não podem quebrar
- [[dominio/campo-slugs]] — como slugs funcionam
- [[modulos/calibration-records]] — serialização de observacoes
- [[modulos/setores]] — tipos e helpers de setor
