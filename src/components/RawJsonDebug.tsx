import React from 'react';
import type { AssetPayload } from '../types';

interface RawJsonDebugProps {
  rawPayload: AssetPayload;
  collapsed: boolean;
  onToggle: () => void;
}

const RawJsonDebug: React.FC<RawJsonDebugProps> = () => {
  return (
    <div>RawJsonDebug (stub)</div>
  );
};

export default RawJsonDebug; 