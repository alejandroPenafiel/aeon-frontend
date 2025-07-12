

export function PnLSummary({ data }: { data: any }) {
  // Defensive check for data and its structure
  if (!data || typeof data.margin_summary !== 'object' || data.margin_summary === null) {
    return <div className="terminal-block">Waiting for PnL data...</div>;
  }

  // Safely access each piece of data with defaults
  const summary = data.margin_summary;
  const accountValue = summary?.accountValue ?? 0;
  const totalMarginUsed = summary?.totalMarginUsed ?? 'N/A';
  const totalNtlPos = summary?.totalNtlPos ?? 'N/A';
  const totalRawUsd = summary?.totalRawUsd ?? 'N/A';
  const accountAddress = data.account_address ?? 'N/A';
  const timestamp = data.timestamp;

  return (
    <div className="terminal-block">
      <table className="terminal-body">
        <tbody>
          <tr>
            <td>ACCOUNT ADDRESS</td>
            <td>:</td>
            <td>{accountAddress}</td>
          </tr>
          <tr>
            <td>ACCOUNT VALUE</td>
            <td>:</td>
            <td>${parseFloat(accountValue).toFixed(6)}</td>
          </tr>
          <tr>
            <td>MARGIN USED</td>
            <td>:</td>
            <td>{totalMarginUsed}</td>
          </tr>
          <tr>
            <td>NET POSITION</td>
            <td>:</td>
            <td>{totalNtlPos}</td>
          </tr>
          <tr>
            <td>RAW USD</td>
            <td>:</td>
            <td>{totalRawUsd}</td>
          </tr>
          <tr>
            <td>UPDATED AT</td>
            <td>:</td>
            <td>{timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 