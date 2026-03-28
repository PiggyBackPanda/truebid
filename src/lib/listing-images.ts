const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", // house with pool
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", // suburban house
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", // modern exterior
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", // contemporary home
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", // classic house
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", // luxury home
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800", // house exterior
  "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800", // apartment building
];

export function getListingFallbackImage(seed: string): string {
  const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}
