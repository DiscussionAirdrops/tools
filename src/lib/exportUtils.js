// Export utility functions for CSV and JSON
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    csv += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportToJSON = (data, filename = 'export.json') => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Format data for export
export const formatWalletsForExport = (wallets) => {
  return wallets.map(w => ({
    name: w.name,
    address: w.address,
    chain: w.chain,
    balance: w.balance || 0,
    balanceUSD: w.balanceUSD || 0,
    price: w.price || 0,
    lastUpdated: w.lastUpdated?.toDate?.() || new Date()
  }));
};

export const formatAIChatForExport = (messages, provider) => {
  return messages.map(m => ({
    provider: provider,
    role: m.sender === 'user' ? 'user' : 'ai',
    message: m.text,
    timestamp: m.timestamp?.toDate?.() || new Date()
  }));
};
