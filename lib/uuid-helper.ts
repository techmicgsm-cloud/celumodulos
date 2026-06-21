export function getUuidRange(prefix: string) {
  const clean = prefix.toLowerCase().replace(/-/g, '');
  if (clean.length > 32) return null;
  
  const minClean = clean.padEnd(32, '0');
  const maxClean = clean.padEnd(32, 'f');
  
  const formatUuid = (hex: string) => 
    `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
    
  return {
    min: formatUuid(minClean),
    max: formatUuid(maxClean)
  };
}
