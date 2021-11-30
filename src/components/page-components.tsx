import { access } from 'fs';
import React, { useState, useEffect, useRef, BaseSyntheticEvent } from 'react';
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
    fetchAllArtistsAndTracks2,
    fetchCurrentUserProfile,
    useForceRerender,
    refreshAccessToken,
    fetchUserTopItems
} from "../functions/general-functions";
import { fetchAllSavedTracks, fetchNumberOfSavedTracks } from "../functions/tracks";
import {
    fetchAllPlaylists,
    fetchAllPlaylistNames
} from "../functions/playlists";

// components:
import {
    MainBody,
    Nav,
    SeeArtistAllTracks,
    ListOfPlaylistNames,
    SeeUserTop
} from "./sub-components";

// types/interfaces
import {
    APIArtistObject,
    APIPlaylistObject, APITrackObject, APIUserObject
} from "../types";

require("dotenv").config();

/////////////////////////////////////

export function HomePage() {
    console.log("Loaded <HomePage/>");

    useEffect(() => {
        if (window.location.search === "?refresh") document.getElementById("login")?.click(); // sketchy but seems to work
    }, [])

    const button = (
        <label>
            Click this button to open the Spotify login dialog
            {/*<button type="button" onClick={() => window.location.replace("http://localhost:1234/login")}>*/}
            <button id="login" type="button" onClick={async () => requestAuth()}>
                Click
            </button>
        </label>
    );

    return (
        <>
        Welcome :) <br/>
        {button}
        </>
    );
}

export function Callback() {
    console.log("Loaded <Callback/>");

    const [ text, setText ] = useState<string>("");
    const [ token, setToken ] = useState<undefined|object>();

    useEffect(
        () => {
            const urlParams = new URLSearchParams(window.location.search);
            console.log("urlParams:", urlParams);
            if (urlParams.get("error")) setText("Login didn't work");

            const code = urlParams.get("code");
            if (code) {
                fetchToken(code).then(data => setToken(data));
            };

            if (token && text === "") {
                if (!areEqual(token, {"error": "invalid_grant", "error_description": "Invalid authorization code"})) {
                    // console.log("Success!");
                    // console.log(token);
                    setText(JSON.stringify(token));
                    const params = x_www_form_urlencoded(token);
                    // window.location.replace("http://localhost:3000/tokenacquired?" + params);
                    window.location.replace(process.env.REACT_APP_BASE_URI + "tokenacquired?" + params);
                }
            }
        }
    );
    
    return (
        <>
        </>
    );
}

export function TokenAcquired() {
    console.log("Loaded <TokenAcquired/>");
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
                // window.location.replace("http://localhost:3000/"); // goes back to the login page
                // window.location.replace(process.env.REACT_APP_BASE_URI); // goes back to the login page
                window.location.replace(process.env.REACT_APP_BASE_URI || "https://hwbrent-spotify-tools.netlify.app/"); // goes back to the login page

                return
            }
            setAccessToken(url_access_token);
            setRefreshToken(url_refresh_token);

            if (accessToken !== "") {
                fetchCurrentUserProfile(accessToken)
                    .then(response => {
                        setCurrentUserProfile(response);
                    })
                    .catch(error => console.error(error));
            }
        },
        []
    );

    if (accessToken.length === 0) return <p>Nooo...</p>;

    const testButton = (
        <label>
            DO NOT PRESS THIS BUTTON - THIS IS FOR THE DEVELOPER TO USE
            <button type="button" onClick={async () => {
                if (accessToken.length !== 0) {
                    const data = await fetchUserTopItems(accessToken);
                    console.log(data);
                }
                /* alert("Access token expired - getting new one...");
                refreshAccessToken(); */
            }}>Click</button>
        </label>
    );

    const pairings = {
        "List of all playlist names": <ListOfPlaylistNames accessToken={accessToken} />,
        "See all songs for each artist": <SeeArtistAllTracks accessToken={accessToken} refreshToken={refreshToken} />,
        "See user top artists and/or tracks": <SeeUserTop accessToken={accessToken} />
    }

    const handleNavClick = (event: BaseSyntheticEvent) => {
        const pageName = event.target.innerHTML;
        const pageComponent = Object.entries(pairings).filter(entry => entry[0] === pageName)[0][1];
        setChosenPage(pageComponent);
    }

    const body = (
        <>
        {/* <p>Your access token is: <br/> {accessToken}</p> 
        <p>Your refresh token is: <br/> {refreshToken}</p> 
        <hr /> */}
        {testButton} <hr />
        {chosenPage}
        </>
    );

    return (
        <>
        <h2>Welcome {currentUserProfile?.display_name}! You successfully gained authorisation from the Spotify API.</h2>
        <hr/>
        <MainBody
            leftCol={
                <Nav onClick={handleNavClick} pages={Object.keys(pairings)} />
            }
            rightCol={body}
        />
        </>
    );

}
