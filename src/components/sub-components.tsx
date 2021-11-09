import React, { useState, useEffect, ReactComponentElement, BaseSyntheticEvent } from "react";
import { areEqual, fetchAllArtists, useForceRerender } from "../functions/general-functions";
import "../App.css";

import {
    APIPlaylistObject,
    APITrackObject,
    ArtistsAndTracks
} from "../types";

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
    data: Array<string>
}
export function Datalist(props: DatalistProps) {
    const [ value, setValue ] = useState<string>();
    return null;
}



export function ArtistDatalist(props: {accessToken: string}) {
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ chosenArtist, setChosenArtist ] = useState<string>("");
    const [ artistsAndTracks, setArtistsAndTracks ] = useState<ArtistsAndTracks>({});

    useEffect(() => {
        async function fetchData() {
            await setLoading(true);
            const response = await fetchAllArtists(props.accessToken);
            setArtistsAndTracks(response);
        }
        fetchData();
    }, []);

    if (loading === false) {
        return null; // nothing
    }
    if (areEqual(artistsAndTracks, {})) {
        return <code>Loading...</code>;
    }

    const handleChange = (event: BaseSyntheticEvent) => {
        console.log(event);
    }
    const datalist = (
        <label>
            Start typing or click the dropdown to select an artist: <br/>
            <input type="text" list="data" onChange={handleChange} />
            <datalist id="data">
                {Object.keys(artistsAndTracks).map((artist: string, key: number) => <option key={key} value={artist}/>)}
            </datalist>
        </label>
    );
    return datalist;
}

export function ListOfArtists(props: {accessToken: string}) {
    const [ artistsAndTracks, setArtistsAndTracks ] = useState<ArtistsAndTracks>({});
    const [ clicked, setClicked ] = useState<boolean>(false);
    // const forceRerender = useForceRerender();

    let LIs;
    if (areEqual(artistsAndTracks, {}) && clicked === false) {
        LIs = null;
    } else if (areEqual(artistsAndTracks, {}) && clicked === true) {
        LIs = <code>Loading...</code>;
    } else {
        LIs = Object.keys(artistsAndTracks).map((artist: string, key: number) => <li key={key}>{artist}</li>);
    }

    const handleClick = async () => {
        await setClicked(true);
        const response = await fetchAllArtists(props.accessToken);
        setArtistsAndTracks(response);
    }

    return (
        <div>
        <button type="button" onClick={handleClick}>Click to render list of artists</button>
        <ul>{LIs}</ul>
        </div>
    );
}
