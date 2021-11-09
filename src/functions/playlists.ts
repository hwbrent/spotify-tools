import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";

import {
    areEqual,
    x_www_form_urlencoded
} from "./general-functions";

import { 
    APIPlaylistObject,
    FetchPlaylistsResponseObject,
    APITrackObject,
    APIUserObject
} from "../types";
import e from "express";

require("dotenv").config();

export async function fetchPlaylist(accessToken: string, offset: number) {
    // https://developer.spotify.com/documentation/web-api/reference/#/operations/get-a-list-of-current-users-playlists
    const params = x_www_form_urlencoded({
        limit: 1,
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
    // console.log(data);
    return data.items[0];
}