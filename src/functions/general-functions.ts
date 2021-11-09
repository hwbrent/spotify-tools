import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";
import React, { useState } from "react";

// functions pertaining to Spotify Tracks:
import { fetchTracksFromPlaylist } from "./tracks";

// functions pertaining to Spotify Playlists:
import {
    fetchPlaylist
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
    ArtistFromTrack
} from "../types";

require("dotenv").config();

function mapArraysToObject(arr1: Array<string>, arr2: Array<any>) {
    console.log("arr1:", arr1);
    console.log("arr2:", arr2);
    // maps 
    let obj: {[key: string]: Array<string>} = {};
    for (let count = 0; count < arr1.length; count ++) {
        const key = arr1[count];
        const value = arr2[count];
        obj[key] = value;
    }
}

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
        scope: scopes.join(" ") //,
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
    const data: APIUserObject = await response.json();
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

export async function fetchAllArtists(accessToken: string) {
    const currentUserProfile = await fetchCurrentUserProfile(accessToken);

    interface ArtistsAndTracks {
        [artist: string]: Array<APITrackObject>
    }
    const artistsAndTracks: ArtistsAndTracks = {};

    for (let count = 0;; count ++) {
        console.log(count);
        const playlist = await fetchPlaylist(accessToken, count); // count is the offset
        if (typeof playlist === "undefined") break;

        const tracks = await fetchTracksFromPlaylist(accessToken, playlist.tracks.href, currentUserProfile);
        tracks.forEach((track: APITrackObject) => {
            const artists = track.artists.map((obj: ArtistFromTrack) => obj.name)
            artists.forEach((artist: string) => {
                /*
                1. If the artist isn't in `artistsAndTracks`, it adds it, then adds the track to the artist's array
                2. If the artist is in there but the track isn't, it adds the track
                3. If the artist is there and the track is there, it does nothing
                */
                if (!Object.keys(artistsAndTracks).includes(artist)) { // 1.
                    artistsAndTracks[artist] = [];
                    artistsAndTracks[artist].push(track);
                } else if (!artistsAndTracks[artist].some((artistTrack: APITrackObject) => artistTrack.id === track.id)) { // 2.
                    artistsAndTracks[artist].push(track);
                } else {} // 3.
            })
        })
    }
    console.log(artistsAndTracks);
    return artistsAndTracks;
}

export async function* fetchAllArtistsGenerator(accessToken: string) {
    const currentUserProfile = await fetchCurrentUserProfile(accessToken);

    interface ArtistsAndTracks {
        [artist: string]: Array<APITrackObject>
    }
    const artistsAndTracks: ArtistsAndTracks = {};

    for (let count = 0;; count ++) {
        console.log(count);
        const playlist = await fetchPlaylist(accessToken, count); // count is the offset
        if (typeof playlist === "undefined") {
            yield artistsAndTracks;
            break;
        };

        const tracks = await fetchTracksFromPlaylist(accessToken, playlist.tracks.href, currentUserProfile);

        tracks.forEach((track: APITrackObject) => {
            const artists = track.artists.map((obj: ArtistFromTrack) => obj.name)
            artists.forEach((artist: string) => {
                /*
                1. If the artist isn't in `artistsAndTracks`, it adds it, then adds the track to the artist's array
                2. If the artist is in there but the track isn't, it adds the track
                3. If the artist is there and the track is there, it does nothing
                */
                if (!Object.keys(artistsAndTracks).includes(artist)) { // 1.
                    artistsAndTracks[artist] = [];
                    artistsAndTracks[artist].push(track);
                } else if (!artistsAndTracks[artist].some((artistTrack: APITrackObject) => artistTrack.id === track.id)) { // 2.
                    artistsAndTracks[artist].push(track);
                } else {} // 3.
            })
        });
        yield artistsAndTracks;
    }
    // console.log(artistsAndTracks);
    // return artistsAndTracks;
}
