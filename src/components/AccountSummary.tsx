import React from 'react';
import type { AccountData } from '../websocketTypes';

interface AccountSummaryProps {
  accountData: AccountData | null;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({ accountData }) => {
  if (!accountData) {
    return <div className="terminal-block">Waiting for account data...</div>;
  }

  return (
    <div className="terminal-block">
      <div className="title-bar">ACCOUNT SUMMARY</div>
      
      {/* Mobile-friendly layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-400">ACCOUNT ADDRESS</div>
          <div className="text-sm font-mono break-all">{accountData.account_address || 'N/A'}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">ACCOUNT VALUE</div>
          <div className="text-sm font-mono">${(parseFloat(accountData.margin_summary.accountValue) || 0).toFixed(2)}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">MARGIN USED</div>
          <div className="text-sm font-mono">{accountData.margin_summary.totalMarginUsed || 'N/A'}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">NET POSITION</div>
          <div className="text-sm font-mono">{accountData.margin_summary.totalNtlPos || 'N/A'}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">RAW USD</div>
          <div className="text-sm font-mono">{accountData.margin_summary.totalRawUsd || 'N/A'}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">UPDATED AT</div>
          <div className="text-sm font-mono">{accountData.timestamp ? new Date(accountData.timestamp).toLocaleString() : 'N/A'}</div>
        </div>
      </div>
      
      {/* Desktop table layout (hidden on mobile) */}
      <table className="terminal-body hidden sm:table w-full">
        <tbody>
          <tr>
            <td>ACCOUNT ADDRESS</td>
            <td>:</td>
            <td>{accountData.account_address || 'N/A'}</td>
          </tr>
          <tr>
            <td>ACCOUNT VALUE</td>
            <td>:</td>
            <td>${(parseFloat(accountData.margin_summary.accountValue) || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>MARGIN USED</td>
            <td>:</td>
            <td>{accountData.margin_summary.totalMarginUsed || 'N/A'}</td>
          </tr>
          <tr>
            <td>NET POSITION</td>
            <td>:</td>
            <td>{accountData.margin_summary.totalNtlPos || 'N/A'}</td>
          </tr>
          <tr>
            <td>RAW USD</td>
            <td>:</td>
            <td>{accountData.margin_summary.totalRawUsd || 'N/A'}</td>
          </tr>
          <tr>
            <td>UPDATED AT</td>
            <td>:</td>
            <td>{accountData.timestamp ? new Date(accountData.timestamp).toLocaleString() : 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
