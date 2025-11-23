// lib/unsplash.ts

// Mapping of destinations to their key landmarks for more relevant searches
const destinationLandmarks: Record<string, string[]> = {
  'paris': ['eiffel tower', 'louvre museum', 'arc de triomphe', 'notre dame', 'sacre coeur'],
  'tokyo': ['tokyo tower', 'shibuya crossing', 'senso-ji temple', 'mount fuji', 'tokyo skytree'],
  'new york': ['statue of liberty', 'times square', 'central park', 'empire state building', 'brooklyn bridge'],
  'rome': ['colosseum', 'trevi fountain', 'vatican', 'pantheon', 'roman forum'],
  'london': ['big ben', 'tower bridge', 'london eye', 'buckingham palace', 'tower of london'],
  'barcelona': ['sagrada familia', 'park guell', 'casa batllo', 'la rambla', 'gothic quarter'],
  'dubai': ['burj khalifa', 'palm jumeirah', 'burj al arab', 'dubai marina', 'dubai mall'],
  'bali': ['uluwatu temple', 'tegallalang rice terraces', 'tanah lot', 'ubud monkey forest', 'nusa penida'],
  'amsterdam': ['canal houses', 'rijksmuseum', 'anne frank house', 'dam square', 'windmills'],
  'sydney': ['sydney opera house', 'harbour bridge', 'bondi beach', 'darling harbour', 'royal botanic gardens'],
  'singapore': ['marina bay sands', 'gardens by the bay', 'merlion', 'chinatown', 'sentosa'],
  'istanbul': ['hagia sophia', 'blue mosque', 'topkapi palace', 'grand bazaar', 'galata tower'],
  'bangkok': ['grand palace', 'wat arun', 'wat pho', 'floating market', 'chatuchak market'],
  'san francisco': ['golden gate bridge', 'alcatraz', 'cable cars', 'painted ladies', 'fishermans wharf'],
  'los angeles': ['hollywood sign', 'santa monica pier', 'griffith observatory', 'venice beach', 'getty center'],
  'las vegas': ['las vegas strip', 'bellagio fountains', 'fremont street', 'red rock canyon', 'neon signs'],
  'prague': ['charles bridge', 'prague castle', 'old town square', 'astronomical clock', 'vltava river'],
  'vienna': ['schonbrunn palace', 'st stephens cathedral', 'hofburg palace', 'belvedere palace', 'vienna opera'],
  'athens': ['acropolis', 'parthenon', 'temple of zeus', 'ancient agora', 'plaka district'],
  'cairo': ['pyramids of giza', 'sphinx', 'egyptian museum', 'khan el khalili', 'nile river'],
  'marrakech': ['jemaa el-fna', 'majorelle garden', 'koutoubia mosque', 'bahia palace', 'medina'],
  'cape town': ['table mountain', 'robben island', 'victoria alfred waterfront', 'cape point', 'bo kaap'],
  'rio de janeiro': ['christ the redeemer', 'sugarloaf mountain', 'copacabana beach', 'ipanema beach', 'maracana'],
  'buenos aires': ['obelisco', 'la boca', 'recoleta cemetery', 'teatro colon', 'plaza de mayo'],
  'venice': ['grand canal', 'st marks basilica', 'rialto bridge', 'doges palace', 'murano glass'],
  'florence': ['duomo', 'ponte vecchio', 'uffizi gallery', 'david statue', 'piazzale michelangelo'],
  'santorini': ['oia sunset', 'white buildings', 'blue domes', 'caldera', 'fira'],
  'maldives': ['overwater bungalows', 'coral reefs', 'white sand beaches', 'turquoise water', 'island resorts']
};

function getDestinationKey(destination: string): string {
  const normalized = destination.toLowerCase().trim();
  
  // Direct match
  if (destinationLandmarks[normalized]) {
    return normalized;
  }
  
  // Partial match
  for (const key of Object.keys(destinationLandmarks)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }
  
  return normalized;
}

export async function fetchUnsplashImages(destination: string): Promise<string[]> {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("Unsplash API key is missing.");
  }

  const destKey = getDestinationKey(destination);
  const landmarks = destinationLandmarks[destKey];
  
  let allImages: string[] = [];

  if (landmarks && landmarks.length > 0) {
    // Fetch images for each landmark
    const landmarkPromises = landmarks.slice(0, 3).map(async (landmark) => {
      try {
        const query = encodeURIComponent(`${landmark} ${destination} landmark`);
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=2&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!res.ok) {
          console.error(`Unsplash error for ${landmark}:`, res.status);
          return [];
        }

        const data = await res.json();
        
        return data.results
          ?.filter((img: any) => img?.urls?.regular)
          .map((img: any) => img.urls.regular) || [];
      } catch (error) {
        console.error(`Error fetching ${landmark}:`, error);
        return [];
      }
    });

    const landmarkResults = await Promise.all(landmarkPromises);
    allImages = landmarkResults.flat();
  }

  // Fallback: general destination search if no landmarks or insufficient images
  if (allImages.length < 3) {
    try {
      const query = encodeURIComponent(`${destination} city skyline landmark iconic`);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=5&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
      );

      if (res.ok) {
        const data = await res.json();
        const fallbackImages = data.results
          ?.filter((img: any) => img?.urls?.regular)
          .map((img: any) => img.urls.regular) || [];
        
        allImages = [...allImages, ...fallbackImages];
      }
    } catch (error) {
      console.error("Fallback search error:", error);
    }
  }

  // Remove duplicates and limit to 5 images
  return [...new Set(allImages)].slice(0, 5);
}