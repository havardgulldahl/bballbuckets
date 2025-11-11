/**
 * NIF (Norwegian Basketball Federation) API Integration
 * Functions to fetch season, tournament, team, and match data
 * Now using CORS proxy to avoid cross-origin issues
 */

const NIF_API_BASE = 'https://baskets-and-buckets.havard-085.workers.dev';

/**
 * Common headers for proxy API requests
 * Note: The proxy handles NIF-specific headers internally
 */
const NIF_HEADERS = {
  'Accept': 'application/json',
};

/**
 * Fetch seasons for a given year
 * @param {number} year - The year to fetch seasons for (e.g., 2025)
 * @returns {Promise<Object>} - Season data including seasonId
 */
async function getSeasons(year) {
  const url = `${NIF_API_BASE}/api/seasons?year=${year}`;
  
  try {
    const response = await fetch(url, {
      headers: NIF_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch seasons: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
}

/**
 * Fetch all tournaments in a season
 * @param {string|number} seasonId - The season ID to fetch tournaments for
 * @returns {Promise<Object>} - Tournament data including tournamentId for each tournament
 */
async function getTournamentsBySeason(seasonId) {
  const url = `${NIF_API_BASE}/api/tournaments/${seasonId}`;
  
  try {
    const response = await fetch(url, {
      headers: NIF_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tournaments: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    throw error;
  }
}

/**
 * Fetch all teams in a tournament
 * @param {string|number} tournamentId - The tournament ID to fetch teams for
 * @returns {Promise<Object>} - Team data including teamId, team names, and club info
 */
async function getTeamsByTournament(tournamentId) {
  const url = `${NIF_API_BASE}/api/teams/${tournamentId}`;
  
  try {
    const response = await fetch(url, {
      headers: NIF_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Fetch all matches in a tournament
 * @param {string|number} tournamentId - The tournament ID to fetch matches for
 * @returns {Promise<Object>} - Match data including matchId, teams, dates, venues, and results
 */
async function getMatchesByTournament(tournamentId) {
  const url = `${NIF_API_BASE}/api/matches/${tournamentId}`;
  
  try {
    const response = await fetch(url, {
      headers: NIF_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}

/**
 * Helper function to extract season ID from seasons response
 * @param {Object} seasonsData - The response from getSeasons()
 * @param {string} seasonName - Optional: filter by season name
 * @returns {string|null} - The season ID or null if not found
 */
function extractSeasonId(seasonsData, seasonName = null) {
  if (!seasonsData.seasons || seasonsData.seasons.length === 0) {
    return null;
  }
  
  if (seasonName) {
    const season = seasonsData.seasons.find(s => s.seasonName.includes(seasonName));
    return season ? season.seasonId : null;
  }
  
  // Return first season if no filter
  return seasonsData.seasons[0].seasonId;
}

/**
 * Helper function to find a team by name in tournament teams response
 * @param {Object} teamsData - The response from getTeamsByTournament()
 * @param {string} teamName - Team name to search for (matches team, overriddenName, or describingName)
 * @returns {Object|null} - The team object or null if not found
 */
function findTeamByName(teamsData, teamName) {
  if (!teamsData.teams || teamsData.teams.length === 0) {
    return null;
  }
  
  const searchTerm = teamName.toLowerCase();
  return teamsData.teams.find(team => 
    team.team.toLowerCase().includes(searchTerm) ||
    team.overriddenName.toLowerCase().includes(searchTerm) ||
    team.describingName.toLowerCase().includes(searchTerm)
  ) || null;
}

/**
 * Helper function to filter matches for a specific team
 * @param {Object} matchesData - The response from getMatchesByTournament()
 * @param {number} teamId - The team ID to filter matches for
 * @returns {Array} - Array of matches where the team is home or away
 */
function getTeamMatches(matchesData, teamId) {
  if (!matchesData.matches || matchesData.matches.length === 0) {
    return [];
  }
  
  return matchesData.matches.filter(match => 
    match.hometeamId === teamId || match.awayteamId === teamId
  );
}

/**
 * Complete workflow: Get current season for the current year
 * @returns {Promise<Object>} - Current season data
 */
async function getCurrentSeason() {
  const currentYear = new Date().getFullYear();
  const seasonsData = await getSeasons(currentYear);
  return {
    ...seasonsData,
    currentSeasonId: extractSeasonId(seasonsData)
  };
}

/**
 * Fetch all members (players and staff) for a team
 * @param {string|number} teamId - The team ID to fetch members for
 * @returns {Promise<Array>} - Array of team members with personId, name, number, position, etc.
 */
async function getTeamMembers(teamId) {
  const url = `${NIF_API_BASE}/api/members/${teamId}`;
  
  try {
    const response = await fetch(url, {
      headers: NIF_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

/**
 * Filter team members to get only players
 * @param {Array} membersData - The response from getTeamMembers()
 * @returns {Array} - Array of players only (memberType === "Player")
 */
function getPlayers(membersData) {
  if (!Array.isArray(membersData)) {
    return [];
  }
  
  return membersData.filter(member => member.memberType === 'Player');
}

/**
 * Filter team members to get only staff (coaches, etc.)
 * @param {Array} membersData - The response from getTeamMembers()
 * @returns {Array} - Array of staff only (memberType === "TeamSupport")
 */
function getTeamStaff(membersData) {
  if (!Array.isArray(membersData)) {
    return [];
  }
  
  return membersData.filter(member => member.memberType === 'TeamSupport');
}

/**
 * Convert NIF player data to bballbuckets player format
 * @param {Object} nifPlayer - Player object from NIF API
 * @returns {Object} - Player object formatted for bballbuckets
 */
function convertNIFPlayerToApp(nifPlayer) {
  // Calculate graduation year from birth date (assuming high school graduation at age 18)
  let gradYear = null;
  if (nifPlayer.birthDate) {
    const birthYear = new Date(nifPlayer.birthDate).getFullYear();
    gradYear = birthYear + 18;
  }
  
  return {
    firstName: nifPlayer.firstName,
    lastName: nifPlayer.lastName,
    jersey: nifPlayer.number || '',
    positions: nifPlayer.position || '',
    gradYear: gradYear,
    dominantHand: 'Right', // Default - not provided by NIF API
    onCourt: false,
    // Additional NIF data for reference
    nifData: {
      personId: nifPlayer.personId,
      nationality: nifPlayer.nationality,
      birthDate: nifPlayer.birthDate,
      gender: nifPlayer.gender,
      height: nifPlayer.height
    }
  };
}

/**
 * Get players for a team and convert to bballbuckets format
 * @param {string|number} teamId - The team ID to fetch players for
 * @returns {Promise<Array>} - Array of players in bballbuckets format
 */
async function getTeamPlayersForApp(teamId) {
  const members = await getTeamMembers(teamId);
  const players = getPlayers(members);
  return players.map(player => convertNIFPlayerToApp(player));
}

/**
 * Helper function to calculate age from birth date
 * @param {string} birthDate - Birth date string (ISO format)
 * @returns {number|null} - Age in years or null if invalid date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Export functions for use in other modules
export {
  getSeasons,
  getTournamentsBySeason,
  getTeamsByTournament,
  getMatchesByTournament,
  extractSeasonId,
  findTeamByName,
  getTeamMatches,
  getCurrentSeason,
  getTeamMembers,
  getPlayers,
  getTeamStaff,
  convertNIFPlayerToApp,
  getTeamPlayersForApp,
  calculateAge,
  BASKETBALL_SPORT_ID,
  NIF_API_BASE
};
