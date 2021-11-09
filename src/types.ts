export interface FetchPlaylistsResponseObject {
    href: string,
    items: Array<APIPlaylistObject>,
    limit: number,
    next: string, // url to next page of items (includes parameters)
    offset: number,
    previous: null|boolean|undefined,
    total: number
}

export interface APIPlaylistObject {
    collaborative: boolean,
    description: string,
    external_urls: object,
    href: string,
    id: string,
    images: Array<object>|null|undefined,
    name: string,
    owner: {
        "display_name": string,
        "external_urls": {
            "spotify": string
        },
        "href": string,
        "id": string,
        "type": string,
        "uri": string
    },
    primary_color: string|null,
    public: boolean,
    snapshot_id: string,
    tracks: {
        href: string,
        total: number
    },
    type: string,
    uri: string
}

export interface APITrackObject {
    "album": {
        "album_type": string, // e.g. "album"
        "artists": [
            {
                "external_urls": {
                    "spotify": string // e.g. "https://open.spotify.com/artist/711MCceyCBcFnzjGY4Q7Un"
                },
                "href": string, // e.g. "https://api.spotify.com/v1/artists/711MCceyCBcFnzjGY4Q7Un"
                "id": string, // e.g. "711MCceyCBcFnzjGY4Q7Un"
                "name": string, // e.g. "AC/DC"
                "type": string, // e.g. "artist"
                "uri": string, // e.g. "spotify:artist:711MCceyCBcFnzjGY4Q7Un"
            }
        ],
        "available_markets": Array<string|undefined|null>,
        "external_urls": {
            "spotify": string, // e.g."https://open.spotify.com/album/4iMaHsHqTg3rwOtRa5wEbm"
        },
        "href": string, // e.g."https://api.spotify.com/v1/albums/4iMaHsHqTg3rwOtRa5wEbm",
        "id": string, // e.g. "4iMaHsHqTg3rwOtRa5wEbm",
        "images": [
            {
                "height": number, // e.g.640,
                "url": string, // e.g. "https://i.scdn.co/image/ab67616d0000b2733bf8d1987a42dd781a8039de",
                "width": number, // e.g. 640
            },
            {
                "height": number, // e.g. 300,
                "url": string, // e.g. "https://i.scdn.co/image/ab67616d00001e023bf8d1987a42dd781a8039de",
                "width": number, // e.g. 300
            },
            {
                "height": number, // e.g. 64,
                "url": string, // e.g. "https://i.scdn.co/image/ab67616d000048513bf8d1987a42dd781a8039de",
                "width": number, // e.g. 64
            }
        ],
        "name": string, // e.g. "Powerage",
        "release_date": string, // e.g. "1978-05-05",
        "release_date_precision": string, // e.g. "day",
        "total_tracks": number, // e.g. 9,
        "type": string, // e.g. "album",
        "uri": string, // e.g. "spotify:album:4iMaHsHqTg3rwOtRa5wEbm"
    },
    "artists": [
        {
            "external_urls": {
                "spotify": string, // e.g. "https://open.spotify.com/artist/711MCceyCBcFnzjGY4Q7Un"
            },
            "href": string, // e.g. "https://api.spotify.com/v1/artists/711MCceyCBcFnzjGY4Q7Un",
            "id": string, // e.g. "711MCceyCBcFnzjGY4Q7Un",
            "name": string, // e.g. "AC/DC",
            "type": string, // e.g. "artist",
            "uri": string, // e.g. "spotify:artist:711MCceyCBcFnzjGY4Q7Un"
        }
    ],
    "available_markets": Array<string>,
    "disc_number": number, // e.g. 1,
    "duration_ms": number, // e.g. 217640,
    "episode": boolean, // e.g. false,
    "explicit": boolean, // e.g. false,
    "external_ids": {
        "isrc": string, // e.g. "AUAP07800005"
    },
    "external_urls": {
        "spotify": string, // e.g. "https://open.spotify.com/track/2308VPPaMh7Q3AX1Zap99A"
    },
    "href": string, // e.g. "https://api.spotify.com/v1/tracks/2308VPPaMh7Q3AX1Zap99A",
    "id": string, // e.g. "2308VPPaMh7Q3AX1Zap99A",
    "is_local": boolean, // e.g. false,
    "name": string, // e.g. "Rock 'N' Roll Damnation",
    "popularity": number, // e.g. 55,
    "preview_url": string, // e.g. "https://p.scdn.co/mp3-preview/1c6277519601cb3d2430c79070ba867d62f6fe61?cid=981a9b6b3b954110a038794709def737",
    "track": boolean, // e.g. true,
    "track_number": number, // e.g. 1,
    "type": string, // e.g. "track",
    "uri": string, // e.g. "spotify:track:2308VPPaMh7Q3AX1Zap99A"
}

export interface APIUserObject {
    "country": string,
    "display_name": string,
    "email": string,
    "explicit_content": {
      "filter_enabled": boolean,
      "filter_locked": boolean
    },
    "external_urls": {
      "spotify": string
    },
    "followers": {
      "href": string,
      "total": number
    },
    "href": string,
    "id": string,
    "images": [
      {
        "url": any, // probably string but not sure :(
        "height": any, // probably number but not sure what other possible values are :(
        "width": any, // probably number but not sure what other possible values are :(
      }
    ],
    "product": string,
    "type": string,
    "uri": string
}

interface Image {
    "height": number,
    "url": string,
    "width": number
}

export interface APIArtistObject {
    "external_urls": {
        "spotify": string
    },
    "followers": {
        "href": any, // was null but idk what values it could be
        "total": number
    },
    "genres": Array<string>,
    "href": string,
    "id": string,
    "images": Array<Image>,
    "name": string,
    "popularity": number,
    "type": string,
    "uri": string
}

export interface ArtistFromTrack {
    "external_urls": {
        "spotify": string
    },
    "href": string,
    "id": string,
    "name": string,
    "type": string,
    "uri": string
}

export interface ArtistsAndTracks {
    [key: string]: Array<APITrackObject>
}
