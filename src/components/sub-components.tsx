import React, { useState, useEffect, ReactComponentElement, BaseSyntheticEvent } from "react";
import { isTemplateExpression } from "typescript";
import "../App.css";

import {
    areEqual,
    fetchAllArtistsAndTracks2,
    useForceRerender
} from "../functions/general-functions";
import {
    fetchNumberOfSavedTracks
} from "../functions/tracks";
import {
    fetchNumberOfPlaylists
} from "../functions/playlists";

import {
    APIPlaylistObject,
    APITrackObject,
    ArtistsAndTracks,
    SubArtistObj,
    YieldObject
} from "../types";
import { type } from "os";

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

export function SeeArtistAllTracks(props: {accessToken: string, refreshToken: string}) {

    const [ numberOfPlaylists, setNumberOfPlaylists ] = useState<number>(0);
    const [ numberOfSavedTracks, setNumberOfSavedTracks ] = useState<number>(0);
    // const [ artistsAndTracks, setArtistsAndTracks ] = useState<ArtistsAndTracks>({});
    const [ playlistProgress, setPlaylistProgress ] = useState<number>(0);
    const [ trackProgress, setTrackProgress ] = useState<number>(0);
    // const forceRerender = useForceRerender();
    
    useEffect(() => {

        // fetchNumberOfPlaylists(props.accessToken).then(data => setNumberOfPlaylists(data));
        // fetchNumberOfSavedTracks(props.accessToken).then(data => setNumberOfSavedTracks(data));
        async function fetchTotals() {
            const numofPlaylists = await fetchNumberOfPlaylists(props.accessToken);
            const numofTracks = await fetchNumberOfSavedTracks(props.accessToken);
            console.log(numofPlaylists);
            console.log(numofTracks);
            await setNumberOfPlaylists(numofPlaylists);
            await setNumberOfSavedTracks(numofTracks);
            // console.log("Number of playlists:", numberOfPlaylists);
            // console.log("Number of saved tracks:", numberOfSavedTracks);
        }

        fetchTotals();

        async function fetchData() {
            const start = performance.now();
            const generator = fetchAllArtistsAndTracks2(props.accessToken, props.refreshToken);
            for await (let entry of generator) {
                console.log(entry);
                if (entry instanceof Array) {
                    const [ type, count ] = entry;
                    if (!type) setPlaylistProgress(count);
                    else setTrackProgress(count);
                }
            }
            const end = performance.now();
            console.log("Time taken:", end-start);
        }
        fetchData();
    }, [props.accessToken]);

    return (
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
}

/*
export function SeeArtistAllTracks(props: {accessToken: string, refreshToken: string}) {
    const [ totalPlaylists, setTotalPlaylists ] = useState<number>(0);
    const [ progress, setProgress ] = useState<any>(0);
    const [ artistsAndTracks, setArtistsAndTracks ] = useState<ArtistsAndTracks>({});
    const [ chosenArtist, setChosenArtist ] = useState<string>("");
    // const forceRerender = useForceRerender();
    
    useEffect(() => {
        async function fetchData() {
            const numberOfPlaylists = await fetchNumberOfPlaylists(props.accessToken);
            await setTotalPlaylists(numberOfPlaylists);

            const generator = fetchAllArtistsAndTracks2(props.accessToken, props.refreshToken);
            for await (let item of generator) {
                if (item instanceof Array) {
                    const [ count, playlistName, keys] = item;
                    // await setProgress(`Processing playlist #${count} - "${playlistName}"`);
                    await setProgress(item);
                } else {
                    await setArtistsAndTracks(item);
                    await setProgress("");
                }
            }
        }
        fetchData();
    }, [])

    if (areEqual(artistsAndTracks, {})) {
        return (
            <>
            <code>{`Processing playlist #${progress[0]} - "${progress[1]}"`}</code> <br/>
            <progress max={totalPlaylists} value={progress[0]}>%</progress>
            </>
        );
    }
    
    const handleDatalistChange = async (event: BaseSyntheticEvent) => {
        // console.log(event.target.value);
        setChosenArtist(event.target.value);
    }

    const datalistData = (areEqual(artistsAndTracks, {}))
        ? []
        : Object.keys(artistsAndTracks);

    const defaultOption = (progress === "")
        ? null
        : progress;
    
    const artistSongs = (chosenArtist === "" || areEqual(artistsAndTracks, {}) || !Object.keys(artistsAndTracks).includes(chosenArtist))
        ? null
        : artistsAndTracks[chosenArtist].map((track: APITrackObject, key: number) => {
            const song = <b>{track.name}</b>;
            // const artists = track.artists.map((artist: SubArtistObj) => artist.name);
            const album = <i>{track.album.name}</i>;
            return <li key={key}>{song} - {album}</li>;
        })
    
    const artisth3 = (!Object.keys(artistsAndTracks).includes(chosenArtist))
        ? null
        : chosenArtist;

    return (
        <div>
            <Datalist
                data={datalistData}
                onChange={handleDatalistChange}
                defaultOption={defaultOption} />

            <div>
                <h3>{artisth3}</h3>
                <ul>
                    {artistSongs}
                </ul>
            </div>

        </div>
    );
}
*/
