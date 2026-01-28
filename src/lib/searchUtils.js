// Search and Filter utilities
export const searchWallets = (wallets, searchTerm) => {
  if (!searchTerm.trim()) return wallets;
  
  const term = searchTerm.toLowerCase();
  return wallets.filter(w => 
    w.name.toLowerCase().includes(term) ||
    w.address.toLowerCase().includes(term) ||
    w.chain.toLowerCase().includes(term)
  );
};

export const filterWalletsByChain = (wallets, chain) => {
  if (!chain || chain === 'all') return wallets;
  return wallets.filter(w => w.chain === chain);
};

export const filterWalletsByBalance = (wallets, minBalance, maxBalance) => {
  return wallets.filter(w => {
    const balance = w.balanceUSD || 0;
    return balance >= minBalance && balance <= maxBalance;
  });
};

export const searchAIMessages = (messages, searchTerm) => {
  if (!searchTerm.trim()) return messages;
  
  const term = searchTerm.toLowerCase();
  return messages.filter(m =>
    m.text.toLowerCase().includes(term) ||
    m.sender.toLowerCase().includes(term)
  );
};

export const filterAIByProvider = (messages, provider) => {
  if (!provider || provider === 'all') return messages;
  return messages.filter(m => m.provider === provider);
};

export const getUniqueChains = (wallets) => {
  return [...new Set(wallets.map(w => w.chain))];
};

export const getUniqueProviders = (messages) => {
  return [...new Set(messages.filter(m => m.provider).map(m => m.provider))];
};

export const sortWalletsByBalance = (wallets, order = 'desc') => {
  return [...wallets].sort((a, b) => {
    const aBalance = a.balanceUSD || 0;
    const bBalance = b.balanceUSD || 0;
    return order === 'desc' ? bBalance - aBalance : aBalance - bBalance;
  });
};
