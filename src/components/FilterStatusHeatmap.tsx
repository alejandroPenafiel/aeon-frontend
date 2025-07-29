import React, { useMemo } from 'react';

interface FilterStatusHeatmapProps {
  filterStatus: any[];
}

interface HeatmapCell {
  x: number; // timestamp index
  y: string; // variable name
  value: boolean;
  color: string;
  actualValue: string; // Store the actual value for tooltip
}

export const FilterStatusHeatmap: React.FC<FilterStatusHeatmapProps> = ({ filterStatus }) => {
  // Extract all unique variables from filter_status based on actual schema
  const variables = useMemo(() => {
    if (!filterStatus || filterStatus.length === 0) return [];
    
    const allVariables = new Set<string>();
    
    filterStatus.forEach((status: any) => {
      // Add main filters based on actual schema structure
      if (status.trend_filter) {
        allVariables.add('trend_filter.status');
        allVariables.add('trend_filter.filter_enabled');
        allVariables.add('trend_filter.trade_direction');
        allVariables.add('trend_filter.macd_trend');
      }
      
      if (status.volatility_filter) {
        allVariables.add('volatility_filter.status');
        allVariables.add('volatility_filter.filter_enabled');
        allVariables.add('volatility_filter.strategy_context');
      }
      
      if (status.levels_filter) {
        allVariables.add('levels_filter.status');
        if (status.levels_filter.resistance_analysis) {
          allVariables.add('levels_filter.resistance_analysis.breakout_signal');
          allVariables.add('levels_filter.resistance_analysis.near_resistance');
        }
        if (status.levels_filter.support_analysis) {
          allVariables.add('levels_filter.support_analysis.breakdown_signal');
          allVariables.add('levels_filter.support_analysis.near_support');
        }
      }
      
      if (status.combined_vwap_filter) {
        allVariables.add('combined_vwap_filter.status');
        allVariables.add('combined_vwap_filter.filter_enabled');
      }
      
      if (status.underused_alpha_filter) {
        allVariables.add('underused_alpha_filter.status');
        allVariables.add('underused_alpha_filter.filter_enabled');
      }
      
      if (status.chaos_discerned) {
        allVariables.add('chaos_discerned.state');
        allVariables.add('chaos_discerned.sentiment');
        allVariables.add('chaos_discerned.position_type');
        
        // Add sorting signals
        if (status.chaos_discerned.sorting_signals) {
          const { long, short, neutral } = status.chaos_discerned.sorting_signals;
          
          // Add long signals with direction prefix
          (long || []).forEach((signal: any) => {
            allVariables.add(`signal.LONG_${signal.name}`);
          });
          
          // Add short signals with direction prefix
          (short || []).forEach((signal: any) => {
            allVariables.add(`signal.SHORT_${signal.name}`);
          });
          
          // Add neutral signals with direction prefix
          (neutral || []).forEach((signal: any) => {
            allVariables.add(`signal.NEUTRAL_${signal.name}`);
          });
        }
      }
      
      if (status.final_trade_decision) {
        allVariables.add('final_trade_decision');
      }
    });
    
    // Create a custom ordering to group related filters together
    const variableOrder = [
      // Final trade decision (at the top)
      'final_trade_decision',
      
      // All filter statuses
      'trend_filter.status',
      'volatility_filter.status',
      'levels_filter.status',
      'combined_vwap_filter.status',
      'underused_alpha_filter.status',
      
      // Chaos discerned
      'chaos_discerned.state',
      'chaos_discerned.sentiment', 
      'chaos_discerned.position_type',
      
      // All filter enabled states
      'trend_filter.filter_enabled',
      'volatility_filter.filter_enabled',
      'combined_vwap_filter.filter_enabled',
      'underused_alpha_filter.filter_enabled',
      
      // Trend filter specific
      'trend_filter.trade_direction',
      'trend_filter.macd_trend',
      
      // Volatility filter specific
      'volatility_filter.strategy_context',
      
      // Levels filter specific
      'levels_filter.resistance_analysis.breakout_signal',
      'levels_filter.resistance_analysis.near_resistance',
      'levels_filter.support_analysis.breakdown_signal',
      'levels_filter.support_analysis.near_support',
      
      // Separator between filters and signals
      '---SEPARATOR---',
      
      // Signal group (will be added dynamically)
      // ... signals will be inserted here
    ];
    
    // Get all variables and sort them according to our custom order
    const allVariablesArray = Array.from(allVariables);
    const sortedVariables: string[] = [];
    
    // First, add variables in our custom order
    variableOrder.forEach(variable => {
      if (allVariablesArray.includes(variable)) {
        sortedVariables.push(variable);
      }
    });
    
    // Then add any remaining variables (like signals) in alphabetical order
    const remainingVariables = allVariablesArray.filter(variable => !sortedVariables.includes(variable));
    remainingVariables.sort().forEach(variable => {
      sortedVariables.push(variable);
    });
    
    return sortedVariables;
  }, [filterStatus]);

  // Helper function to find signal by name
  const findSignalByName = (status: any, signalName: string) => {
    if (status.chaos_discerned?.sorting_signals) {
      const { long, short, neutral } = status.chaos_discerned.sorting_signals;
      
      // Extract direction and actual signal name
      let direction = '';
      let actualSignalName = signalName;
      
      if (signalName.startsWith('LONG_')) {
        direction = 'LONG';
        actualSignalName = signalName.replace('LONG_', '');
        const foundSignal = (long || []).find((signal: any) => signal.name === actualSignalName);
        return foundSignal ? { ...foundSignal, direction } : null;
      } else if (signalName.startsWith('SHORT_')) {
        direction = 'SHORT';
        actualSignalName = signalName.replace('SHORT_', '');
        const foundSignal = (short || []).find((signal: any) => signal.name === actualSignalName);
        return foundSignal ? { ...foundSignal, direction } : null;
      } else if (signalName.startsWith('NEUTRAL_')) {
        direction = 'NEUTRAL';
        actualSignalName = signalName.replace('NEUTRAL_', '');
        const foundSignal = (neutral || []).find((signal: any) => signal.name === actualSignalName);
        return foundSignal ? { ...foundSignal, direction } : null;
      }
      
      // Fallback for old format (without direction prefix)
      const allSignals = [...(long || []), ...(short || []), ...(neutral || [])];
      const foundSignal = allSignals.find((signal: any) => signal.name === signalName);
      return foundSignal;
    }
    return null;
  };

  // Generate heatmap data based on actual schema structure
  const heatmapData = useMemo(() => {
    if (!filterStatus || filterStatus.length === 0) return [];
    
    const cells: HeatmapCell[] = [];
    
    filterStatus.forEach((status: any, timestampIndex: number) => {
      variables.forEach((variable: string) => {
        let value = false;
        let color = '#374151'; // Default gray
        let actualValue = 'N/A';
        
        // Handle signals separately
        if (variable.startsWith('signal.')) {
          const signalName = variable.replace('signal.', '');
          const current = findSignalByName(status, signalName);
          
          if (current) {
            value = current.value;
            actualValue = current.value ? 'TRUE' : 'FALSE';
            
            // Signal color logic with confidence-based intensity
            if (current.value) {
              // Active signals - use confidence for intensity
              const confidence = (current.confidence || 0) * 100;
              const intensity = Math.max(0.3, Math.min(1, confidence / 100)); // Min 30% opacity, max 100%
              
              // Use direction from the signal array (LONG/SHORT/NEUTRAL) instead of is_bullish
              const direction = current.direction || (current.is_bullish ? 'LONG' : 'SHORT');
              
              if (direction === 'LONG') {
                // Green for long/bullish signals with confidence-based intensity
                color = `rgba(34, 197, 94, ${intensity})`; // Green with intensity
              } else if (direction === 'SHORT') {
                // Red for short/bearish signals with confidence-based intensity
                color = `rgba(239, 68, 68, ${intensity})`; // Red with intensity
              } else {
                // Yellow for neutral signals with confidence-based intensity
                color = `rgba(245, 158, 11, ${intensity})`; // Yellow with intensity
              }
              
              // Update actual value to include direction and confidence
              actualValue = `${current.value ? 'TRUE' : 'FALSE'} (${direction} ${confidence.toFixed(1)}%)`;
            } else {
              // Inactive signals - use weight for intensity if available
              const weight = current.weight || 0;
              const intensity = Math.max(0.1, Math.min(0.5, weight / 2)); // Min 10% opacity, max 50%
              const direction = current.direction || (current.is_bullish ? 'LONG' : 'SHORT');
              color = `rgba(59, 130, 246, ${intensity})`; // Blue with intensity
              
              // Update actual value to include direction and weight
              actualValue = `${current.value ? 'TRUE' : 'FALSE'} (${direction} w: ${weight.toFixed(2)})`;
            }
          }
        } else {
          // Extract value based on actual schema structure for filters
          const path = variable.split('.');
          let current: any = status;
          for (const key of path) {
            if (current && typeof current === 'object' && key in current) {
              current = current[key];
            } else {
              current = null;
              break;
            }
          }
          
          if (current !== null && current !== undefined) {
            // Store actual value for tooltip
            if (typeof current === 'string') {
              actualValue = current;
            } else if (typeof current === 'boolean') {
              actualValue = current ? 'TRUE' : 'FALSE';
            } else if (typeof current === 'number') {
              actualValue = current.toString();
            } else {
              actualValue = JSON.stringify(current);
            }
            
            // Determine value and color based on schema structure
            if (typeof current === 'boolean') {
              value = current;
              color = current ? '#22c55e' : '#ef4444'; // Green for true, red for false
            } else if (typeof current === 'string') {
              const upperCurrent = current.toUpperCase();
              
              // Handle status fields (Passed/Blocked)
              if (variable.includes('.status')) {
                value = upperCurrent === 'PASSED';
                color = upperCurrent === 'PASSED' ? '#22c55e' : '#991b1b'; // Green for passed, deep maroon for blocked
              }
              // Handle trade direction (long/short)
              else if (variable.includes('trade_direction')) {
                value = upperCurrent === 'LONG';
                color = upperCurrent === 'LONG' ? '#22c55e' : '#ef4444'; // Green for long, red for short
              }
              // Handle MACD trend (increasing/decreasing)
              else if (variable.includes('macd_trend')) {
                value = upperCurrent === 'INCREASING';
                color = upperCurrent === 'INCREASING' ? '#22c55e' : '#ef4444'; // Green for increasing, red for decreasing
              }
              // Handle final trade decision (Allowed/Blocked)
              else if (variable === 'final_trade_decision') {
                value = upperCurrent === 'ALLOWED';
                color = upperCurrent === 'ALLOWED' ? '#22c55e' : '#991b1b'; // Green for allowed, deep maroon for blocked
              }
              // Handle chaos discerned sentiment and position type
              else if (variable.includes('chaos_discerned.sentiment') || variable.includes('chaos_discerned.position_type')) {
                value = upperCurrent.includes('BULLISH') || upperCurrent.includes('LONG');
                if (upperCurrent.includes('BULLISH') || upperCurrent.includes('LONG')) {
                  color = '#22c55e'; // Green for bullish/long
                } else if (upperCurrent.includes('BEARISH') || upperCurrent.includes('SHORT')) {
                  color = '#ef4444'; // Red for bearish/short
                } else {
                  color = '#f59e0b'; // Yellow for neutral
                }
              }
              // Handle chaos_discerned.state with specific colors
              else if (variable === 'chaos_discerned.state') {
                value = true; // Always show as active since it has a value
                if (upperCurrent === 'BANG') {
                  color = '#9333ea'; // Purple for BANG
                } else if (upperCurrent === 'AIM') {
                  color = '#3b82f6'; // Blue for AIM
                } else if (upperCurrent === 'LOADED') {
                  color = '#22c55e'; // Green for LOADED
                } else if (upperCurrent === 'IDLE') {
                  color = '#f59e0b'; // Yellow for IDLE
                } else {
                  color = '#f59e0b'; // Yellow for other states
                }
              }
              // Handle other string values
              else {
                value = upperCurrent.length > 0; // Any non-empty string is considered active
                color = '#22c55e'; // Green for other active values
              }
            } else if (typeof current === 'number') {
              value = current > 0;
              color = current > 0 ? '#22c55e' : '#ef4444'; // Green for positive, red for negative/zero
            }
          }
        }
        
        cells.push({
          x: timestampIndex,
          y: variable,
          value,
          color,
          actualValue
        });
      });
    });
    
    return cells;
  }, [filterStatus, variables]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!filterStatus || filterStatus.length === 0) {
    return (
      <div className="bg-black border border-gray-700 p-4">
        <div className="text-gray-400 text-center">No filter status data available</div>
      </div>
    );
  }

  const cellSize = 12;
  const cellGap = 1;
  const headerHeight = 30;
  const yAxisWidth = 200;
  const chartHeight = variables.length * (cellSize + cellGap) + headerHeight;
  const chartWidth = filterStatus.length * (cellSize + cellGap) + yAxisWidth;

  return (
    <div className="bg-black border border-gray-700 p-4 overflow-auto">
      <div className="text-purple-400 font-bold mb-4">Filter Status Heatmap</div>
      
      <div 
        className="relative"
        style={{ 
          width: chartWidth, 
          height: chartHeight,
          minWidth: '100%'
        }}
      >
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0" style={{ width: yAxisWidth, height: chartHeight }}>
          <div 
            className="absolute top-0 left-0 w-full text-xs text-gray-400 font-mono"
            style={{ height: headerHeight, lineHeight: `${headerHeight}px` }}
          >
            Variables
          </div>
          {variables.map((variable, index) => {
            if (variable === '---SEPARATOR---') {
              return (
                <div
                  key={variable}
                  className="absolute left-0 text-xs text-gray-500 font-mono"
                  style={{
                    top: headerHeight + index * (cellSize + cellGap),
                    width: yAxisWidth - 10,
                    height: cellSize,
                    lineHeight: `${cellSize}px`,
                    paddingLeft: 5,
                    borderTop: '1px solid #6b7280',
                    borderBottom: '1px solid #6b7280',
                    backgroundColor: '#374151'
                  }}
                  title="Separator"
                >
                  ─── SIGNALS ───
                </div>
              );
            }
            
            return (
              <div
                key={variable}
                className="absolute left-0 text-xs text-gray-300 font-mono truncate"
                style={{
                  top: headerHeight + index * (cellSize + cellGap),
                  width: yAxisWidth - 10,
                  height: cellSize,
                  lineHeight: `${cellSize}px`,
                  paddingLeft: 5
                }}
                title={variable}
              >
                {variable}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div 
          className="absolute top-0 text-xs text-gray-400 font-mono text-center"
          style={{ 
            left: yAxisWidth, 
            height: headerHeight, 
            width: chartWidth - yAxisWidth 
          }}
        >
          {filterStatus.map((status, index) => (
            <div
              key={status.timestamp}
              className="absolute text-xs text-gray-300 font-mono"
              style={{
                left: index * (cellSize + cellGap),
                width: cellSize,
                height: headerHeight,
                lineHeight: `${headerHeight}px`,
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left'
              }}
              title={formatTimestamp(status.timestamp)}
            >
              {formatTimestamp(status.timestamp)}
            </div>
          ))}
        </div>

        {/* Heatmap cells */}
        {heatmapData.map((cell, index) => {
          // Skip rendering cells for the separator
          if (cell.y === '---SEPARATOR---') {
            return null;
          }
          
          return (
            <div
              key={`${cell.x}-${cell.y}`}
              className="absolute border border-gray-800"
              style={{
                left: yAxisWidth + cell.x * (cellSize + cellGap),
                top: headerHeight + variables.indexOf(cell.y) * (cellSize + cellGap),
                width: cellSize,
                height: cellSize,
                backgroundColor: cell.color,
                opacity: cell.value ? 1 : 0.1,
                transition: 'all 0.2s ease'
              }}
              title={`${cell.y}: ${cell.actualValue}`}
            />
          );
        })}
      </div>
    </div>
  );
}; 