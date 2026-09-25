# IMD Protocol - Plano de Implementação

## Fase 1: Open Source Seletivo (Semana 1)

### Repositório GitHub
```
imd-protocol/
├── README.md                    # Visão geral
├── LICENSE                      # MIT para infraestrutura
├── contracts/
│   ├── AdoptionVault.sol        # ✅ Open source
│   ├── DonationHook.sol         # ✅ Open source
│   ├── OptimizerVault.sol       # ✅ Open source (básico)
│   └── OptimizerVaultTest.sol   # ✅ Open source
├── frontend/
│   ├── app/                     # ✅ Open source
│   ├── components/              # ✅ Open source
│   └── lib/
│       ├── config.ts            # ✅ Open source
│       └── contract-config.ts   # ✅ Open source
├── docs/
│   ├── ADOPTION-PROGRAM.md      # ✅ Open source
│   └── LAUNCH-STRATEGY.md       # ✅ Open source
└── optimizer/
    └── src/
        └── (PRIVADO)            # ❌ Proprietário
```

### O que NÃO publicar:
- `hookPoolAnalyzer.ts` (algoritmo proprietário)
- `optimizer.ts` (estratégia de yield)
- Integrações com hooks específicos
- Lógica de decay/cap management

---

## Fase 2: Deploy Sepolia Beta (Semana 2)

### Features do Beta
```
✅ Incluído:
- Vault básico (deposit/withdraw manual)
- Dashboard com dados reais da pool
- Analytics de burns e fees
- Simulação de LP (sem execução)
- Programa de adoção

❌ NÃO incluído (beta):
- Yield distribution automática
- Integração com hooks reais
- Execução de swaps
- Gestão automática de posições
```

### Proteções do Beta
```
1. Taxa de performance: 0% (temporário)
2. Sem withdraw automático
3. Dados mockados para yield
4. Sem integração com MetaMask para transações
5. Apenas visualização (read-only)
```

---

## Fase 3: Programa de Adoção (Semana 3-4)

### Deploy AdoptionVault
```
1. Compilar contratos
2. Deploy na Sepolia
3. Verificar no Etherscan
4. Integrar no frontend
5. Iniciar campanha
```

### Campanha de Marketing
```
1. Twitter thread explicando o programa
2. Post no Discord/Telegram
3. Artigo no Medium
4. Calls com comunidades DeFi
```

---

## Fase 4: Mainnet (Mês 2+)

### Pré-requisitos
```
- 5 ETH arrecadados
- 100+ supporters
- Beta testado
- Audit básico
```

### Deploy Completo
```
1. Deploy OptimizerVault principal
2. Deploy DonationHook
3. Deploy IMDTWAPHook
4. Deploy IMDPerpetualHook
5. Integração completa
6. Yield distribution real
```

---

## Checklist de Segurança

### Antes de Abrir Código
- [ ] Remover chaves privadas
- [ ] Remover URLs sensíveis
- [ ] Remover algoritmo proprietário
- [ ] Adicionar licenses
- [ ] Criar .gitignore adequado
- [ ] Documentar ""

### Antes de Deploy Sepolia
- [ ] Testes unitários passando
- [ ] Contratos compilados
- [ ] Deploy script testado
- [ ] Frontend buildando
- [ ] API funcionando

### Antes de Mainnet
- [ ] 5 ETH arrecadados
- [ ] Audit básico
- [ ] Testes em Sepolia
- [ ] Documentação completa
- [ ] Comunidade ativa

---

## Métricas de Sucesso

### Fase 1 (Open Source)
- 10+ stars no GitHub
- 5+ forks
- 100+ views

### Fase 2 (Sepolia Beta)
- 50+ testadores
- 100+ transações
- 0 bugs críticos

### Fase 3 (Adoção)
- 100+ supporters
- 2+ ETH arrecadados
- 50+ Discord members

### Fase 4 (Mainnet)
- 5 ETH arrecadados
- 200+ supporters
- 10+ ETH em TVL
