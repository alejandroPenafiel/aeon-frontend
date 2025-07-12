import React from 'react';
import type { CategorisedSignals } from '../types';

interface SignalsByCategoryProps {
  categorisedSignals: CategorisedSignals;
}

const SignalsByCategory: React.FC<SignalsByCategoryProps> = ({ categorisedSignals }) => {
  const categories = Object.keys(categorisedSignals); 

  if (categories.length === 0) {
    return <div className="terminal-block">No signal categories available.</div>;
  }

  return (
    <div className="terminal-block">
      <div className="terminal-block-header">Signals by Category</div>
      <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category} className="border border-gray-700 p-2">
            <h3 className="font-bold text-lg capitalize">{category.replace(/_/g, ' ')}</h3>
            <p><strong>Count:</strong> {categorisedSignals[category].count}</p>
            <p><strong>Weight:</strong> {categorisedSignals[category].weight.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalsByCategory; 