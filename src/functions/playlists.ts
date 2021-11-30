import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";

import {
    areEqual,
    x_www_form_urlencoded,
    APIRateLimitExceeded,
    fetchCurrentUserProfile,
    AccessTokenExpired,
    refreshAccessToken,
    delay,
    requestParamObject
} from "./general-functions";
import { 
    fetchAllSavedTracks
} from "./tracks";

import { 
    APIPlaylistObject,
    FetchPlaylistsResponseObject,
    APITrackObject,
    APIUserObject
} from "../types";
import e from "express";
import { computeHeadingLevel } from "@testing-library/react";
import { fetchNumberOfSavedTracks } from "./tracks";

require("dotenv").config();

export async function fetchAllPlaylistNames(accessToken: string) {
    /* Array<string> */
    // const names: Array<string> = [];
    const names: Array<Array<string>> = [];

    let count = 0;
    while (true) {
        const params = x_www_form_urlencoded({
            limit: 50,
            offset: count
        });
        const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, requestParamObject(accessToken));
        const data = await response.json();

        if (response.status !== 200) {
            console.error(response);
            console.error(data);
        }

        const playlists: Array<APIPlaylistObject> = data.items;

        if (playlists.length === 0) break;

        for (let playlist of playlists) {
            // names.push(playlist.name);
            // names.push(`"${playlist.name}"    –    ${playlist.owner.display_name}`);
            // console.log(`"${playlist.name}"    -     ${playlist.owner.display_name}`);
            names.push( [playlist.name, playlist.owner.display_name] );
            // if (playlist.name.length === 0) console.log(playlist);
        }

        count += 50;
    }
    return names;
}

export async function fetchPlaylist(accessToken: string, limit: number, offset: number) {
    // https://developer.spotify.com/documentation/web-api/reference/#/operations/get-a-list-of-current-users-playlists
    const params = x_www_form_urlencoded({
        limit: limit,
        offset: offset
    });
    const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, requestParamObject(accessToken));
    const data = await response.json();

    if (response.status !== 200) {
        console.error(response);
        console.error(data);
    }

    // console.log("data:", data);
    return data.items[0];
}

export async function fetchNumberOfPlaylists(accessToken: string, userOwned: boolean = false) {
    const currentUser = await fetchCurrentUserProfile(accessToken);
    let count = 0;
    let ownedCount = 0;
    for (let i = 0;; i += 50) {
        const params = x_www_form_urlencoded({
            limit: 50,
            offset: i
        });
        const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, requestParamObject(accessToken));
        const data = await response.json();

        if (response.status !== 200) {
            console.error(response);
            console.error(data);
            if (areEqual(data, AccessTokenExpired)) {
                alert("Sorry, your access token expired. The page will reload - please try again.");
                refreshAccessToken();
            }
        }

        if (data.items.length === 0) break;
        
        // if (userOwned) {
        //     const userOwnedPlaylists = data.items.filter((playlist: APIPlaylistObject) => playlist.id !== currentUser.id);
        //     // console.log(data.items.length, "vs", userOwnedPlaylists.length);
        //     count += userOwnedPlaylists.length
        // } else {
        //     count += data.items.length;
        // }
        const userOwnedPlaylists = data.items.filter((playlist: APIPlaylistObject) => playlist.id !== currentUser.id);
        ownedCount += userOwnedPlaylists.length;
        count += data.items.length
    }
    console.log(count,"vs", ownedCount);
    return count;
}

async function fetchPlaylistData(accessToken: string, limit: number, offset: number) {
    async function fetchData() {
        const params = x_www_form_urlencoded({
            limit: limit,
            offset: offset
        });
        const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, requestParamObject(accessToken));
        return response;
    }
    let response = await fetchData();
    let data = await response.json();

    if (response.status !== 200) {
        console.log(data.error);
        if (areEqual(data, AccessTokenExpired)) {
            alert("Sorry, your access token expired. The page will reload - please try again.");
            refreshAccessToken();
        }
        if (areEqual(data, APIRateLimitExceeded)) {
            // const errorMessage = data.error.message;
            // const retryAfter = response.headers.get("Retry-After");
        }
    }
    return data.items;
}

export async function* fetchAllPlaylists(accessToken: string, incrementBy: number = 50) {
    const total = await fetchNumberOfPlaylists(accessToken);

    for (let count = 0; count < 10_000; count += incrementBy) {
        const playlists = await fetchPlaylistData(accessToken, incrementBy, count);
        // console.log(`${count} / ${total} –– `, playlists);
        if ((playlists instanceof Array) && playlists.length === 0) {
            break;
        } else {
            yield playlists;
        }
    }
}

export async function createArtistPlaylist(
    accessToken: string,
    artistName: string,
    tracks: Array<APITrackObject>
) {
    /*
    Create playlist: https://developer.spotify.com/documentation/web-api/reference/#/operations/create-playlist
    Add tracks: https://developer.spotify.com/documentation/web-api/reference/#/operations/add-tracks-to-playlist
    */

    const user = await fetchCurrentUserProfile(accessToken);

    //////////////////////////////////
    // Creating the empty playlist: //
    //////////////////////////////////
    const response1 = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: "POST",
        body: JSON.stringify({
            name: `${artistName}`,
            public: true,
            collaborative: false,
            description: "Created with https://hwbrent-spotify-tools.netlify.app/"
        }),
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });
    const data1 = await response1.json();

    if (response1.status !== 201) {
        console.log(data1.error);
    }

    ///////////////////////////////////////////////////////
    // Adding the artist's tracks to the empty playlist: //
    ///////////////////////////////////////////////////////
    const trackURIs = tracks.map((track: APITrackObject) => track.uri);

    const response2 = await fetch(`https://api.spotify.com/v1/playlists/${data1.id}/tracks`, {
        method: "POST",
        body: JSON.stringify({uris: trackURIs}),
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });
    const data2 = await response2.json();

    if (response2.status !== 201) {
        console.log(data2.error);
    } else {
        alert("Playlist created successfully!");
        const openInNewTab = window.confirm(
            "Playlist created successfully! \n\n" +
            "If you'd like to open the new playlist in the Spotify web app in a new tab, click 'OK', otherwise click 'Cancel'."
        );
        if (openInNewTab) window.open(data1.external_urls.spotify); // opens spotify web player window of the newly created playlist in new tab
    }
}
