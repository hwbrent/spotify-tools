import { access } from 'fs';
import React, { useState, useEffect, BaseSyntheticEvent } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import "../App.css";

// functions
import {
    requestAuth,
    fetchToken,
    areEqual,
    x_www_form_urlencoded,
    fetchAllArtists,
    fetchAllArtistsGenerator,
    fetchCurrentUserProfile,
    useForceRerender
} from "../functions/general-functions";
// import { getArrayOfTracks } from "../functions/tracks";
import {  } from "../functions/playlists";

// components:
import {
    MainBody,
    Nav,
    ListOfArtists
} from "./sub-components";

// types/interfaces
import {
    APIArtistObject,
    APIPlaylistObject, APITrackObject, APIUserObject
} from "../types";

export function HomePage() {

    /*
    useEffect(() => {
        async function fetchData() {
            const url = await requestAuth();
            console.log(url);
        }
        fetchData();
    }, [])
    */

    const button = (
        <label>
            Click this button to open the Spotify login dialog
            {/*<button type="button" onClick={() => window.location.replace("http://localhost:1234/login")}>*/}
            <button type="button" onClick={async () => requestAuth()}>
                Click
            </button>
        </label>
    );

    return (
        <>
        Welcome :)
        {button}
        </>
    );
}

export function Callback() {
    const [ text, setText ] = useState<any>();
    const [ token, setToken ] = useState<undefined|object>();

    useEffect(
        () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("error")) setText("Login didn't work");

            const code = urlParams.get("code");
            if (code) {
                fetchToken(code).then(data => {
                    setToken(data);
                });
            };

            if (token && !text) {
                if (!areEqual(token, {"error": "invalid_grant", "error_description": "Invalid authorization code"})) {
                    console.log("Success!");
                    console.log(token);
                    setText(JSON.stringify(token));

                    const params = x_www_form_urlencoded(token);
                    window.location.replace("http://localhost:3000/tokenacquired?" + params);
                }
            }
        }
    );
    
    return (
        <>
        {text}
        </>
    );
}

export function TokenAcquired() {
    /*
    This will be the main component where the user does all their customising stuff
    */
    const [ accessToken, setAccessToken ] = useState<string>("");
    const [ refreshToken, setRefreshToken ] = useState<string>("");

    const [ currentUserProfile, setCurrentUserProfile ] = useState<APIUserObject|null>();
    const [ chosenPage, setChosenPage ] = useState<any>();

    useEffect(
        () => {
            const urlParams = new URLSearchParams(window.location.search); // parses the URL for parameters (which is where the access and refresh tokens will be)
            const url_access_token = urlParams.get("access_token");
            const url_refresh_token = urlParams.get("refresh_token");
            if (!url_access_token || !url_refresh_token) { // if there was an error
                console.log(url_access_token);
                alert(urlParams.toString());
                window.location.replace("http://localhost:3000/"); // goes back to the login page
                return
            }
            setAccessToken(url_access_token);
            setRefreshToken(url_refresh_token);

            fetchCurrentUserProfile(accessToken)
            .then(response => {
                setCurrentUserProfile(response);
            })
            .catch(error => console.error(error));

        },
        []
    );

    if (accessToken.length === 0) return <p>Fuck</p>;

    const testButton = (
        <label>
            Click here to do a lil testy test:
            <button type="button" onClick={async () => {
                if (accessToken.length !== 0) {
                    // const data = await getArrayOfTracks(accessToken);
                }
            }}>Click</button>
        </label>
    );

    const pairings = {
        "List of all artists": <ListOfArtists accessToken={accessToken}/>
    }

    const handleLIClick = (event: BaseSyntheticEvent) => {
        const pageName = event.target.innerHTML;
        const pageComponent = Object.entries(pairings).filter(entry => entry[0] === pageName)[0][1];
        setChosenPage(pageComponent);
    }

    // console.log("ARTISTS:", artists);

    const out = (
        <>
        <p>Your access token is: <br/> {accessToken}</p>
        <p>Your refresh token is: <br/> {refreshToken}</p>
        <hr />
        {testButton} <br />
        {chosenPage}
        </>
    );

    return (
        <>
        <h2>Welcome {currentUserProfile?.display_name}! You successfully gained authorisation from the Spotify API.</h2>
        <hr/>
        <MainBody
            leftCol={
                <Nav onClick={handleLIClick} pages={Object.keys(pairings)} />
            }
            rightCol={out}
        />
        </>
    );

}
