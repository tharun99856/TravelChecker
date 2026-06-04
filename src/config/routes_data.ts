import { Location } from '../utils/types.js';

export const locations: Location[] = [
  // ── Major Metros ───────────────────────────────────────────────────────────
  { name: 'Delhi',            state: 'Delhi',             lat: 28.6139, lng: 77.2090, populationTier: 'metro' },
  { name: 'Mumbai',           state: 'Maharashtra',       lat: 19.0760, lng: 72.8777, populationTier: 'metro' },
  { name: 'Bangalore',        state: 'Karnataka',         lat: 12.9716, lng: 77.5946, populationTier: 'metro' },
  { name: 'Hyderabad',        state: 'Telangana',         lat: 17.3850, lng: 78.4867, populationTier: 'metro' },
  { name: 'Chennai',          state: 'Tamil Nadu',        lat: 13.0827, lng: 80.2707, populationTier: 'metro' },
  { name: 'Kolkata',          state: 'West Bengal',       lat: 22.5726, lng: 88.3639, populationTier: 'metro' },
  { name: 'Pune',             state: 'Maharashtra',       lat: 18.5204, lng: 73.8567, populationTier: 'metro' },
  { name: 'Ahmedabad',        state: 'Gujarat',           lat: 23.0225, lng: 72.5714, populationTier: 'metro' },
  { name: 'Jaipur',           state: 'Rajasthan',         lat: 26.9124, lng: 75.7873, populationTier: 'metro' },

  // ── Andhra Pradesh ─────────────────────────────────────────────────────────
  { name: 'Visakhapatnam',    state: 'Andhra Pradesh',    lat: 17.6868, lng: 83.2185, populationTier: 'city' },
  { name: 'Vijayawada',       state: 'Andhra Pradesh',    lat: 16.5062, lng: 80.6480, populationTier: 'city' },
  { name: 'Guntur',           state: 'Andhra Pradesh',    lat: 16.3067, lng: 80.4365, populationTier: 'city' },
  { name: 'Tirupati',         state: 'Andhra Pradesh',    lat: 13.6288, lng: 79.4192, populationTier: 'city' },
  { name: 'Nellore',          state: 'Andhra Pradesh',    lat: 14.4426, lng: 79.9865, populationTier: 'city' },
  { name: 'Kurnool',          state: 'Andhra Pradesh',    lat: 15.8281, lng: 78.0373, populationTier: 'city' },
  { name: 'Rajahmundry',      state: 'Andhra Pradesh',    lat: 17.0005, lng: 81.8040, populationTier: 'city' },
  { name: 'Kakinada',         state: 'Andhra Pradesh',    lat: 16.9891, lng: 82.2475, populationTier: 'city' },
  { name: 'Anantapur',        state: 'Andhra Pradesh',    lat: 14.6819, lng: 77.6006, populationTier: 'city' },
  { name: 'Kadapa',           state: 'Andhra Pradesh',    lat: 14.4673, lng: 78.8242, populationTier: 'city' },
  { name: 'Eluru',            state: 'Andhra Pradesh',    lat: 16.7107, lng: 81.1031, populationTier: 'city' },
  { name: 'Ongole',           state: 'Andhra Pradesh',    lat: 15.5057, lng: 80.0499, populationTier: 'city' },
  { name: 'Srikakulam',       state: 'Andhra Pradesh',    lat: 18.3000, lng: 83.9000, populationTier: 'town' },
  { name: 'Machilipatnam',    state: 'Andhra Pradesh',    lat: 16.1817, lng: 81.1350, populationTier: 'town' },
  { name: 'Amaravati',        state: 'Andhra Pradesh',    lat: 16.5115, lng: 80.5186, populationTier: 'town' },
  { name: 'Tirumala',         state: 'Andhra Pradesh',    lat: 13.6833, lng: 79.3500, populationTier: 'small_town' },
  { name: 'Srisailam',        state: 'Andhra Pradesh',    lat: 16.0722, lng: 78.8687, populationTier: 'small_town' },

  // ── Telangana ──────────────────────────────────────────────────────────────
  { name: 'Warangal',         state: 'Telangana',         lat: 17.9784, lng: 79.5941, populationTier: 'city' },
  { name: 'Karimnagar',       state: 'Telangana',         lat: 18.4386, lng: 79.1288, populationTier: 'city' },
  { name: 'Nizamabad',        state: 'Telangana',         lat: 18.6725, lng: 78.0941, populationTier: 'city' },
  { name: 'Khammam',          state: 'Telangana',         lat: 17.2473, lng: 80.1514, populationTier: 'city' },
  { name: 'Mahbubnagar',      state: 'Telangana',         lat: 16.7437, lng: 77.9866, populationTier: 'city' },
  { name: 'Nalgonda',         state: 'Telangana',         lat: 17.0500, lng: 79.2700, populationTier: 'city' },
  { name: 'Adilabad',         state: 'Telangana',         lat: 19.6738, lng: 78.5350, populationTier: 'town' },
  { name: 'Siddipet',         state: 'Telangana',         lat: 18.1018, lng: 78.8520, populationTier: 'town' },
  { name: 'Suryapet',         state: 'Telangana',         lat: 17.1353, lng: 79.6268, populationTier: 'town' },
  { name: 'Miryalaguda',      state: 'Telangana',         lat: 16.8741, lng: 79.5630, populationTier: 'town' },
  { name: 'Jagtial',          state: 'Telangana',         lat: 18.7997, lng: 78.9103, populationTier: 'town' },
  { name: 'Bhadrachalam',     state: 'Telangana',         lat: 17.6685, lng: 80.8858, populationTier: 'small_town' },
  { name: 'Basara',           state: 'Telangana',         lat: 18.8821, lng: 77.9542, populationTier: 'small_town' },

  // ── Karnataka ──────────────────────────────────────────────────────────────
  { name: 'Mysore',           state: 'Karnataka',         lat: 12.2958, lng: 76.6394, populationTier: 'city' },
  { name: 'Hubli',            state: 'Karnataka',         lat: 15.3647, lng: 75.1240, populationTier: 'city' },
  { name: 'Mangalore',        state: 'Karnataka',         lat: 12.9141, lng: 74.8560, populationTier: 'city' },
  { name: 'Belgaum',          state: 'Karnataka',         lat: 15.8497, lng: 74.4977, populationTier: 'city' },
  { name: 'Hampi',            state: 'Karnataka',         lat: 15.3350, lng: 76.4600, populationTier: 'small_town' },

  // ── Tamil Nadu ─────────────────────────────────────────────────────────────
  { name: 'Coimbatore',       state: 'Tamil Nadu',        lat: 11.0168, lng: 76.9558, populationTier: 'city' },
  { name: 'Madurai',          state: 'Tamil Nadu',        lat: 9.9252,  lng: 78.1198, populationTier: 'city' },
  { name: 'Trichy',           state: 'Tamil Nadu',        lat: 10.7905, lng: 78.7047, populationTier: 'city' },
  { name: 'Salem',            state: 'Tamil Nadu',        lat: 11.6643, lng: 78.1460, populationTier: 'city' },
  { name: 'Ooty',             state: 'Tamil Nadu',        lat: 11.4102, lng: 76.6950, populationTier: 'small_town' },

  // ── Kerala ─────────────────────────────────────────────────────────────────
  { name: 'Thiruvananthapuram', state: 'Kerala',           lat: 8.5241,  lng: 76.9366, populationTier: 'city' },
  { name: 'Kochi',            state: 'Kerala',            lat: 9.9312,  lng: 76.2673, populationTier: 'city' },
  { name: 'Kozhikode',        state: 'Kerala',            lat: 11.2588, lng: 75.7804, populationTier: 'city' },
  { name: 'Thrissur',         state: 'Kerala',            lat: 10.5276, lng: 76.2144, populationTier: 'city' },
  { name: 'Munnar',           state: 'Kerala',            lat: 10.0889, lng: 77.0595, populationTier: 'small_town' },

  // ── Maharashtra ────────────────────────────────────────────────────────────
  { name: 'Nagpur',           state: 'Maharashtra',       lat: 21.1458, lng: 79.0882, populationTier: 'city' },
  { name: 'Nashik',           state: 'Maharashtra',       lat: 20.0063, lng: 73.7898, populationTier: 'city' },
  { name: 'Aurangabad',       state: 'Maharashtra',       lat: 19.8762, lng: 75.3433, populationTier: 'city' },
  { name: 'Thane',            state: 'Maharashtra',       lat: 19.2183, lng: 72.9781, populationTier: 'city' },
  { name: 'Kolhapur',         state: 'Maharashtra',       lat: 16.7050, lng: 74.2433, populationTier: 'city' },

  // ── Gujarat ────────────────────────────────────────────────────────────────
  { name: 'Surat',            state: 'Gujarat',           lat: 21.1702, lng: 72.8311, populationTier: 'city' },
  { name: 'Vadodara',         state: 'Gujarat',           lat: 22.3072, lng: 73.1812, populationTier: 'city' },
  { name: 'Rajkot',           state: 'Gujarat',           lat: 22.3039, lng: 70.8022, populationTier: 'city' },
  { name: 'Gandhinagar',      state: 'Gujarat',           lat: 23.2156, lng: 72.6369, populationTier: 'city' },

  // ── Rajasthan ──────────────────────────────────────────────────────────────
  { name: 'Jodhpur',          state: 'Rajasthan',         lat: 26.2389, lng: 73.0243, populationTier: 'city' },
  { name: 'Udaipur',          state: 'Rajasthan',         lat: 24.5854, lng: 73.7125, populationTier: 'city' },
  { name: 'Kota',             state: 'Rajasthan',         lat: 25.2138, lng: 75.8648, populationTier: 'city' },
  { name: 'Ajmer',            state: 'Rajasthan',         lat: 26.4499, lng: 74.6399, populationTier: 'city' },
  { name: 'Jaisalmer',        state: 'Rajasthan',         lat: 26.9157, lng: 70.9083, populationTier: 'town' },

  // ── Uttar Pradesh ──────────────────────────────────────────────────────────
  { name: 'Lucknow',          state: 'Uttar Pradesh',     lat: 26.8467, lng: 80.9462, populationTier: 'metro' },
  { name: 'Varanasi',         state: 'Uttar Pradesh',     lat: 25.3176, lng: 82.9739, populationTier: 'city' },
  { name: 'Agra',             state: 'Uttar Pradesh',     lat: 27.1767, lng: 78.0081, populationTier: 'city' },
  { name: 'Kanpur',           state: 'Uttar Pradesh',     lat: 26.4499, lng: 80.3319, populationTier: 'city' },
  { name: 'Prayagraj',        state: 'Uttar Pradesh',     lat: 25.4358, lng: 81.8463, populationTier: 'city' },
  { name: 'Noida',            state: 'Uttar Pradesh',     lat: 28.5355, lng: 77.3910, populationTier: 'city' },
  { name: 'Gorakhpur',        state: 'Uttar Pradesh',     lat: 26.7606, lng: 83.3732, populationTier: 'city' },
  { name: 'Ayodhya',          state: 'Uttar Pradesh',     lat: 26.7922, lng: 82.1998, populationTier: 'town' },

  // ── Madhya Pradesh ─────────────────────────────────────────────────────────
  { name: 'Bhopal',           state: 'Madhya Pradesh',    lat: 23.2599, lng: 77.4126, populationTier: 'city' },
  { name: 'Indore',           state: 'Madhya Pradesh',    lat: 22.7196, lng: 75.8577, populationTier: 'city' },
  { name: 'Jabalpur',         state: 'Madhya Pradesh',    lat: 23.1815, lng: 79.9864, populationTier: 'city' },
  { name: 'Gwalior',          state: 'Madhya Pradesh',    lat: 26.2183, lng: 78.1828, populationTier: 'city' },
  { name: 'Khajuraho',        state: 'Madhya Pradesh',    lat: 24.8318, lng: 79.9199, populationTier: 'small_town' },

  // ── Bihar ──────────────────────────────────────────────────────────────────
  { name: 'Patna',            state: 'Bihar',             lat: 25.6093, lng: 85.1376, populationTier: 'city' },
  { name: 'Gaya',             state: 'Bihar',             lat: 24.7914, lng: 85.0002, populationTier: 'city' },

  // ── West Bengal ────────────────────────────────────────────────────────────
  { name: 'Siliguri',         state: 'West Bengal',       lat: 26.7271, lng: 88.3953, populationTier: 'city' },
  { name: 'Darjeeling',       state: 'West Bengal',       lat: 27.0410, lng: 88.2663, populationTier: 'town' },

  // ── Odisha ─────────────────────────────────────────────────────────────────
  { name: 'Bhubaneswar',      state: 'Odisha',            lat: 20.2961, lng: 85.8245, populationTier: 'city' },
  { name: 'Puri',             state: 'Odisha',            lat: 19.8135, lng: 85.8312, populationTier: 'town' },
  { name: 'Cuttack',          state: 'Odisha',            lat: 20.4625, lng: 85.8830, populationTier: 'city' },

  // ── Jharkhand ──────────────────────────────────────────────────────────────
  { name: 'Ranchi',           state: 'Jharkhand',         lat: 23.3441, lng: 85.3096, populationTier: 'city' },
  { name: 'Jamshedpur',       state: 'Jharkhand',         lat: 22.8046, lng: 86.2029, populationTier: 'city' },

  // ── Chhattisgarh ───────────────────────────────────────────────────────────
  { name: 'Raipur',           state: 'Chhattisgarh',      lat: 21.2514, lng: 81.6296, populationTier: 'city' },
  { name: 'Bilaspur',         state: 'Chhattisgarh',      lat: 22.0797, lng: 82.1409, populationTier: 'city' },

  // ── Punjab ─────────────────────────────────────────────────────────────────
  { name: 'Chandigarh',       state: 'Punjab',            lat: 30.7333, lng: 76.7794, populationTier: 'city' },
  { name: 'Amritsar',         state: 'Punjab',            lat: 31.6340, lng: 74.8723, populationTier: 'city' },
  { name: 'Ludhiana',         state: 'Punjab',            lat: 30.9010, lng: 75.8573, populationTier: 'city' },

  // ── Haryana ────────────────────────────────────────────────────────────────
  { name: 'Gurgaon',          state: 'Haryana',           lat: 28.4595, lng: 77.0266, populationTier: 'city' },
  { name: 'Faridabad',        state: 'Haryana',           lat: 28.4089, lng: 77.3178, populationTier: 'city' },

  // ── Uttarakhand ────────────────────────────────────────────────────────────
  { name: 'Dehradun',         state: 'Uttarakhand',       lat: 30.3165, lng: 78.0322, populationTier: 'city' },
  { name: 'Haridwar',         state: 'Uttarakhand',       lat: 29.9457, lng: 78.1642, populationTier: 'town' },
  { name: 'Rishikesh',        state: 'Uttarakhand',       lat: 30.0869, lng: 78.2676, populationTier: 'town' },
  { name: 'Nainital',         state: 'Uttarakhand',       lat: 29.3919, lng: 79.4542, populationTier: 'small_town' },

  // ── Himachal Pradesh ───────────────────────────────────────────────────────
  { name: 'Shimla',           state: 'Himachal Pradesh',  lat: 31.1048, lng: 77.1734, populationTier: 'town' },
  { name: 'Manali',           state: 'Himachal Pradesh',  lat: 32.2396, lng: 77.1887, populationTier: 'small_town' },
  { name: 'Dharamshala',      state: 'Himachal Pradesh',  lat: 32.2190, lng: 76.3234, populationTier: 'small_town' },

  // ── Jammu & Kashmir / Ladakh ───────────────────────────────────────────────
  { name: 'Srinagar',         state: 'Jammu & Kashmir',   lat: 34.0837, lng: 74.7973, populationTier: 'city' },
  { name: 'Jammu',            state: 'Jammu & Kashmir',   lat: 32.7266, lng: 74.8570, populationTier: 'city' },
  { name: 'Leh',              state: 'Ladakh',            lat: 34.1526, lng: 77.5771, populationTier: 'small_town' },

  // ── Goa ────────────────────────────────────────────────────────────────────
  { name: 'Goa',              state: 'Goa',               lat: 15.4909, lng: 73.8278, populationTier: 'city' },

  // ── Assam ──────────────────────────────────────────────────────────────────
  { name: 'Guwahati',         state: 'Assam',             lat: 26.1445, lng: 91.7362, populationTier: 'city' },
  { name: 'Dibrugarh',        state: 'Assam',             lat: 27.4728, lng: 94.9120, populationTier: 'town' },

  // ── Northeast ──────────────────────────────────────────────────────────────
  { name: 'Imphal',           state: 'Manipur',           lat: 24.8170, lng: 93.9368, populationTier: 'city' },
  { name: 'Shillong',         state: 'Meghalaya',         lat: 25.5788, lng: 91.8933, populationTier: 'city' },
  { name: 'Agartala',         state: 'Tripura',           lat: 23.8315, lng: 91.2868, populationTier: 'city' },
  { name: 'Aizawl',           state: 'Mizoram',           lat: 23.7271, lng: 92.7176, populationTier: 'town' },
  { name: 'Gangtok',          state: 'Sikkim',            lat: 27.3389, lng: 88.6065, populationTier: 'town' },
  { name: 'Itanagar',         state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, populationTier: 'town' },
  { name: 'Kohima',           state: 'Nagaland',          lat: 25.6751, lng: 94.1086, populationTier: 'town' },
];
