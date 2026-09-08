/// <reference types="google.maps" />

export async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const { results } = await geocoder.geocode({ address });
  if (!results || results.length === 0) {
    throw new Error(`Couldn't find a location for "${address}".`);
  }
  const { lat, lng } = results[0].geometry.location;
  return {
    lat: lat(),
    lng: lng(),
    formattedAddress: results[0].formatted_address,
  };
}

export async function reverseGeocode(
  geocoder: google.maps.Geocoder,
  lat: number,
  lng: number
): Promise<string> {
  const { results } = await geocoder.geocode({ location: { lat, lng } });
  if (!results || results.length === 0) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  return results[0].formatted_address;
}
