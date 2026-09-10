import React, { useState } from "react";
import { ListFilter, Search, ExternalLink, ShieldCheck, MapPin } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { api } from "../services/api";

export default function EventsPage() {
  const { recentEvents, setSelectedIssue, addToast } = useFleet();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredEvents = recentEvents.filter((e) => {
    const matchesSearch =
      e.bus_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || e.event_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenEventIssue = async (issueId) => {
    if (!issueId) {
      addToast("This raw event has not yet been merged into an aggregated issue.", "info");
      return;
    }
    try {
      const issue = await api.getIssue(issueId);
      setSelectedIssue(issue);
    } catch (err) {
      addToast("Failed to fetch issue: " + err.message, "error");
    }
  };

  return (
    <div className="p-5 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-[#0B3C74] tracking-tight flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-[#0B3C74]" />
            Raw Mobile Edge Detection Event Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured real-time event stream generated on-device by bus cameras prior to central multi-bus verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Bus ID, Event Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 w-52 sm:w-64"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Event Types</option>
            <option value="POTHOLE">Potholes</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="DAMAGED_ROAD">Damaged Road</option>
            <option value="MISSING_DIVIDER">Missing Divider</option>
            <option value="DAMAGED_SIGNBOARD">Damaged Sign</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Bus ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">GPS Location</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Verification State</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 font-medium">#EVT-{evt.id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0B3C74]">{evt.bus_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{evt.event_type.replace(/_/g, " ")}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                    {Math.round(evt.confidence * 100)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-700 font-bold">{evt.severity} / 10</td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {evt.latitude.toFixed(4)}, {evt.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        evt.status === "MERGED"
                          ? "bg-blue-50 text-[#0B3C74] border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {evt.status === "MERGED" ? "AGGREGATED" : "RAW QUEUED"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {evt.issue_id ? (
                      <button
                        onClick={() => handleOpenEventIssue(evt.issue_id)}
                        className="inline-flex items-center gap-1 text-xs text-[#0B3C74] hover:text-blue-800 font-semibold transition"
                      >
                        View Issue <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unlinked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
