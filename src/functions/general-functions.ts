import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";
import React, { useState } from "react";

// functions pertaining to Spotify Tracks:
import {
    fetchAllSavedTracks,
    fetchTracksFromPlaylistTracksHREF,
    fetchTracksFromPlaylistTracksHREF2
} from "./tracks";

// functions pertaining to Spotify Playlists:
import {
    fetchPlaylist,
    fetchAllPlaylists
} from "./playlists";

// functions pertaining to Spotify Artists:
import {
    fetchArtistFromHREF
} from "./artists";

// types/interfaces
import { 
    APIPlaylistObject,
    FetchPlaylistsResponseObject,
    APITrackObject,
    APIUserObject,
    APIArtistObject,
    ArtistFromTrack,
    YieldObject
} from "../types";
import userEvent from "@testing-library/user-event";

require("dotenv").config();

export const APIRateLimitExceeded = {
    "error": {
        "status": 429,
        "message": "API rate limit exceeded"
    }
};

export const AccessTokenExpired = {
    "error": {
        "status": 401,
        "message": "The access token expired"
    }
};

const playlistsToIgnore = [
    'Various Artists – The Workout Mix 2015',
    'hyped',
    'Mentos Refreshed pure mcnent',
    'Mentos Refreshed - chill',
    'Mentos Refreshed - quite chilled',
    'maverick sabre',
    'guilty pleasure',
    'THE ACTUAL BEST',
    'dece',
    'My Shazam Tracks',
    'Duet 4',
    'Duet 3',
    'Duet 2',
    'Duet',
    'Recommended for You // Obscurify'
];

export function x_www_form_urlencoded(obj: object): string {
    /*
    the keys and values are encoded in key-value tuples separated by '&', with a '=' between the key and the value.
    Non-alphanumeric characters in both keys and values are percent encoded:
    this is the reason why this type is not suitable to use with binary data (use multipart/form-data instead) */
    let str = "";
    Object.entries(obj).forEach(([key, value]) => {
        str += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
    });
    return str.slice(0, str.length - 1); // -1 because the last char will be &
}

export function areEqual(obj1: object|undefined, obj2: object): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function sortArrayOfObjectsByProperty(property: string) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a: any, b: any) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

export function delay(delayInms: number) {
    // thanks to this comment: https://stackoverflow.com/a/49813472/17406886
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
}

//////

export async function requestAuth() {
    const scopes = [
        "ugc-image-upload",
        "playlist-modify-private",
        "playlist-read-private",
        "playlist-modify-public",
        "playlist-read-collaborative",
        "user-read-private",
        "user-read-email",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-library-modify",
        "user-library-read",
        "user-read-playback-position",
        "user-read-recently-played",
        "user-top-read",
        "app-remote-control",
        "streaming",
        "user-follow-modify",
        "user-follow-read"
    ];

    // const codeVerifier = ""; // random string between 43-128 chars in length. Can contain letters, digits, underscores, periods, hyphens, or tildes
    // const codeChallenge = ""; // In order to generate the code_challenge, your app should hash the code verifier using the SHA256 algorithm

    const params = {
        client_id: process.env.REACT_APP_CLIENT_ID,
        response_type: "code",
        redirect_uri: "http://localhost:3000/callback",
        // state: "",
        scope: scopes.join(" "),
        show_dialog: "true" //,
        // code_challenge_method: "S256",
        // code_challenge: ""
    };
    // const formattedQueryParams = new URLSearchParams(JSON.stringify(queryParams)).toString();

    const redirect = 'https://accounts.spotify.com/authorize?' + x_www_form_urlencoded(params);
    window.location.replace(redirect);
}

