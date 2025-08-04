import React, { useState } from 'react';

interface FilterStatusPanelProps {
  filterStatus: any[] | undefined;
}

interface FilterData {
  name: string;
  status: string;
  reason: string;
  filter_enabled?: boolean;
  details?: any;
}

interface TimestampEntry {
  timestamp: number;
  filters: FilterData[];
  final_trade_decision: string;
  chaos_discerned?: any;
}

export const FilterStatusPanel: React.FC<FilterStatusPanelProps> = ({ filterStatus }) => {
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

  // Parse all timestamp entries into a structured format
  const parseAllEntries = (): TimestampEntry[] => {
    if (!filterStatus || filterStatus.length === 0) return [];

    return filterStatus.map((entry, index) => {
      const filters: FilterData[] = [];
      
      // Extract individual filters
      if (entry.trend_filter) {
        filters.push({
          name: 'Trend Filter',
          status: entry.trend_filter.status || 'UNKNOWN',
          reason: entry.trend_filter.reason || 'No reason provided',
          filter_enabled: entry.trend_filter.filter_enabled,
          details: entry.trend_filter
        });
      }
      
      if (entry.volatility_filter) {
        filters.push({
          name: 'Volatility Filter',
          status: entry.volatility_filter.status || 'UNKNOWN',
          reason: entry.volatility_filter.reason || 'No reason provided',
          filter_enabled: entry.volatility_filter.filter_enabled,
          details: entry.volatility_filter
        });
      }
      
      if (entry.levels_filter) {
        filters.push({
          name: 'Levels Filter',
          status: entry.levels_filter.status || 'UNKNOWN',
          reason: entry.levels_filter.reason || 'No reason provided',
          details: entry.levels_filter
        });
      }
      
      if (entry.combined_vwap_filter) {
        filters.push({
          name: 'Combined VWAP Filter',
          status: entry.combined_vwap_filter.status || 'UNKNOWN',
          reason: entry.combined_vwap_filter.reason || 'No reason provided',
          filter_enabled: entry.combined_vwap_filter.filter_enabled,
          details: entry.combined_vwap_filter
        });
      }
      
      if (entry.underused_alpha_filter) {
        filters.push({
          name: 'Underused Alpha Filter',
          status: entry.underused_alpha_filter.status || 'UNKNOWN',
          reason: entry.underused_alpha_filter.reason || 'No reason provided',
          filter_enabled: entry.underused_alpha_filter.filter_enabled,
          details: entry.underused_alpha_filter
        });
      }

      return {
        timestamp: entry.timestamp,
        filters,
        final_trade_decision: entry.final_trade_decision || 'UNKNOWN',
        chaos_discerned: entry.chaos_discerned
      };
    }).reverse(); // Reverse to show oldest first (top to bottom)
  };

  // Function to toggle entry expansion
  const toggleEntry = (index: number) => {
    setExpandedEntries(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to toggle filter expansion
  const toggleFilter = (filterName: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const parsedEntries = parseAllEntries();
  const latestEntry = parsedEntries.length > 0 ? parsedEntries[parsedEntries.length - 1] : null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
      case 'allow':
        return 'text-green-400';
      case 'blocked':
      case 'block':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
      case 'allow':
        return 'bg-green-900 text-green-300';
      case 'blocked':
      case 'block':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!filterStatus || filterStatus.length === 0) {
    return (
      <div className="bg-black border border-gray-700 p-4 rounded">
        <h3 className="text-lg font-bold text-green-400 mb-2">FILTER STATUS</h3>
        <div className="text-gray-400 text-sm">No filter status data available</div>
      </div>
    );
  }

  return (
    <div className="bg-black border border-gray-700 p-4 rounded">
      <h3 className="text-lg font-bold text-green-400 mb-2">FILTER STATUS</h3>
      <div className="text-xs text-gray-400 mb-2">
        {parsedEntries.length} timestamp entries | Chronological order (oldest first)
      </div>
      
      <div className="space-y-1">
        {parsedEntries.map((entry, index) => {
          const isLatest = index === 0; // First entry (index 0) is the newest after reverse()
          const entryNumber = index + 1; // Chronological numbering (oldest = #1)
          
          return (
            <div key={`${entry.timestamp}-${index}`} className="border border-gray-700 bg-black">
              {/* Entry Header */}
              <div 
                className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => toggleEntry(index)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-gray-400">#{entryNumber}</span>
                  <span className="text-xs font-mono text-gray-300">
                    {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                  </span>
                  {isLatest && (
                    <span className="px-1 py-0.5 text-xs bg-blue-600 text-white rounded">LATEST</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded font-mono ${
                    entry.final_trade_decision === 'ALLOWED' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {entry.final_trade_decision}
                  </span>
                  <span className="text-gray-400">
                    {expandedEntries[index] ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {/* Expanded Entry Details */}
              {expandedEntries[index] && (
                <div className="border-t border-gray-700 p-3">
                  {/* Individual Filters */}
                  <div className="space-y-2 mb-3">
                    {entry.filters.map((filter, filterIndex) => (
                      <div key={`${entry.timestamp}-${filter.name}-${filterIndex}`} className="bg-gray-900 border border-gray-600 p-2 rounded">
                        <div 
                          className="flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => toggleFilter(`${entry.timestamp}-${filter.name}`)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">{filter.name}</span>
                            {filter.filter_enabled !== undefined && (
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                filter.filter_enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {filter.filter_enabled ? 'ENABLED' : 'DISABLED'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusBgColor(filter.status)}`}>
                              {filter.status.toUpperCase()}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {expandedFilters[`${entry.timestamp}-${filter.name}`] ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Expanded Filter Details */}
                        {expandedFilters[`${entry.timestamp}-${filter.name}`] && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="space-y-1 text-xs">
                              {/* Status and Reason */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-400">Status:</span>
                                  <span className={`ml-2 ${getStatusColor(filter.status)}`}>
                                    {filter.status.toUpperCase()}
                                  </span>
                                </div>
                                {filter.filter_enabled !== undefined && (
                                  <div>
                                    <span className="text-gray-400">Enabled:</span>
                                    <span className={`ml-2 ${filter.filter_enabled ? 'text-green-400' : 'text-gray-400'}`}>
                                      {filter.filter_enabled ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Reason */}
                              {filter.reason && (
                                <div>
                                  <span className="text-gray-400">Reason:</span>
                                  <span className="ml-2 text-gray-300">{filter.reason}</span>
                                </div>
                              )}
                              
                              {/* Filter-specific details */}
                              {filter.details && (
                                <div>
                                  <span className="text-gray-400">Details:</span>
                                  <div className="ml-2 mt-1 grid grid-cols-2 gap-2">
                                    {Object.entries(filter.details).map(([key, value]: [string, any]) => {
                                      if (value === null || value === undefined) return null;
                                      
                                      // Handle nested objects (like resistance_analysis)
                                      if (typeof value === 'object' && !Array.isArray(value)) {
                                        return (
                                          <div key={`${entry.timestamp}-${filter.name}-${key}`} className="col-span-2">
                                            <div className="text-gray-500 mb-1 font-mono">{key.toUpperCase()}:</div>
                                            <div className="ml-2 space-y-1">
                                              {Object.entries(value).map(([nestedKey, nestedValue]: [string, any]) => (
                                                <div key={`${entry.timestamp}-${filter.name}-${key}-${nestedKey}`}>
                                                  <span className="text-gray-500">{nestedKey}:</span>
                                                  <span className="ml-1 text-purple-400">
                                                    {typeof nestedValue === 'number' ? nestedValue.toFixed(4) : 
                                                     typeof nestedValue === 'boolean' ? (nestedValue ? 'Yes' : 'No') :
                                                     nestedValue}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div key={`${entry.timestamp}-${filter.name}-${key}`}>
                                          <span className="text-gray-500">{key}:</span>
                                          <span className="ml-1 text-purple-400">
                                            {typeof value === 'number' ? value.toFixed(4) : 
                                             typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                                             value}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Chaos Discerned Section */}
                  {entry.chaos_discerned && (
                    <div className="p-2 border border-purple-600 bg-purple-900/20 rounded">
                      <div className="text-xs font-mono text-purple-400 mb-2">CHAOS DISCERNED</div>
                      <div className="text-xs space-y-1">
                        {/* Basic Metrics */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">State:</span>
                            <span className="text-yellow-400">{entry.chaos_discerned.state || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sentiment:</span>
                            <span className="text-purple-400">{entry.chaos_discerned.sentiment || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Position Type:</span>
                            <span className={getStatusColor(entry.chaos_discerned.position_type || '')}>
                              {entry.chaos_discerned.position_type || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Position Size:</span>
                            <span className="text-cyan-400">{entry.chaos_discerned.position_size || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Weight and Confidence Metrics */}
                        <div className="border-t border-gray-600 pt-2 mb-2">
                          <div className="text-gray-400 mb-1">Weight Analysis:</div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Long Weight:</span>
                              <span className="text-green-400">{entry.chaos_discerned.long_total_weight?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Short Weight:</span>
                              <span className="text-red-400">{entry.chaos_discerned.short_total_weight?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Weight:</span>
                              <span className="text-blue-400">{entry.chaos_discerned.total_adjusted_weight?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Valid Signals:</span>
                              <span className="text-cyan-400">{entry.chaos_discerned.num_valid_signals || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Metrics */}
                        <div className="border-t border-gray-600 pt-2 mb-2">
                          <div className="text-gray-400 mb-1">Confidence Analysis:</div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Avg Confidence:</span>
                              <span className="text-yellow-400">{entry.chaos_discerned.average_confidence?.toFixed(2) || 'N/A'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Confidence:</span>
                              <span className="text-purple-400">{entry.chaos_discerned.total_weighted_confidence?.toFixed(2) || 'N/A'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Long Confidence:</span>
                              <span className="text-green-400">{entry.chaos_discerned.long_weighted_confidence?.toFixed(2) || 'N/A'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Short Confidence:</span>
                              <span className="text-red-400">{entry.chaos_discerned.short_weighted_confidence?.toFixed(2) || 'N/A'}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Sorting Signals */}
                        {entry.chaos_discerned.sorting_signals && (
                          <div className="border-t border-gray-600 pt-2">
                            <div className="text-gray-400 mb-1">Sorting Signals:</div>
                            
                            {/* Long Signals */}
                            {entry.chaos_discerned.sorting_signals.long && entry.chaos_discerned.sorting_signals.long.length > 0 && (
                              <div className="mb-2">
                                <div className="text-green-400 text-[10px] mb-1">LONG SIGNALS ({entry.chaos_discerned.sorting_signals.long.length}):</div>
                                <div className="space-y-1">
                                  {entry.chaos_discerned.sorting_signals.long.map((signal: any, signalIndex: number) => (
                                    <div key={`${entry.timestamp}-green-${signalIndex}`} className="bg-green-900/20 border border-green-700 p-1 rounded text-[9px]">
                                      <div className="flex justify-between items-start">
                                        <span className="text-green-300 font-mono">{signal.name}</span>
                                        <div className="flex gap-1">
                                          <span className={`px-1 rounded ${signal.value ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                                            {signal.value ? 'TRUE' : 'FALSE'}
                                          </span>
                                          <span className="px-1 bg-blue-900 text-blue-200 rounded">
                                            {signal.weight?.toFixed(2)}
                                          </span>
                                          <span className="px-1 bg-yellow-900 text-yellow-200 rounded">
                                            {signal.confidence?.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                      {signal.details && (
                                        <div className="text-gray-400 mt-1 text-[8px]">{signal.details}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Short Signals */}
                            {entry.chaos_discerned.sorting_signals.short && entry.chaos_discerned.sorting_signals.short.length > 0 && (
                              <div className="mb-2">
                                <div className="text-red-400 text-[10px] mb-1">SHORT SIGNALS ({entry.chaos_discerned.sorting_signals.short.length}):</div>
                                <div className="space-y-1">
                                  {entry.chaos_discerned.sorting_signals.short.map((signal: any, signalIndex: number) => (
                                    <div key={`${entry.timestamp}-red-${signalIndex}`} className="bg-red-900/20 border border-red-700 p-1 rounded text-[9px]">
                                      <div className="flex justify-between items-start">
                                        <span className="text-red-300 font-mono">{signal.name}</span>
                                        <div className="flex gap-1">
                                          <span className={`px-1 rounded ${signal.value ? 'bg-red-700 text-red-200' : 'bg-gray-700 text-gray-400'}`}>
                                            {signal.value ? 'TRUE' : 'FALSE'}
                                          </span>
                                          <span className="px-1 bg-blue-900 text-blue-200 rounded">
                                            {signal.weight?.toFixed(2)}
                                          </span>
                                          <span className="px-1 bg-yellow-900 text-yellow-200 rounded">
                                            {signal.confidence?.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                      {signal.details && (
                                        <div className="text-gray-400 mt-1 text-[8px]">{signal.details}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Neutral Signals */}
                            {entry.chaos_discerned.sorting_signals.neutral && entry.chaos_discerned.sorting_signals.neutral.length > 0 && (
                              <div className="mb-2">
                                <div className="text-gray-400 text-[10px] mb-1">NEUTRAL SIGNALS ({entry.chaos_discerned.sorting_signals.neutral.length}):</div>
                                <div className="space-y-1">
                                  {entry.chaos_discerned.sorting_signals.neutral.map((signal: any, signalIndex: number) => (
                                    <div key={`${entry.timestamp}-neutral-${signalIndex}`} className="bg-gray-800 border border-gray-600 p-1 rounded text-[9px]">
                                      <div className="flex justify-between items-start">
                                        <span className="text-gray-300 font-mono">{signal.name}</span>
                                        <div className="flex gap-1">
                                          <span className={`px-1 rounded ${signal.value ? 'bg-gray-600 text-gray-200' : 'bg-gray-700 text-gray-400'}`}>
                                            {signal.value ? 'TRUE' : 'FALSE'}
                                          </span>
                                          <span className="px-1 bg-blue-900 text-blue-200 rounded">
                                            {signal.weight?.toFixed(2)}
                                          </span>
                                          <span className="px-1 bg-yellow-900 text-yellow-200 rounded">
                                            {signal.confidence?.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                      {signal.details && (
                                        <div className="text-gray-400 mt-1 text-[8px]">{signal.details}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No Signals Message */}
                            {(!entry.chaos_discerned.sorting_signals.long || entry.chaos_discerned.sorting_signals.long.length === 0) &&
                             (!entry.chaos_discerned.sorting_signals.short || entry.chaos_discerned.sorting_signals.short.length === 0) &&
                             (!entry.chaos_discerned.sorting_signals.neutral || entry.chaos_discerned.sorting_signals.neutral.length === 0) && (
                              <div className="text-gray-500 text-[10px] italic">No sorting signals available</div>
                            )}
                          </div>
                        )}

                        {/* Reasoning */}
                        {entry.chaos_discerned.reasoning && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="text-gray-400 mb-1">Reasoning:</div>
                            <div className="text-gray-300 text-[10px]">{entry.chaos_discerned.reasoning}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 