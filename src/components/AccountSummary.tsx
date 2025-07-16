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
      <table className="terminal-body">
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
