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
    delay
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

export async function fetchPlaylist(accessToken: string, limit: number, offset: number) {
    // https://developer.spotify.com/documentation/web-api/reference/#/operations/get-a-list-of-current-users-playlists
    const params = x_www_form_urlencoded({
        limit: limit,
        offset: offset
    });
    const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, {
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

    // console.log("data:", data);
    return data.items[0];
}

export async function fetchNumberOfPlaylists(accessToken: string) {
    const currentUser = await fetchCurrentUserProfile(accessToken);
    let count = 0;
    for (let i = 0;; i += 50) {
        const params = x_www_form_urlencoded({
            limit: 50,
            offset: i
        });
        const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, {
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
            if (areEqual(data, AccessTokenExpired)) {
                alert("Sorry, your access token expired. The page will reload - please try again.");
                refreshAccessToken();
            }
        }

        const userOwnedPlaylists = data.items.filter((playlist: APIPlaylistObject) => playlist.id !== currentUser.id);
        // const numberOfPlaylists = data.items.length;
        // console.log(userOwnedPlaylists);
        const numberOfPlaylists = userOwnedPlaylists.length;
        // console.log(numberOfPlaylists);
        if (numberOfPlaylists === 0) {
            break;
        } else {
            count += numberOfPlaylists;
        }
        // console.log(count);
    }
    // console.log(count);
    return count;
}

async function fetchPlaylistData(accessToken: string, limit: number, offset: number) {
    async function fetchData() {
        const params = x_www_form_urlencoded({
            limit: limit,
            offset: offset
        });
        const response = await fetch("https://api.spotify.com/v1/me/playlists/?" + params, {
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
        if (areEqual(data, AccessTokenExpired)) {
            alert("Sorry, your access token expired. The page will reload - please try again.");
            refreshAccessToken();
        }
        if (areEqual(data, APIRateLimitExceeded)) {
            const errorMessage = data.error.message;
            // const retryAfter = response.headers.get("Retry-After");
            console.log(response);
            console.log(errorMessage);
            console.log("Im finna delay 2000 ms");
            delay(2000);
            console.log("I dun delayed 2000 ms");
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

/*
export async function fetchAllPlaylists(accessToken: string) {
    const total = await fetchNumberOfPlaylists(accessToken);
    console.log(total);

    const allTracks: Array<APITrackObject> = [];

    const incrementBy = 50;
    for (let count = 0; count < 10_000; count += incrementBy) {
        const tracks = await fetchPlaylistData(accessToken, incrementBy, count);
        console.log(`${count} / ${total} –– `, tracks);
        if ((tracks instanceof Array) && tracks.length === 0) {
            break;
        } else {
            allTracks.push(...tracks);
        }
    }
    console.log("done");
    return allTracks;
}
*/