import { access } from "fs";
import { stderr } from "process";
import { isPropertyAccessOrQualifiedName, isPropertySignature } from "typescript";
import { URLSearchParams } from "url";

import {
    areEqual,
    fetchCurrentUserProfile,
    sortArrayOfObjectsByProperty,
    x_www_form_urlencoded
} from "./general-functions";

import {

} from "./playlists";

import { 
    APIPlaylistObject,
    FetchPlaylistsResponseObject,
    APITrackObject,
    APIUserObject
} from "../types";

require("dotenv").config();

export async function fetchTracksFromPlaylist(accessToken: string, href: string, currentUserProfile: APIUserObject) {
    // https://api.spotify.com/v1/playlists/{ playlist id }/tracks
    // console.log(href);
    const response = await fetch(href, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    // console.log(data);

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

    if (typeof data.items === "undefined") return [];

    const tracks = data.items.filter((track: TrackItem) => track.added_by.id === currentUserProfile.id);
    
    return tracks.map((entry: TrackItem) => entry.track);
}
