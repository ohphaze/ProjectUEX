// Lightweight local suggestions for marketplace item types/names
// This powers Discord option autocomplete for the `item_type` filter.

const COMMON_ITEMS = [
  'titanium', 'quantanium', 'laranite', 'agricium', 'tungsten', 'aluminium',
  'diamond', 'gold', 'copper', 'fluorine', 'iodine', 'chlorine', 'he-3',
  'hydrogen', 'distilled spirits', 'medical supplies', 'processed food',
  'scrap', 'electronics', 'titanium ore', 'quantanium ore', 'helium',
  'aluminum', 'argon', 'water', 'oxygen', 'stims', 'armor', 'helmet',
  'multi-tool', 'tractor beam', 'weapon', 'medgun', 'undersuit', 'grenade'
];

function getSuggestions(query) {
  const q = (query || '').toLowerCase();
  const pool = Array.from(new Set(COMMON_ITEMS));
  const filtered = q
    ? pool.filter((name) => name.toLowerCase().includes(q))
    : pool;

  // Discord autocomplete supports up to 25 suggestions
  return filtered.slice(0, 25).map((name) => ({ name, value: name }));
}

module.exports = { getSuggestions };

