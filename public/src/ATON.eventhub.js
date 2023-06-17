/*
    ATON Event Hub

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Event Hub
@namespace EventHub
*/
let EventHub = {};

//Initializes the component
EventHub.init = ()=>{

    EventHub.evLocal   = {};
    EventHub.evNetwork = {};

    // Expose
    ATON.on                 = EventHub.on;
    ATON.fireEvent          = EventHub.fireEvent;
    ATON.clearEventHandlers = EventHub.clearEventHandlers
};

/**
Clear all event handlers for a given event
@param {string} evtname - event name
*/
EventHub.clearEventHandlers = (evtname)=>{
    EventHub.evLocal[evtname]   = [];
    EventHub.evNetwork[evtname] = [];
};

// Execute all handlers from list with given data
EventHub.executeHandlers = (ehList, data)=>{
    if (!ehList) return;

    for (let h = 0; h < ehList.length; h++) {
        const handler = ehList[h];
        if (handler) handler(data);
    }
};

/**
Subscribe to a given event, with local handler and optional network handler.
This is also accessible as ATON.on()
@param {string} evtname - event name
@param {function} handlerLocal - local event handler
@param {function} handlerNetwork - optional network (see Photon) event handler
@example
ATON.EventHub.on("myEvent", function(data){ console.log("received local event"); })
@example
ATON.on("myEvent", function(data){ console.log("received local event"); })
*/
EventHub.on = (evtname, handlerLocal, handlerNetwork)=>{
    // Local event (default)
    if (handlerLocal !== undefined){
        const evhLocal = EventHub.evLocal;

        if (evhLocal[evtname] === undefined) evhLocal[evtname] = []; // First time (event not registered)
        evhLocal[evtname].push(handlerLocal);
    }

    // Received event (network)
    if (handlerNetwork !== undefined){
        ATON.Photon.on(evtname, handlerNetwork);
    }

};

/**
Fire a local (and optionally network) event, with data.
This is also accessible as ATON.fireEvent()
@param {string} evtname - event name
@param {object} data - object containing data to be transmitted with this event
@param {bool} bReplicate - if true, it will replicate (broadcast) the event to other connected peers in the same scene (see Photon)
@example
ATON.EventHub.fireEvent("myEvent", data)
@example
ATON.fireEvent("myEvent", data)
*/
EventHub.fireEvent = (evtname, data, bReplicate)=>{
    const ehList = EventHub.evLocal[evtname];
    EventHub.executeHandlers(ehList, data);

    if (!bReplicate) return;
    ATON.Photon.fireEvent(evtname, data);
};

export default EventHub;