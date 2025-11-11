Start by getting json from this endpoint - to get .seasonId

https://sf14-terminlister-prod-app.azurewebsites.net/ta/Seasons/?sportId=199&year=2025


{
    "year": 2025,
    "seasons": [
        {
            "seasonName": "Basketballsesongen 2025-2026",
            "seasonDateFrom": "07/01/2025 00:00:00",
            "seasonDateTo": "06/30/2026 00:00:00",
            "seasonId": "201061",
            "sportId": 199,
            "orgIdOwner": 353
        }
    ]
}


Then, get all the valid tournaments from the season

URL: https://sf14-terminlister-prod-app.azurewebsites.net/ta/Tournament/Season/201061

{
    "tournamentsInSeason": [
        {
            "tournamentId": 438820,
            "tournamentNo": "421",
            "fromDate": "2025-09-20T00:00:00",
            "toDate": "2026-06-30T00:00:00",
            "isArchival": false,
            "isDeleted": false,
            "orgIdOwner": 610276,
            "parentTournamentId": 438819,
            "seasonId": 201061,
            "seasonName": "Basketballsesongen 2025-2026",
            "tournamentName": "Vest - Vestland - 1K",
            "tournamentShortName": "Vest -1K",
            "tournamentClasses": [
                {
                    "tournamentId": 438820,
                    "classId": 292,
                    "className": "Kvinner senior",
                    "fromAge": 18,
                    "toAge": 33,
                    "allowedFromAge": 13,
                    "allowedToAge": 99,
                    "gender": "Female",
                    "liveArenaStorage": "None"
                }
            ],
            "division": null,
            "logoUrl": null,
            "isTablePublished": true,
            "isResultPublished": true,
            "areMatchesPublished": true,
            "publishMatchesToDate": null,
            "areRefereesPublished": false,
            "publishRefereesToDate": null,
            "areStatisticsPublished": true,
            "areTeamsPublished": false,
            "liveArena": true,
            "liveClient": true,
            "withdrawalsVisible": true,
            "teamEntry": true,
            "tournamentType": "Serie",
            "sportId": 199
        },


Find the tournamentId
Then, get all the teams in the tournament

https://sf14-terminlister-prod-app.azurewebsites.net/ta/TournamentTeams/?tournamentId=441310

{
    "tournamentId": 441310,
    "tournamentNo": "2302",
    "teams": [
        {
            "teamId": 862654,
            "clubOrgId": 20057,
            "teamNo": 1,
            "team": "EB-85 1",
            "overriddenName": "EB-85 Spartans",
            "describingName": "Eikeli/Bærum BBK - Basket - G16 3"
        },
        {
            "teamId": 998831,
            "clubOrgId": 21069,
            "teamNo": 2,
            "team": "Årvoll IL - G16 1",
            "overriddenName": "Årvoll IL - G16 1",
            "describingName": "Årvoll IL - G16 2"
        },
        {
            "teamId": 203999,
            "clubOrgId": 21172,
            "teamNo": 3,
            "team": "Centrum",
            "overriddenName": "Centrum",
            "describingName": "Centrum - G16 1"
        },
        {
            "teamId": 680129,
            "clubOrgId": 19995,
            "teamNo": 4,
            "team": "Nesodden IF 2       ",
            "overriddenName": "Nesodden Bobcats Svart G16",
            "describingName": "Nesodden IF 2 - G16 7"
        },
        {
            "teamId": 862660,
            "clubOrgId": 25876,
            "teamNo": 6,
            "team": "Vålerenga Basket",
            "overriddenName": "Vålerenga Basket G16-2",
            "describingName": "Vålerenga Basket - G16 2"
        },
        {
            "teamId": 984283,
            "clubOrgId": 22490,
            "teamNo": 7,
            "team": "Drammen Rivers 1",
            "overriddenName": "Drammen Rivers 2011",
            "describingName": "Drammen Basketballklubb - G16 3"
        },


And now, get all the matches for the tournament

URL: https://sf14-terminlister-prod-app.azurewebsites.net/ta/TournamentMatches/?tournamentId=441310

{
    "tournamentId": 441310,
    "tournamentNo": "2302",
    "matches": [
        {
            "matchId": 8255074,
            "matchNo": "2302001",
            "activityAreaId": 0,
            "activityAreaLatitude": null,
            "activityAreaLongitude": null,
            "activityAreaName": null,
            "activityAreaNo": null,
            "admOrgId": 429,
            "arrOrgId": 52937,
            "arrOrgNo": "GR03010433140",
            "arrOrgName": "Årvoll Idrettslag",
            "awayteamId": 1011835,
            "awayteamOrgNo": "11",
            "awayteam": "Rolvsøy StreetBasketball klubb - G16 1",
            "awayteamOrgName": "Rolvsøy StreetBasketball klubb",
            "awayteamOverriddenName": "Uxtreme 2010",
            "awayteamClubOrgId": 965808,
            "hometeamId": 998831,
            "hometeam": "Årvoll IL - G16 2",
            "hometeamOrgName": "Årvoll IL",
            "hometeamOverriddenName": "Årvoll IL - G16 1",
            "hometeamOrgNo": "2",
            "hometeamClubOrgId": 21069,
            "roundId": 1,
            "roundName": "Runde 1",
            "seasonId": 201061,
            "tournamentName": "ØST GU16B - avd. 02",
            "tournamentId": 441310,
            "matchDate": null,
            "matchStartTime": 0,
            "matchEndTime": 0,
            "venueUnitId": 0,
            "venueUnitNo": null,
            "venueId": 0,
            "venueNo": null,
            "physicalAreaId": 0,
            "matchResult": null,
            "liveArena": false,
            "liveClientType": "Simple",
            "statusTypeId": 7,
            "statusType": "Trukket/Strøket Lag",
            "lastChangeDate": "2025-10-09T08:49:19.63",
            "spectators": null,
            "actualMatchDate": "0001-01-01T00:00:00",
            "actualMatchStartTime": null,
            "actualMatchEndTime": null,
            "sportId": 199
        },
        {
            "matchId": 8255075,
            "matchNo": "2302002",
            "activityAreaId": 8429,
            "activityAreaLatitude": null,
            "activityAreaLongitude": null,
            "activityAreaName": "Vulkanhallen",
            "activityAreaNo": "02",


Lastly, get all the players for a team

URL: https://sf14-terminlister-prod-app.azurewebsites.net/ta/TeamMembers/897608

Look for memberType=player

[{
    "personId": 9632590,
    "firstName": "Ana Geff",
    "lastName": "Blom",
    "nationality": "NOR",
    "birthDate": "2012-08-16T00:00:00",
    "imageUrl": null,
    "image2Url": null,
    "gender": "Male",
    "height": null,
    "number": "9",
    "position": null,
    "owningOrgId": 897608,
    "memberType": "Player"
}, 
{
    "personId": 2123782,
    "firstName": "Bob",
    "lastName": "Geff",
    "nationality": "USA",
    "birthDate": "1951-01-01T00:00:00",
    "imageUrl": null,
    "image2Url": null,
    "gender": "Male",
    "height": null,
    "number": null,
    "position": "Head coach",
    "owningOrgId": 897608,
    "memberType": "TeamSupport"
}]