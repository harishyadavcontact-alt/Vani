export default function MarketingPage() {
  return (
    <main className="marketing-shell">
      <section className="marketing-hero">
        <div className="eyebrow">Vani v2</div>
        <h1>The production-grade X audio client for focused listening.</h1>
        <p>
          Connect your X account, sync your sources, build a listening inbox, open threads, and reply without leaving the player.
        </p>
        <div className="hero-actions">
          <a className="cta" href="/listen">Open Product</a>
          <a className="mini-pill" href="/api/health">Health Check</a>
        </div>
      </section>

      <section className="marketing-grid">
        <article className="panel">
          <div className="panel-kicker">Run</div>
          <h3>Three clicks local setup</h3>
          <p>`git clone`, `npm run setup`, `npm run dev`.</p>
        </article>
        <article className="panel">
          <div className="panel-kicker">Sync</div>
          <h3>Source-aware ingestion</h3>
          <p>Curated, following, list, bookmarks, and handle-based sources normalize into one queue model.</p>
        </article>
        <article className="panel">
          <div className="panel-kicker">Ship</div>
          <h3>Hosted-first architecture</h3>
          <p>Postgres, Drizzle, structured services, health checks, and modular UI ready for production hardening.</p>
        </article>
      </section>
    </main>
  )
}
