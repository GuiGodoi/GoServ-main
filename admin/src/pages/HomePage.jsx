export default function HomePage() {
  return (
    <section>
      <h1>Painel do estabelecimento</h1>
      <p>
        Cadastre o cardápio, gerencie mesas e QR codes, acompanhe a cozinha e
        veja o desempenho do dia.
      </p>
      <ul>
        <li>
          <strong>QR Codes</strong> — cardápio (consulta) e mesas; senha do dia
        </li>
        <li>
          <strong>Cozinha</strong> — pedidos ao vivo (SignalR), avanço de status
        </li>
        <li>
          <strong>Produtos / Categorias</strong> — gestão do cardápio (Admin)
        </li>
        <li>
          <strong>Relatórios</strong> — vendas, ticket médio e mais vendidos
        </li>
        <li>
          <strong>Mesas</strong> — cadastro; entrada do cliente via QR + senha
        </li>
      </ul>

      <style>{`
        h1 {
          margin: 0 0 0.5rem;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
        }
        p, li {
          color: var(--muted);
          line-height: 1.5;
        }
        ul {
          margin: 1.25rem 0 0;
          padding-left: 1.1rem;
        }
        li { margin-bottom: 0.5rem; }
        strong { color: var(--ink); }
      `}</style>
    </section>
  )
}
