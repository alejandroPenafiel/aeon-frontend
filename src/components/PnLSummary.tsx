import React from 'react';

export function PnLSummary({ data }: { data: any }) {
  if (!data || !data.margin_summary) {
    return <div className="terminal-block">Waiting for PnL data...</div>;
  }

  const {
    margin_summary,
    account_address,
    timestamp,
  } = data;

  return (
    <div className="terminal-block">
      <table className="terminal-body">
        <tbody>
          <tr>
            <td>ACCOUNT ADDRESS</td>
            <td>:</td>
            <td>{account_address}</td>
          </tr>
          <tr>
            <td>ACCOUNT VALUE</td>
            <td>:</td>
            <td>${parseFloat(margin_summary.accountValue).toFixed(6)}</td>
          </tr>
          <tr>
            <td>MARGIN USED</td>
            <td>:</td>
            <td>{margin_summary.totalMarginUsed}</td>
          </tr>
          <tr>
            <td>NET POSITION</td>
            <td>:</td>
            <td>{margin_summary.totalNtlPos}</td>
          </tr>
          <tr>
            <td>RAW USD</td>
            <td>:</td>
            <td>{margin_summary.totalRawUsd}</td>
          </tr>
          <tr>
            <td>UPDATED AT</td>
            <td>:</td>
            <td>{new Date(timestamp).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 