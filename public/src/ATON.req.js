/*
    ATON Requests Utils
    Utilities to perform RESTful requests

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Utilities to perform RESTful requests
@namespace REQ
*/
let REQ = {};

REQ.init = ()=>{
    REQ._base = ATON.PATH_RESTAPI2;
};


/**
Change base path/domain to perform RESTful requests
@param {string} base - new base domain for REST API (http://.../api/v1/)
@example
ATON.REQ.setBaseDomain("http://..../api/v1/")
*/
REQ.setBaseDomain = (base)=>{
    if (!base.startsWith("http")) return REQ;

    REQ._base = base;
    return REQ;
};

/**
Perform a GET request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {function} onResponse - Routine to handle a valid JSON response
@param {function} onError - Routine to handle error
@example
ATON.REQ.get("scenes", data => { console.log(data) })
*/
REQ.get = (endpoint, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = REQ._base + endpoint;

    fetch(endpoint, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok){
            if (onError) onError();
            return;
        }

        response.json().then( onResponse ).catch( (err)=>{
            console.log("ERROR: "+err);
            if (onError) onError(err);
        });
    });

    return REQ;
};

/**
Perform a POST request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - Routine to handle a valid JSON response
@param {function} onError - Routine to handle error
*/
REQ.post = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = REQ._base + endpoint;

    fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => {
        if (!response.ok){
            if (onError) onError();
            return;
        }

        response.json().then( onResponse ).catch( (err)=>{
            console.log("ERROR: "+err);
            if (onError) onError(err);
        });
    });

    return REQ;
};

/**
Perform a PUT request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - Routine to handle a valid JSON response
@param {function} onError - Routine to handle error
*/
REQ.put = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = REQ._base + endpoint;

    fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => {
        if (!response.ok){
            if (onError) onError();
            return;
        }

        response.json().then( onResponse ).catch( (err)=>{
            console.log("ERROR: "+err);
            if (onError) onError(err);
        });
    });

    return REQ;
};


/**
Perform a PATCH request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {object} bodyobj - Body object
@param {function} onResponse - Routine to handle a valid JSON response
@param {function} onError - Routine to handle error
*/
REQ.patch = (endpoint, bodyobj, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = REQ._base + endpoint;

    fetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(bodyobj),
        credentials: 'include',
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => {
        if (!response.ok){
            if (onError) onError();
            return;
        }

        response.json().then( onResponse ).catch( (err)=>{
            console.log("ERROR: "+err);
            if (onError) onError(err);
        });
    });

    return REQ;
};

/**
Perform a DELETE request
@param {string} endpoint - Endpoint. If local path ("scenes/") perform the request on current server node
@param {function} onResponse - Routine to handle a valid JSON response
@param {function} onError - Routine to handle error
*/
REQ.delete = (endpoint, onResponse, onError)=>{
    if (!endpoint.startsWith("http")) endpoint = REQ._base + endpoint;

    fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok){
            if (onError) onError();
            return;
        }

        response.json().then( onResponse ).catch( (err)=>{
            console.log("ERROR: "+err);
            if (onError) onError(err);
        });
    });

    return REQ;
};

/**
Request login on current node
@param {string} uname - Username
@param {string} passw - Password
@param {function} onSuccess - Routine to handle successful login, data is user
@param {function} onFail - Routine to handle failed login
*/
REQ.login = (uname, passw, onSuccess, onFail)=>{
    return REQ.post("login",
        {
            username: uname, 
            password: passw
        },
        (r)=>{
            if (r && onSuccess) onSuccess(r);
            else if (onFail) onFail();
        },
        (e)=>{
            if (onFail) onFail();
        }
    );
};

/**
Request logout on current node
@param {function} onSuccess - Routine to handle successful login, data is user
@param {function} onFail - Routine to handle failed login
*/
REQ.logout = (onSuccess, onFail)=>{
    return REQ.get("logout", onSuccess, onFail);
};


export default REQ;