export async function fetchToken(code: string) {
    // console.log(code);
    const body = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3000/callback"
    };
    const headerPart = Buffer.from(
        process.env.REACT_APP_CLIENT_ID +
        ':' +
        process.env.REACT_APP_CLIENT_SECRET
    ).toString('base64');
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${headerPart}`
    };
    let out: any;
    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            body: x_www_form_urlencoded(body),
            headers: headers
        });
        const data = await response.json();
        out = data;
    } catch (error) {
        out = error;
    }
    return out;
}

export function refreshAccessToken() {
    window.location.replace("http://localhost:3000/?" + "refresh");
}

export function useForceRerender(){
    // credit: https://stackoverflow.com/questions/46240647/react-how-to-force-a-function-component-to-render/53837442#53837442
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update the state to force render
}

/*
*** Using access token: ***

- You make the appropriate HTTP verb request to "https://api.spotify.com/"

You need to include the following header in every API call:

{"Authorization" : `Bearer ${accessToken}`}

*/

export async function fetchCurrentUserProfile(accessToken: string) {
    console.log("getting current user profile...");
    const response = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await response.json();

    if (response.status !== 200) {
        console.log(data.error);
        if (areEqual(data, AccessTokenExpired)) {
            alert("Sorry, your access token expired. The page will reload - please try again.");
            refreshAccessToken();
        }
    }

    return data;
}

/////////////////////////////////////////////////////////////
/////////////// These are the meaty functions ///////////////
/////////////////////////////////////////////////////////////

/*

async function fetchAllArtists():

- What I want to do is fetch a list of every single artist in the user's library
- This includes artists of the songs in their playlists and their liked songs, but doesn't
include playlists that aren't owned by the user

- So I want to iterate through all of their playlists, and for every song in each playlist,
get the artist/s and put them all into an array
- At the same time it'd probably be a good idea to maintain an object with keys being the
artists found, and values being an array of the hrefs of their songs

*/

// THIS IS THE ONE!!!
export async function* fetchAllArtistsAndTracks2(accessToken: string, refreshToken: string) {
    /*
    • This function is a generator
    • The reason why is because I wanted the subcomponents to be able to display the progress of the function
    • Before, I tried yielding `artistsAndTracks` every time, but the components wouldn't update, I guess because
    the object itself can become massive
    • Using a generator, I can yield:
        - the current count ==> so that the user can see how many playlists they have
        - the name of the playlist currently being analysed ==> more interesting for the user if they can see this I guess
        - the keys of `artistsAndTracks` (which are string) ==> so the list of artists continually updates (where it didn't before when `artistsAndTracks` was one massive object)
    */
    const currentUserProfile = await fetchCurrentUserProfile(accessToken);


    interface ArtistsAndTracks {
        [artist: string]: Array<APITrackObject>
    }
    const artistsAndTracks: ArtistsAndTracks = {};

    
    let playlistCount: number = 0;

    const allPlaylists = fetchAllPlaylists(accessToken, 50); // generator (or iterator? Idek what it's actually called)
    for await (let playlistBatch of allPlaylists) { // playlistBatch is an array of 50 playlist objects        
        // fetches the tracks from each playlist's playlist.tracks.href sub-object:
        if (typeof playlistBatch === "undefined") {
            console.log("error");
            delay(2000);
            continue
        }

        for (let i = 0; i < playlistBatch.length; i++) {
            let playlist = playlistBatch[i];
            
            if (
                (playlist.owner.id !== currentUserProfile.id) ||
                (playlist.name === "Discover Weekly" || playlist.name === "Discover Weekly Archive") ||
                (playlistsToIgnore.includes(playlist.name))
            ) {
                continue;
            }

            // / console.log(playlist.name,"\n",playlist.owner.display_name);

            const playlistTracks = await fetchTracksFromPlaylistTracksHREF2(accessToken, playlist.tracks.href, currentUserProfile);
            
            // for each individual track object in playlistTracks:
            for (let track of playlistTracks) {
                const artists = track.artists.map((obj: ArtistFromTrack) => obj.name);
                artists.forEach((artist: string) => {
                    if (!Object.keys(artistsAndTracks).includes(artist)) { // 1. artist isn't in `artistsAndTracks`
                        artistsAndTracks[artist] = [track];
                    } else if (!artistsAndTracks[artist].some((artistTrack: APITrackObject) => artistTrack.id === track.id)) { // 2. artist is there but track isn't
                        artistsAndTracks[artist].push(track);
                    } // else –- artist and track are already there, so do nothing
                });
            }

            if (playlistCount <= i) playlistCount = i + 1;
            else playlistCount += 1;
            
            // yield ["playlists", playlistCount];
            yield [0, playlistCount];
        }
        // playlistCount += playlistBatch.length;
        // yield ["playlists", playlistCount];
    }


    let trackCount: number = 0;

    const allSavedTracks = fetchAllSavedTracks(accessToken, 50);
    for await (let trackBatch of allSavedTracks) {

        for (let track of trackBatch) {
            // (for some tracks there are multiple artists, so you have to map)
            const artists = track.artists.map((obj: ArtistFromTrack) => obj.name);
            artists.forEach((artist: string) => {
                /*
                1. If the artist isn't in `artistsAndTracks`, it adds it, then adds the track to the artist's array
                2. If the artist is in there but the track isn't, it adds the track
                3. If the artist is there and the track is there, it does nothing
                */
                if (!Object.keys(artistsAndTracks).includes(artist)) { // 1.
                    artistsAndTracks[artist] = [track];
                } else if (!artistsAndTracks[artist].some((artistTrack: APITrackObject) => artistTrack.id === track.id)) { // 2.
                    artistsAndTracks[artist].push(track);
                }
            });

            trackCount += 1;
            // yield ["tracks", trackCount];
            yield [1, trackCount];
            // yielding this way took 41635.30000001192 overall
        }
        // trackCount += trackBatch.length;
        // yield ["tracks", trackCount];
        // yielding in this way took 54275.69999998808 overall
    }

    console.log("Done formatting object!!! (I think...)");
    // console.log(artistsAndTracks);
    yield artistsAndTracks;
}
