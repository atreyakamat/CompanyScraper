'use client';

export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ borderBottom: '1px solid #eee', marginBottom: '2rem', paddingBottom: '1rem' }}>
        <h1>Lead Management Platform Documentation</h1>
        <p>Your guide to setting up and using the local-first AI lead manager.</p>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2>🚀 Quick Start</h2>
          <p>The Lead Management Platform runs entirely on your local machine to ensure privacy and data security.</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}>
            {`# Start the application
npm run dev:app

# Start this documentation site
npm run dev:docs`}
          </pre>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>🤖 AI Integration (Ollama)</h2>
          <p>The platform uses <strong>Ollama</strong> for all AI tasks. Ensure you have Ollama installed and running.</p>
          <ul>
            <li><strong>Model:</strong> qwen3:0.6b (recommended for speed)</li>
            <li><strong>Endpoint:</strong> http://localhost:11434</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>🔌 Ingestion API</h2>
          <p>Push leads from LinkedIn or Email scripts to the platform via the ingestion endpoint.</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}>
            {`POST /api/leads/ingest
{
  "name": "John Doe",
  "source": "LinkedIn",
  "message_context": "Interested in lead gen services..."
}`}
          </pre>
        </section>

        <section>
          <h2>📂 Architecture</h2>
          <ul>
            <li><strong>Frontend:</strong> Next.js 15 (App Router)</li>
            <li><strong>Database:</strong> SQLite (Local)</li>
            <li><strong>AI:</strong> Ollama SDK</li>
            <li><strong>Styling:</strong> Vanilla CSS</li>
          </ul>
        </section>
      </main>

      <footer style={{ marginTop: '4rem', color: '#888', fontSize: '0.8rem' }}>
        &copy; 2026 Lead Management Platform Project
      </footer>
    </div>
  );
}
