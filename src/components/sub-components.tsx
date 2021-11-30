import React, { useState, useEffect, ReactComponentElement, BaseSyntheticEvent } from "react";
import { isTemplateExpression } from "typescript";
import "../App.css";

import {
    areEqual,
    fetchAllArtistsAndTracks2,
    fetchUserTopItems,
    useForceRerender,
    time_period
} from "../functions/general-functions";
import {
    fetchNumberOfSavedTracks
} from "../functions/tracks";
import {
    fetchNumberOfPlaylists,
    fetchAllPlaylistNames,
    createArtistPlaylist
} from "../functions/playlists";

import {
    APIArtistObject,
    APIPlaylistObject,
    APITrackObject,
    ArtistsAndTracks,
    SubArtistObj,
    YieldObject
} from "../types";
import { type } from "os";
import { stringify } from "querystring";

//////////////////////////////////////////////////////////////
///// General components not related to the Spotify data /////
//////////////////////////////////////////////////////////////

export function MainBody(props: {leftCol: any, rightCol: any}) {
    return (
        <div className="container">
            <div className="row">
                <div className="col-md-2 text-left">
                    <div id="leftCol1">{props.leftCol}</div>
                </div>
                <div className="col-md-10 text-left">
                    <div id="rightCol1">{props.rightCol}</div>
                </div>
            </div>
        </div>
    );
}

// the any's are lazy, need to come back and fix that
interface NavProps {
    onClick: (event: BaseSyntheticEvent) => void;
    pages: Array<string>;
};
export function Nav(props: NavProps) {
    return (
        <ul>
            {props.pages.map((page, key: number) => {
                return <li className="NavLI" key={key} onClick={props.onClick}>{page}</li>;
            })}
        </ul>
    );
}

interface DatalistProps {
    onChange: (event: BaseSyntheticEvent) => void;
    data: Array<string>;
    defaultOption: string|null;
}
export function Datalist(props: DatalistProps) {
    const options = (props.data.length === 0)
        ? null
        : props.data.map((datum: string, key: number) => <option key={key} value={datum}/>)
    
    const defaultOption = (props.defaultOption === null)
        ? null
        : <option key={0} value={props.defaultOption}/>;

    return (
        <div>
        <label>
            Select an artist:
            <input type="text" list="data" onChange={props.onChange}/>
            <datalist id="data">
                {defaultOption}
                {options}
            </datalist>
        </label>
        </div>
    );
}

///////////////////////////////////////////////////////////////
///// Components specifically related to the Spotify data /////
///////////////////////////////////////////////////////////////

interface ArtistLIsProps {
    artistNames: Array<string>,
    onClick?: (event: BaseSyntheticEvent) => void
}
export function ArtistLIs(props: ArtistLIsProps) {
    const mappedNames = props.artistNames.map((name: string, key: number) => (
        <li key={key} onClick={props.onClick}>{name}</li>
    ))
    return <ul>{mappedNames}</ul>;
}

export function ListOfPlaylistNames(props: {accessToken: string}) {
    // const [ playlistNames, setPlaylistNames ] = useState<Array<string>>([]);
    const [ playlistNames, setPlaylistNames ] = useState<Array<Array<string>>>([]);

    useEffect(() => {
        async function fetchData() {
            const response = await fetchAllPlaylistNames(props.accessToken);
            setPlaylistNames(response);
        }
        fetchData();
    }, []);

    const mapped = playlistNames.map((entry: any, key: number) => {
        return (
        <li key={key}>
            <b>{entry[0]}</b> - <i>{entry[1]}</i>
        </li>
        );
    });

    if (playlistNames.length === 0) return <code>Loading...</code>;
    
    return (
        <>
        <i>Total number of playlists: {playlistNames.length}</i>
        <ul>{mapped}</ul>
        </>
    );
}

export function SeeUserTop(props: {accessToken: string}) {
    interface Data {
        type: string,
        time_range: any, // this is fudged, time_range will be a string, but TS indexing of objects is annoying
        data: Array<any>
        // data: Array<APIArtistObject> | Array<APITrackObject>
    }
    const [ data, setData ] = useState<Data|any>({});
    const [ typeChoice, setTypeChoice ] = useState<string>("artists");
    const [ timeRangeChoice, setTimeRangeChoice ] = useState<string>("medium_term");

    useEffect(() => {
        async function fetchData() {
            const response = await fetchUserTopItems(props.accessToken, 15, 0, "tracks");
            setData(response);
        }
        fetchData();
    }, [typeChoice, timeRangeChoice]);

    console.log(data.data);

    if (typeof data === "undefined" || typeof data.data === "undefined") return <p>null</p>;

    const mapped = data?.data.map((entry: APIArtistObject|APITrackObject, key: number) => {
        return <li key={key}>{entry.name}</li>;
    })

    if (data?.data.length === 0) {
        return <code>Loading...</code>;
    } else {
        return (
            <>
            <i>Data type</i>: {data?.type} <br/>
            <i>Time period</i>: {data?.time_range}
            <ul>{mapped}</ul>
            </>
        );
    }
}

