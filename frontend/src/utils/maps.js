export function getDeliveryAddressText(item) {
  return [item.address, item.number, item.district, item.city, item.state].filter(Boolean).join(', ');
}

export function buildMapSearchEmbedUrl(item) {
  const query = getDeliveryAddressText(item);
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function buildRouteEmbedUrl(items) {
  const points = items
    .map((item) => [item.address, item.number, item.district, item.city, item.state].filter(Boolean).join(', '))
    .filter(Boolean);

  if (points.length <= 1) {
    return `https://www.google.com/maps?q=${encodeURIComponent(points[0] || '')}&output=embed`;
  }

  const origin = points[0];
  const stops = points.slice(1).join(' to: ');
  const params = new URLSearchParams({
    f: 'd',
    source: 's_d',
    saddr: origin,
    daddr: stops,
    output: 'embed',
  });

  return `https://www.google.com/maps?${params.toString()}`;
}
