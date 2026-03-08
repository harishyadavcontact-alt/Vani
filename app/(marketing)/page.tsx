import { PublicListenForm } from '@/components/PublicListenForm'

export default function MarketingPage() {
  return (
    <main className="marketing-shell">
      <section className="marketing-hero">
        <div className="eyebrow">Vani v2</div>
        <h1>The production-grade X audio client for focused listening.</h1>
        <p>
          Start listening to public X posts instantly, then log in later for saved sources, sync, and replies.
        </p>
        <div className="hero-actions">
          <a className="cta" href="/listen">Listen now</a>
          <a className="mini-pill" href="/api/health">Health Check</a>
        </div>
        <PublicListenForm />
      </section>

      <section className="marketing-grid">
        <article className="panel">
          <div className="panel-kicker">Run</div>
          <h3>Three clicks local setup</h3>
          <p>`git clone`, `npm run setup`, `npm run dev`.</p>
        </article>
        <article className="panel">
          <div className="panel-kicker">Sync</div>
          <h3>Anonymous first, account later</h3>
          <p>Public listening is the default path. Login upgrades the experience instead of blocking first play.</p>
        </article>
        <article className="panel">
          <div className="panel-kicker">Ship</div>
          <h3>Source-aware ingestion</h3>
          <p>Post URLs, handles, and lists can converge into one listening model with a fast path to playback.</p>
        </article>
      </section>
    </main>
  )
}
