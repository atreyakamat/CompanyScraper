'use client';

import { useEffect, useState } from 'react';

type Lead = {
  id: number;
  name: string;
  source: string;
  contact_info: string;
  message_context: string;
  status: string;
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draftReply, setDraftReply] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      });
  }, []);

  const handleDraftReply = async (lead: Lead) => {
    setIsDrafting(true);
    setDraftReply('Thinking...');
    try {
      const res = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          messageContext: lead.message_context,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setDraftReply(data.reply);
      } else {
        setDraftReply('Failed to draft reply. Is Ollama running?');
      }
    } catch (e) {
      setDraftReply('Error connecting to AI assistant.');
    }
    setIsDrafting(false);
  };

  return (
    <div className="container">
      <header>
        <h1>Lead Management Platform</h1>
        <div>
          <span className="badge" style={{ backgroundColor: '#475569' }}>
            {leads.length} Leads
          </span>
        </div>
      </header>

      <main className="lead-grid">
        {leads.length === 0 ? (
          <p>No leads found. Use the ingestion API to push leads.</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="card">
              <div className="card-header">
                <div className="card-title">{lead.name}</div>
                <div className="badge">{lead.status}</div>
              </div>
              <div className="card-body">
                <p><strong>Source:</strong> {lead.source}</p>
                <p><strong>Contact:</strong> {lead.contact_info}</p>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lead.message_context}
                </p>
              </div>
              <button className="btn" onClick={() => setSelectedLead(lead)}>
                View & Respond
              </button>
            </div>
          ))
        )}
      </main>

      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Respond to {selectedLead.name}</h2>
            <div className="form-group">
              <label>Original Message</label>
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                {selectedLead.message_context || 'No message provided.'}
              </div>
            </div>
            
            <div className="form-group">
              <label>Draft Reply (AI Assisted)</label>
              <textarea 
                className="form-control" 
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                placeholder="Click 'Generate Draft' to use local AI..."
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => handleDraftReply(selectedLead)}
                disabled={isDrafting}
              >
                {isDrafting ? 'Generating...' : '✨ Generate Draft (Ollama)'}
              </button>
              <button className="btn" onClick={() => {
                alert('Reply copied or sent (mock)');
                setSelectedLead(null);
              }}>
                Send Reply
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedLead(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
