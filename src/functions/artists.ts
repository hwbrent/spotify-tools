import { APITrackObject } from "../types";

export async function fetchArtistFromHREF(accessToken: string, href: string) {
    const response = await fetch(href, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    console.log("artist data:", data);
    return data;
}

function getArtistNamesFromTrack(track: APITrackObject) {
    return track.artists.map(artist => artist.name);
}
