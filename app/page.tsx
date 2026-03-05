import VaniPlayer from '@/app/components/VaniPlayer'

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1 style={{ marginBottom: '.2rem' }}>Vani</h1>
          <p className="tag">listen to the universe..</p>
        </div>
        <button className="primary">Sign in with X (stub)</button>
      </section>

      <VaniPlayer />
    </main>
  )
}
