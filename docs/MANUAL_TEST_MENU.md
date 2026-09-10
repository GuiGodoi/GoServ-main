# Checklist — testes manuais do cardápio (client)

Use com o stack no ar (`npm run dev`). Marque cada item ao validar.

**Ambiente**
- [ ] Docker/PostgreSQL healthy (`localhost:5433`)
- [ ] API em http://localhost:5000 (`/api/health` → ok)
- [ ] Client em http://localhost:5173
- [ ] Admin em http://localhost:5174

## Preparação (admin)

- [ ] Login admin (`admin@goserv.local` / `admin123`)
- [ ] Existe ao menos 1 categoria e 2 produtos disponíveis
- [ ] Um produto tem foto (upload JPEG/PNG/WebP ≤ 5 MB)
- [ ] Abrir sessão de uma mesa e copiar o link do cliente (`/mesa/{token}`)

## Cardápio (client)

- [ ] Abrir o link da mesa (ou `/mesa/{token}`)
- [ ] Lista produtos disponíveis (indisponíveis não aparecem ou ficam claros)
- [ ] Categorias/agrupamento fazem sentido
- [ ] Foto do produto carrega (sem quebrar layout se falhar)
- [ ] Preço em R$ legível
- [ ] Sem sessão/token inválido: mensagem de erro clara (não tela branca)

## Carrinho e pedido

- [ ] Adicionar item ao carrinho
- [ ] Alterar quantidade / remover item
- [ ] Adicionais (se o produto tiver) alteram o total exibido
- [ ] Nota do item / observação (se existir) aceita texto curto
- [ ] Checkout vai para tela de **pagamento Pix** (não direto à cozinha)
- [ ] “Simular pagamento (demo)” libera o pedido; cozinha só então recebe
- [ ] Acompanhamento mostra **senha grande** e passos do wireframe
- [ ] Item esgotado aparece esmaecido com tag ESGOTADO
- [ ] Mesa visível no topo das telas do cliente
- [ ] KDS mostra tempo decorrido (“N min”), não só horário
- [ ] Total do pedido bate com a soma no servidor (não confiar só no front)

## Acompanhamento

- [ ] Tela `/pedido/{publicId}` mostra senha grande e status (ex.: Recebido)
- [ ] Ao mudar status na cozinha (admin), client atualiza (SignalR ou refresh)
- [ ] Banner/indicação quando status = Pronto

## Kiosk (opcional)

- [ ] `?kiosk=1` aumenta alvos de toque / badge kiosk
- [ ] Após ~90s ocioso volta ao cardápio (exceto tela do pedido)

## Regressões rápidas

- [ ] Recarregar a página do cardápio não perde a sessão da mesa
- [ ] Admin continua autenticado após refresh (token JWT)
- [ ] Upload de arquivo não-imagem no admin é rejeitado com mensagem

Registrar falhas com: URL, passos, esperado vs obtido, print se possível.
