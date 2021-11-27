import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";

import {
    areEqual,
    fetchCurrentUserProfile,
    sortArrayOfObjectsByProperty,
    x_www_form_urlencoded,
    APIRateLimitExceeded,
    AccessTokenExpired,
    refreshAccessToken
} from "./general-functions";

import {

} from "./playlists";

import { 
    APIPlaylistObject,
    FetchPlaylistsResponseObject,
    APITrackObject,
    APIUserObject
} from "../types";
import { json } from "stream/consumers";

require("dotenv").config();

// literally just returns the total number of saved tracks
export async function fetchNumberOfSavedTracks(accessToken: string) {
    let count = 0;
    for (let i = 0;; i += 50) {
        const params = x_www_form_urlencoded({
            limit: 50,
            offset: i
        });
        const response = await fetch("https://api.spotify.com/v1/me/tracks/?" + params, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        const data = await response.json();

        if (response.status !== 200) {
            console.error(response);
            console.error(data);
        }

        const numberOfTracks = data.items.length;
        if (numberOfTracks === 0) break;
        else count += numberOfTracks;
    }
    return count;
}

// used as a helper function for `fetchAllSavedTracks()`
async function fetchTrackData(accessToken: string, limit: number, offset: number) {
    async function fetchData() {
        const params = x_www_form_urlencoded({
            limit: limit,
            offset: offset
        });
        const response = await fetch("https://api.spotify.com/v1/me/tracks/?" + params, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        return response;
    }
    let response = await fetchData();
    let data = await response.json();

    if (response.status !== 200) {
        console.error(response);
        console.error(data);
        if (areEqual(data, AccessTokenExpired)) {
            alert("Sorry, your access token expired. The page will reload - please try again.");
            refreshAccessToken();
        }
    }

    if (areEqual(data, APIRateLimitExceeded)) {
        const errorMessage = data.error.message;
        // const retryAfter = response.headers.get("Retry-After");
        console.log(errorMessage);
        setTimeout(async () => {
            response = await fetchData();
            data = await response.json()
        }, 2000);
    }
    return data.items;
}

export async function fetchTracksFromPlaylistTracksHREF(accessToken: string, href: string, currentUserProfile: APIUserObject) {
    // https://api.spotify.com/v1/playlists/{ playlist id }/tracks

    const response = await fetch(href, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await response.json();

    if (response.status !== 200) {
        console.error(response);
        console.error(data);
    }

    if (typeof data.items === "undefined") return [];

    interface TrackItem {
        "added_at": string,
        "added_by": {
            "external_urls": {
                "spotify": string
            },
            "href": string,
            "id": string,
            "type": string,
            "uri": string
        },
        "is_local": boolean,
        "primary_color": any, // was `null` in obj I copied but idk what else it could be :/
        "track": APITrackObject,
        "video_thumbnail": {
            "url": any // was `null` in obj I copied but idk what else it could be :/
        }
    }

    const tracks = data.items.filter((track: TrackItem) => track.added_by.id === currentUserProfile.id);
    
    return tracks.map((entry: TrackItem) => entry.track);
}

export async function fetchTracksFromPlaylistTracksHREF2(accessToken: string, href: string, currentUserProfile: APIUserObject) {
    // console.log("fetching tracks from playlist href...");
    // https://api.spotify.com/v1/playlists/{ playlist id }/tracks

    const response = await fetch(href, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    // console.log(response.status);
    const data = await response.json();

    if (response.status !== 200) {
        console.error(response);
        console.error(data);
        if (areEqual(data, AccessTokenExpired)) {
            alert("Sorry, your access token expired. The page will reload - please try again.");
            refreshAccessToken();
        }
    }

    if (typeof data.items === "undefined") return [];

    interface TrackItem {
        "added_at": string,
        "added_by": {
            "external_urls": {
                "spotify": string
            },
            "href": string,
            "id": string,
            "type": string,
            "uri": string
        },
        "is_local": boolean,
        "primary_color": any, // was `null` in obj I copied but idk what else it could be :/
        "track": APITrackObject,
        "video_thumbnail": {
            "url": any // was `null` in obj I copied but idk what else it could be :/
        }
    }

    // console.log(data);
    const tracks = data.items.filter((track: TrackItem) => track.added_by.id === currentUserProfile.id);
    
    return tracks.map((entry: TrackItem) => entry.track);
}

//////////////////////////
//// THE BIG DADDY!!! ////
//////////////////////////
export async function* fetchAllSavedTracks(accessToken: string, incrementBy: number = 50) {
    // console.log("fetching all saved tracks...");

    for (let count = 0; count < 10_000; count += incrementBy) {
        let tracks = await fetchTrackData(accessToken, incrementBy, count);
        if ((tracks instanceof Array) && tracks.length === 0) {
            break;
        } else if (typeof tracks === "undefined") {
            continue;
        } else {
            interface item {added_at: string, track: APITrackObject};
            tracks = tracks.map((entry: item) => entry.track);
            yield tracks;
        }
    }
}