function ArtistTracksWidget(props: {
    accessToken: string,
    artistName: string,
    artistTracks: Array<APITrackObject>
}) {
    if (props.artistName === undefined || props.artistTracks === undefined) return null;
    const mappedTracks = props.artistTracks.map((track: APITrackObject, key: number) => {
        return (
            <li key={key}>
                <b>{track.name}</b> - <i>{track.album.name}</i>
            </li>
        );
    });
    const handleClick = async (event: BaseSyntheticEvent) => { // this is where I call the createArtistPlaylist function
        console.log(event.target);
        createArtistPlaylist(props.accessToken, props.artistName, props.artistTracks);
    }
    return (
        <div>
            <hr/>
            <h3>{props.artistName}</h3>
            <button type="button" onClick={handleClick}>Click</button>
            {mappedTracks} <br/>
            <hr/>
        </div>
    );
}

export function SeeArtistAllTracks(props: {accessToken: string, refreshToken: string}) {
    /* Renders some text whilst the computing is being done, then renders a list of all the artists */

    const [ numberOfPlaylists, setNumberOfPlaylists ] = useState<number>(0);
    const [ numberOfSavedTracks, setNumberOfSavedTracks ] = useState<number>(0);
    const [ artistsAndTracks, setArtistsAndTracks ] = useState<ArtistsAndTracks>({});
    const [ playlistProgress, setPlaylistProgress ] = useState<number>(0);
    const [ trackProgress, setTrackProgress ] = useState<number>(0);

    const [ toggled, setToggled ] = useState<boolean>(false);
    const [ chosenArtist, setChosenArtist ] = useState<string>("");
    // const forceRerender = useForceRerender();
    
    const handleBeginButtonClick = () => { // was a useEffect
        setToggled(true);
        async function fetchTotals() {
            const numofPlaylists = await fetchNumberOfPlaylists(props.accessToken, true);
            const numofTracks = await fetchNumberOfSavedTracks(props.accessToken);
            console.log(numofPlaylists);
            console.log(numofTracks);
            await setNumberOfPlaylists(numofPlaylists);
            await setNumberOfSavedTracks(numofTracks);
        }
        async function fetchData() {
            const start = performance.now();
            const generator = fetchAllArtistsAndTracks2(props.accessToken, props.refreshToken);
            for await (let entry of generator) {
                console.log(entry);
                if (entry instanceof Array) {
                    const [ type, count ] = entry;
                    if (!type) setPlaylistProgress(count);
                    else setTrackProgress(count);
                } else {
                    setArtistsAndTracks(entry);
                }
            }
            const end = performance.now();
            console.log("Time taken:", end-start);
        }
        fetchTotals();
        fetchData();
    }

    const beginButton = <button type="button" onClick={handleBeginButtonClick}>Click to begin</button>;

    const handleLIOnclick = (event: BaseSyntheticEvent) => {
        console.log(event.target.innerHTML);
        setChosenArtist(event.target.innerHTML);
        window.scrollTo(0,0);
    }

    const progressDiv = (
        <div>
            <code>Processing...</code>
            <br/>
            <label>
                <code>Playlist progress:</code>
                <progress max={numberOfPlaylists} value={playlistProgress}></progress>
            </label>
            <br/>
            <label>
                <code>Saved tracks progress:</code>
                <progress max={numberOfSavedTracks} value={trackProgress}></progress>
            </label>
        </div>
    );

    if (!areEqual(artistsAndTracks, {})) console.log(artistsAndTracks);

    const chosenArtistTracks = Object.entries(artistsAndTracks)?.filter((entry: Array<any>) => entry[1] !== chosenArtist)

    return (
        <>
        {beginButton} <br/>

        {(toggled && areEqual(artistsAndTracks, {})) ? progressDiv : null}

        <ArtistTracksWidget
            accessToken={props.accessToken}
            artistName={chosenArtist}
            artistTracks={artistsAndTracks[chosenArtist]}/>

        <ArtistLIs
            artistNames={Object.keys(artistsAndTracks).sort()}
            onClick={handleLIOnclick} />
        </>
    );
}
