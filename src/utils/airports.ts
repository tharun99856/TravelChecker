/**
 * IATA airport code mapping for Indian cities.
 * Covers all major commercial airports across India.
 */
const airportCodes: Record<string, string> = {
  // Major Metros
  'Delhi':              'DEL',
  'Mumbai':             'BOM',
  'Bangalore':          'BLR',
  'Hyderabad':          'HYD',
  'Chennai':            'MAA',
  'Kolkata':            'CCU',
  'Pune':               'PNQ',
  'Ahmedabad':          'AMD',
  'Jaipur':             'JAI',

  // Andhra Pradesh
  'Visakhapatnam':      'VTZ',
  'Vijayawada':         'VGA',
  'Tirupati':           'TIR',
  'Rajahmundry':        'RJA',
  'Kadapa':             'CDP',
  'Kurnool':            'KJB',

  // Telangana
  'Warangal':           'WGC',

  // Karnataka
  'Mangalore':          'IXE',
  'Hubli':              'HBX',
  'Mysore':             'MYQ',
  'Belgaum':            'IXG',

  // Tamil Nadu
  'Coimbatore':         'CJB',
  'Madurai':            'IXM',
  'Trichy':             'TRZ',
  'Salem':              'SXV',

  // Kerala
  'Thiruvananthapuram': 'TRV',
  'Kochi':              'COK',
  'Kozhikode':          'CCJ',

  // Maharashtra
  'Nagpur':             'NAG',
  'Nashik':             'ISK',
  'Aurangabad':         'IXU',
  'Kolhapur':           'KLH',

  // Gujarat
  'Surat':              'STV',
  'Vadodara':           'BDQ',
  'Rajkot':             'RAJ',

  // Rajasthan
  'Jodhpur':            'JDH',
  'Udaipur':            'UDR',
  'Jaisalmer':          'JSA',

  // Uttar Pradesh
  'Lucknow':            'LKO',
  'Varanasi':           'VNS',
  'Agra':               'AGR',
  'Kanpur':             'KNU',
  'Prayagraj':          'IXD',
  'Gorakhpur':          'GOP',
  'Ayodhya':            'AYJ',

  // Madhya Pradesh
  'Bhopal':             'BHO',
  'Indore':             'IDR',
  'Jabalpur':           'JLR',
  'Gwalior':            'GWL',
  'Khajuraho':          'HJR',

  // Bihar
  'Patna':              'PAT',
  'Gaya':               'GAY',

  // West Bengal
  'Siliguri':           'IXB',

  // Odisha
  'Bhubaneswar':        'BBI',

  // Jharkhand
  'Ranchi':             'IXR',
  'Jamshedpur':         'IXW',

  // Chhattisgarh
  'Raipur':             'RPR',
  'Bilaspur':           'PAB',

  // Punjab / Chandigarh
  'Chandigarh':         'IXC',
  'Amritsar':           'ATQ',
  'Ludhiana':           'LUH',

  // Uttarakhand
  'Dehradun':           'DED',

  // Himachal Pradesh
  'Shimla':             'SLV',
  'Dharamshala':        'DHM',

  // J&K / Ladakh
  'Srinagar':           'SXR',
  'Jammu':              'IXJ',
  'Leh':                'IXL',

  // Goa
  'Goa':                'GOI',

  // Northeast
  'Guwahati':           'GAU',
  'Dibrugarh':          'DIB',
  'Imphal':             'IMF',
  'Shillong':           'SHL',
  'Agartala':           'IXA',
  'Aizawl':             'AJL',
  'Itanagar':           'HGI',
};

export function getIataCode(cityName: string): string | null {
  return airportCodes[cityName] ?? null;
}

export function hasAirport(cityName: string): boolean {
  return cityName in airportCodes;
}
