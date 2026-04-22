# Technical Health — Cobertura de Testes e Melhorias de Arquitetura

**Data:** 2026-04-18
**Abordagem:** Orientada a risco (caminhos de negócio críticos primeiro)
**Meta:** Cobrir os caminhos de negócio mais críticos — sem perseguir um número de cobertura

---

## Contexto

O projeto possui 39 testes passando com cobertura geral de **71.6%**. Os gaps mais críticos estão em arquivos que sustentam fluxos centrais do sistema — e `dashboard-metrics.ts` está completamente sem testes (0%).

A abordagem escolhida é **orientada a risco**: priorizar os arquivos onde um bug silencioso causaria maior impacto no negócio, e melhorar arquitetura oportunisticamente ao tocar cada arquivo.

---

## Prioridade dos arquivos

| Prioridade | Arquivo | Cobertura atual | Risco |
|---|---|---|---|
| P0 | `dashboard-metrics.ts` | 0% | Agregações sem nenhum teste |
| P0 | `instruments.ts` | 65% | Branches de prazo e alerta descobertos |
| P0 | `calibrations.ts` | 57% | Filtros de histórico e status incompletos |
| P1 | `calibration-certificates.ts` | 59% | Caminhos de validação de PDF |
| P1 | `measurement-fields.ts` | 66% | Mapeamento de campos e hint |
| P2 | `measurements.ts` | 73% | Normalização de unidades |

Arquivos já bem cobertos (`calibration-derivations.ts` 87%, `calibration-records.ts` 87%) não são prioridade.

---

## O que cobrir por arquivo

### `dashboard-metrics.ts` (P0)
- Contagem de instrumentos por status de prazo (vencido, próximo, em dia)
- Instrumentos sem calibração registrada
- Próximas calibrações ordenadas por data
- Todas são funções de agregação pura — testáveis sem banco

### `instruments.ts` (P0)
- Cálculo de prazo quando `data_ultima_calibracao` é nula
- Tom de alerta: verde / amarelo / vermelho por threshold de dias
- Tag fallback quando `tag` está vazia ou nula

### `calibrations.ts` (P0)
- Filtros de histórico por data e por status
- Mapeamento de status de calibração
- Casos onde `observacoes` contém ou não o bloco `[[METROLOGIA_CALIBRATION_DATA]]`

### `calibration-certificates.ts` (P1)
- Caminho feliz: PDF válido com extensão e tamanho corretos
- Casos de falha: arquivo inválido, sem extensão `.pdf`, tamanho excedido

### `measurement-fields.ts` (P1)
- Branches descobertos concentrados em `mapMeasurementFieldRow`
- Estratégia: testar via função pública que a chama
- Se o acoplamento impedir cobertura, exportar como função interna sem mudar API pública

### `measurements.ts` (P2)
- Cobrir linhas 127–132 e 141 oportunisticamente

---

## Melhorias de arquitetura (oportunísticas)

Não há refatoração forçada. As melhorias acontecem **ao tocar cada arquivo**:

**`dashboard-metrics.ts`**
As agregações provavelmente estão acopladas a chamadas Supabase inline (explica o 0% — não são testáveis hoje). Ao escrever os testes, extrair lógica de agregação pura para funções separadas das queries. Mesmo padrão já usado em `calibrations.ts` e `instruments.ts`.

**`measurement-fields.ts`**
Se `mapMeasurementFieldRow` (função privada) estiver impedindo cobertura adequada, exportar como função interna sem alterar a API pública do módulo.

**Regra geral**
Se um arquivo estiver difícil de testar, é sinal de problema de design. Ajustar o mínimo necessário para torná-lo testável — sem refatorar além disso.

---

## Convenções de teste (já estabelecidas no projeto)

- Testes em `tests/lib/*.test.ts` — Vitest, ambiente node, alias `@` para raiz
- Cobertura medida apenas para `lib/**/*.ts` (excluindo `lib/api`, `lib/server`, `lib/supabase`)
- Sem mocks de banco — testes usam funções puras
- Ao corrigir um bug de regra de negócio: adicionar teste que reproduz a falha original primeiro

---

## Definição de "pronto"

- Todos os caminhos P0 cobertos com testes que podem falhar se a lógica for quebrada
- Todos os caminhos P1 cobertos
- `dashboard-metrics.ts` com lógica de agregação extraída e testável
- Suite completa passando (`npm run test`)
- Nenhuma regressão no build (`npm run build`)
