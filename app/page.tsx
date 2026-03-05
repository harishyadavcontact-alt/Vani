import VaniPlayer from '@/app/components/VaniPlayer'

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1 style={{ marginBottom: '.2rem' }}>Vani</h1>
          <p className="tag">listen to the universe..</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <a className="primary" href="/api/auth/demo">
            Continue in Demo
          </a>
          <a className="primary" href="/api/auth/login">
            Connect X (optional)
          </a>
        </div>
      </section>

      <VaniPlayer />
    </main>
  )
}
