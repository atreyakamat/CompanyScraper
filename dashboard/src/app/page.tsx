'use client';

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Upload, Briefcase, Building2, MapPin, Search, 
  Settings, Bell, Zap, ExternalLink, Filter, Globe
} from 'lucide-react';

interface Job {
  'Job Title': string;
  'Company': string;
  'Company Profile'?: string;
  'Location': string;
  'Job Type': string;
  'Date Posted': string;
  'Job Link': string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monitoring'>('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const normalizedData = results.data.map((row: any) => ({
            'Job Title': row['Job Title'] || row['title'] || 'N/A',
            'Company': row['Company'] || row['company'] || 'N/A',
            'Company Profile': row['Company Profile'] || row['companyProfile'] || '',
            'Location': row['Location'] || row['location'] || 'N/A',
            'Job Type': row['Job Type'] || row['type'] || 'N/A',
            'Date Posted': row['Date Posted'] || row['date'] || 'N/A',
            'Job Link': row['Job Link'] || row['link'] || 'N/A',
          }));
          setData(normalizedData as Job[]);
        },
      });
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(job => 
      job['Job Title']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job['Company']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job['Location']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const locations: Record<string, number> = {};
    const companies = new Set<string>();
    
    filteredData.forEach(job => {
      companies.add(job['Company']);
      const loc = job['Location'] !== 'N/A' ? job['Location'].split(',')[0].trim() : 'Remote/Other';
      locations[loc] = (locations[loc] || 0) + 1;
    });

    const locationData = Object.entries(locations)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return { total: filteredData.length, companies: companies.size, locationData };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-[#1e293b] border-r border-slate-800 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
          <Zap className="text-white fill-white" size={24} />
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Briefcase size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Bell size={24} />
        </button>
        <div className="mt-auto">
          <button className="text-slate-500 hover:text-slate-300 p-3"><Settings size={24} /></button>
        </div>
      </nav>

      <main className="pl-20 p-8 max-w-[1600px] mx-auto">
        
        {/* Top Bar */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {activeTab === 'dashboard' ? 'Intelligence Dashboard' : 'Automated Monitoring'}
            </h1>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-wider font-semibold">
              Project CompanyScraper Pro v2.5
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#1e293b] border border-slate-800 rounded-full pl-10 pr-6 py-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
            <input type="file" id="csv-upload" className="hidden" onChange={handleFileUpload} />
            <label htmlFor="csv-upload" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium cursor-pointer transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
              <Upload size={18} /> Import CSV
            </label>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-12 gap-8">
            
            {/* Stats */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Identified Jobs', val: stats.total, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Active Companies', val: stats.companies, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'Market Hotspot', val: stats.locationData[0]?.name || 'N/A', icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              ].map((s, i) => (
                <div key={i} className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800/50 flex items-center gap-5 shadow-sm">
                  <div className={`p-4 ${s.bg} ${s.color} rounded-2xl`}><s.icon size={32} /></div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800/50 min-h-[500px]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold">Hiring Distribution</h2>
                  <div className="flex gap-2 bg-[#0f172a] p-1 rounded-lg border border-slate-800">
                    <button className="px-3 py-1 text-xs font-bold bg-slate-800 text-white rounded">Location</button>
                    <button className="px-3 py-1 text-xs font-bold text-slate-500">Industry</button>
                  </div>
                </div>
                <div className="h-[400px]">
                  {stats.locationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.locationData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">Upload a CSV to see charts</div>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-[#1e293b] rounded-3xl border border-slate-800/50 overflow-hidden">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Raw Intelligence</h2>
                  <button className="text-sm text-blue-400 flex items-center gap-1 hover:underline"><Filter size={16}/> Filter</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/30 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-8 py-4">Job / Company</th>
                        <th className="px-8 py-4">Location</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredData.slice(0, 10).map((job, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate max-w-[300px]">{job['Job Title']}</p>
                            <p className="text-slate-500 text-sm flex items-center gap-1">
                              {job['Company']} 
                              {job['Company Profile'] && <Globe size={12} className="text-blue-500/50" />}
                            </p>
                          </td>
                          <td className="px-8 py-5 text-sm font-medium text-slate-400">{job['Location']}</td>
                          <td className="px-8 py-5 text-sm text-slate-500 italic">{job['Date Posted']}</td>
                          <td className="px-8 py-5 text-right">
                            <a href={job['Job Link']} target="_blank" className="inline-flex p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-all">
                              <ExternalLink size={18} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length === 0 && (
                    <div className="p-20 text-center text-slate-600">No data found. Import a CSV to start.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-blue-900/20">
                <h3 className="text-lg font-bold text-white mb-2">Platform Status</h3>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                  The automated monitoring system is currently tracking 14 active markets including Bangalore and Pune.
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-blue-200 uppercase tracking-widest">
                    <span>Scraper Load</span>
                    <span>Optimized</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[85%]"></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800/50">
                <h3 className="text-lg font-bold mb-6">Market Share</h3>
                <div className="h-[250px]">
                  {stats.locationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.locationData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {stats.locationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm">Waiting for data...</div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {stats.locationData.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                        <span className="text-slate-400">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Monitoring Tab Content */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800/50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold">Scraper Scheduling</h2>
                  <p className="text-slate-500 text-sm mt-1">Configure automated background job extraction.</p>
                </div>
                <button 
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-offset-[#1e293b] ${isMonitoring ? 'bg-blue-600 ring-blue-500' : 'bg-slate-700 ring-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMonitoring ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Startup Goa Tracker', status: 'Active', market: 'Goa', time: '09:00 AM Daily' },
                  { name: 'Bangalore Tech Radar', status: 'Active', market: 'Bangalore', time: '10:00 AM Daily' },
                  { name: 'Hyderabad Market Pulse', status: 'Active', market: 'Hyderabad', time: '11:00 AM Daily' },
                  { name: 'Pune Development Feed', status: 'Active', market: 'Pune', time: '12:00 PM Daily' },
                ].map((mon, i) => (
                  <div key={i} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <div>
                        <p className="font-bold">{mon.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">{mon.market} • {mon.time}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all">Configure</button>
                      <button className="px-4 py-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all">Pause</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex gap-4">
              <Zap className="text-blue-400 shrink-0" size={24} />
              <p className="text-sm text-blue-200/80 leading-relaxed">
                <strong>Pro Tip:</strong> All automated logs are stored in the root `logs/` directory. You can check the performance and success rate of each market tracker there.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
