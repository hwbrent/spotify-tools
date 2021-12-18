import React, { useState, useEffect, ReactComponentElement, BaseSyntheticEvent } from "react";
import { isTemplateExpression } from "typescript";
import "../App.css";

import {
    areEqual,
    fetchAllArtistsAndTracks2,
    fetchAllArtistsAndTracks3,
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
        <li className="ArtistLI" key={key} onClick={props.onClick}>{name}</li>
    ))
    return <ul>{mappedNames}</ul>;
}

export function ListOfPlaylistNames(props: {accessToken: string}) {
    // const [ playlistNames, setPlaylistNames ] = useState<Array<string>>([]);
    let [ playlistNames, setPlaylistNames ] = useState<Array<Array<string>>>([]);
    let [ mapped, setMapped ] = useState<Array<Array<string>>>([]);

    useEffect(() => {
        async function fetchData() {
            const response = await fetchAllPlaylistNames(props.accessToken);
            setPlaylistNames(response);
            setMapped(response); // if I don't include this line, nothing will appear until after the user interacts with the checkbox
        }
        fetchData();
    }, []);

    const toggleSorted = (
        <label>
            Sorted:
            <input type="checkbox" onChange={async (event: BaseSyntheticEvent) => {
                // if the box is checked, set `mapped` to be the sorted version of playlistNames
                // else, set `mapped` just be playlistNames
                if (playlistNames.length === 0) return;
                if (event.target.checked) {
                    let copy = await [...playlistNames];
                    await copy.sort();
                    setMapped(copy);
                } else {
                    setMapped(playlistNames);
                }
            }}/>
        </label>
    );

    const mappedPlaylistNames = mapped?.map((entry: any, key: number) => {
        return (
        <li key={key}>
            <b>{entry[0]}</b> - <i>{entry[1]}</i>
        </li>
        );
    });

    if (playlistNames.length === 0) return <code>Loading...</code>;
    
    return (
        <>
        {toggleSorted} <br/>
        <i>Total number of playlists: {playlistNames.length}</i>
        <ul>{mappedPlaylistNames}</ul>
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
            const response = await fetchUserTopItems(props.accessToken, 15, 0, typeChoice, timeRangeChoice);
            setData(response);
        }
        fetchData();
    }, [typeChoice, timeRangeChoice]);

    const dataTypeRadios = (
        <form
            onChange={(event: BaseSyntheticEvent) => setTypeChoice(event.target.id)}
            style={{paddingLeft: "2%"}}
        >
        <label>
            Artists:
            <input type="radio" name="radio" id="artists"/>
        </label> <br/>
        <label>
            Tracks:
            <input type="radio" name="radio" id="tracks"/>
        </label>
        </form>
    );

    const timeRangeRadios = (
        <form
            onChange={(event: BaseSyntheticEvent) => setTimeRangeChoice(event.target.id)}
            style={{paddingLeft: "2%"}}
        >
            <label>
                Long term:
                <input type="radio" name="radio" id="long_term"/>
            </label> <br/>
            <label>
                Medium term (default):
                <input type="radio" name="radio" id="medium_term"/>
            </label> <br/>
            <label>
                Short term:
                <input type="radio" name="radio" id="short_term"/>
            </label>
        </form>
    );
    
    // console.log(data.data);

    if (typeof data === "undefined" || typeof data.data === "undefined") return <code>Awaiting data...</code>;

    const mapped = data?.data.map((entry: any, key: number) => { // (entry: any) is dodgy but couldn't get this to work otherwise
        let innerHTML;
        if (entry.type === "artist") {
            innerHTML = <b>{entry.name}</b>;
        } else {
            const artists = entry.artists.map((artist: any) => artist.name).join(", ");
            innerHTML = <><b>{entry.name}</b> - <i>{artists}</i></>;
        }
        return <li key={key}>{innerHTML}</li>;
    })

    if (data?.data.length === 0) {
        return <code>Loading...</code>;
    } else {
        return (
            <>
            <i><b>Data type</b></i>: {data?.type}
            <br/>
            {dataTypeRadios}
            <i><b>Time period</b></i>: {data?.time_range}
            <br/>
            {timeRangeRadios}
            <hr/>
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
            <h3 style={{display: "inline-block"}}>{props.artistName}</h3>
            <button type="button" onClick={handleClick}>Click to generate artist playlist</button>
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

    const [ toggled, setToggled ] = useState<boolean>(false); // redundant now...?
    const [ chosenArtist, setChosenArtist ] = useState<string>("");
    // const forceRerender = useForceRerender();
    
    useEffect(() => {
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
            const generator = fetchAllArtistsAndTracks3(props.accessToken, props.refreshToken);
            for await (let entry of generator) {
                // console.log(entry);
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
        /*
        - The issue I was having previously was that I was getting loads of API Rate Limit Exceeded error
        - I was so confused as to why - I rewrote my fetchArtistsAndTracks generator twice to no avail
        - I realised it was because I called fetchTotals() and fetchData() without saying await
        - Including the below mini-funciton doAll() fixed this issue
        */
        async function doAll() {
            await fetchTotals();
            await fetchData();
        }
        doAll();
    }, []);

    // const beginButton = <button type="button" onClick={handleBeginButtonClick}>Click to begin</button>;

    const handleLIOnclick = (event: BaseSyntheticEvent) => {
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

    // if (!areEqual(artistsAndTracks, {})) console.log(artistsAndTracks);

    const chosenArtistTracks = Object.entries(artistsAndTracks)?.filter((entry: Array<any>) => entry[1] !== chosenArtist)

    const instructions = (
        "Click on an artist's name to see the tracks of theirs that you have in your Spotify library across all your playlists and saved tracks.\n" +
        "Click on the button next to their name to create a Spotify playlist comprised of the aforementioned tracks."
    );

    return (
        <>
        {/* {beginButton} <br/> */}

        {(toggled && areEqual(artistsAndTracks, {})) ? progressDiv : null}

        {(toggled && !areEqual(artistsAndTracks, {})) ? <p>instructions</p> : null}

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
