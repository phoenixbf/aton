/*
    ATON ASCII Utils

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Utilities to perform GET, POST, PUT, PATCH or DELETE requests
@namespace REQ
*/
let REQ = {};

/**
Perform a GET request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {function} onResponse - JSON response
@example
ATON.REQ.get("scenes", data => { console.log(data) })
*/
REQ.get = (endpoint, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = ATON.PATH_RESTAPI2 + endpoint;

    fetch(endpoint, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then( onResponse )
    .catch( (err)=>{
        console.log("ERROR: "+err);
        if (onError) onError(err);
    });

    return REQ;
};

/**
Perform a POST request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - JSON response
*/
REQ.post = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = ATON.PATH_RESTAPI2 + endpoint;

    fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => response.json())
    .then( onResponse )
    .catch( (err)=>{
        console.log("ERROR: "+err);
        if (onError) onError(err);
    });

    return REQ;
};

/**
Perform a PUT request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - JSON response
*/
REQ.put = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = ATON.PATH_RESTAPI2 + endpoint;

    fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => response.json())
    .then( onResponse )
    .catch( (err)=>{
        console.log("ERROR: "+err);
        if (onError) onError(err);
    });

    return REQ;
};


/**
Perform a PATCH request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - JSON response
*/
REQ.patch = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = ATON.PATH_RESTAPI2 + endpoint;

    fetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => response.json())
    .then( onResponse )
    .catch( (err)=>{
        console.log("ERROR: "+err);
        if (onError) onError(err);
    });

    return REQ;
};

/**
Perform a DELETE request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {function} onResponse - JSON response
*/
REQ.delete = (endpoint, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = ATON.PATH_RESTAPI2 + endpoint;

    fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
    })
    .then(response => response.json())
    .then( onResponse )
    .catch( (err)=>{
        console.log("ERROR: "+err);
        if (onError) onError(err);
    });

    return REQ;
};


export default REQ;