# Instruções para o GitHub Copilot

Leia `AGENTS.md` na raiz: as regras de lá valem para o Copilot. Resumo da regra obrigatória:

- Toda mudança feita com ajuda de IA exige uma **entrada nova no topo de `docs/AI_CHANGELOG.md`** antes do commit
  (ID sequencial `AI-NNNN`, formato descrito no cabeçalho do arquivo).
- Nunca edite nem apague entradas antigas; corrija com uma entrada nova.
- Registre o que foi e o que **não** foi testado. Nunca registre segredos.
- Cite o ID na mensagem do commit e adicione o trailer `Co-Authored-By`.
- A raiz do projeto é `GoServ-main`; comentários em português explicando o porquê.
