/*
    ATON Phygital

    This component aims to bridge the digital world with the physical world, allowing to create unique interactive experiences for the users.
    Includes outdoor geolocation tracking and Geo-POI handling

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
This component bridges the digital world with the physical world, allowing to create unique interactive experiences for the users
@namespace Phygital
*/
let Phygital = {};

//Phygital.INTERVAL  = 1000;
Phygital.EARTH_R_KM = 6371.0;
Phygital.EARTH_D_KM = Phygital.EARTH_R_KM * 2.0;


Phygital.init = ()=>{
    Phygital._bActive = false;

    // GeoLocation
    Phygital._wpid       = undefined;
    Phygital._currGeoPos = new THREE.Vector2();

    Phygital._GeoPOIs       = [];        // GeoPOIs list
    Phygital._currGeoPOI    = undefined; // POI we are inside if any
    Phygital._closestGeoPOI = undefined; // closest POI

    Phygital._maxGeoError = 40.0; // max accuracy error allowed
};

/**
Enable geolocation tracking
*/
Phygital.enableGeoTracking = ()=>{
    if (Phygital._bActive) return;
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!navigator.geolocation) return;

    Phygital._wpid = navigator.geolocation.watchPosition(
        Phygital._onGeoPosition,
        Phygital._onGeoError,
        {
            enableHighAccuracy: true,
            //maximumAge        : 30000,
            //timeout           : 27000
        }    
    );

    //window.setInterval( Phygital.update, Phygital.INTERVAL);
    
    Phygital._bActive = true;
};

/**
Disable geolocation tracking
*/
Phygital.disableGeoTracking = ()=>{
    if (!Phygital._bActive) return;
    
    navigator.geolocation.clearWatch(Phygital._wpid);
    Phygital._bActive = false;
};

/**
Set max error allowed for location tracking
@param {number} r - the error (meters)
*/
Phygital.setMaxGeoError = (r)=>{
    if (r > 0.0) Phygital._maxGeoError = r;
};

Phygital._onGeoError = ()=>{
    console.log("Geolocation error");
};

Phygital._onGeoPosition = (pos)=>{
    if (!Phygital._bActive) return;
    if (!pos.coords) return;

    // filter locations
    let acc = pos.coords.accuracy;
    if (acc && acc > Phygital._maxGeoError) return;

    // update current location
    Phygital._currGeoPos.x = pos.coords.latitude;
    Phygital._currGeoPos.y = pos.coords.longitude;

    //console.log(pos.coords.latitude+","+pos.coords.longitude);
    //console.log(pos);

    ATON.fire("GeoLocation", pos);

    Phygital._handleGeoPOIs();
};

Phygital._handleGeoPOIs = ()=>{
    let numPOIs = Phygital._GeoPOIs.length;
    if (numPOIs <= 0) return;

    Phygital._closestGeoPOIdist = undefined;
    Phygital._closestGeoPOI = undefined;

    for (let i=0; i<numPOIs; i++){
        let POI = Phygital._GeoPOIs[i];

        let d = Phygital.geodistance(Phygital._currGeoPos, POI.pos);

        if (Phygital._closestGeoPOIdist === undefined || d < Phygital._closestGeoPOIdist){
            Phygital._closestGeoPOIdist = d;
            Phygital._closestGeoPOI     = i;
        }

        //console.log("Distance: "+d);

        // Inside this POI radius
        if (d <= POI.radius){
            if (Phygital._currGeoPOI !== i){
                ATON.fire("EnterGeoPOI", { id: i, distance: d });
                //console.log("Entered POI "+i);
            }
            Phygital._currGeoPOI = i;
        }
        // Ouside
        else {
            if (Phygital._currGeoPOI !== undefined) ATON.fire("LeaveGeoPOI", { id: Phygital._currGeoPOI, distance: d });
            Phygital._currGeoPOI = undefined;
        }
    }
};

/**
Get current location
@returns {THREE.Vector2} - latitude and longitude
*/
Phygital.getCurrentGeoLocation = ()=>{
    if (!Phygital._bActive) return undefined;

    return Phygital._currGeoPos;
};

Phygital.geolocationFromLatLon = (lat, lon)=>{
    return new THREE.Vector2( lat, lon );
};

// Distance between two locations (in meters)
Phygital.geodistance_orig = (latlonA, latlonB)=>{
    let dLat = ATON.DEG2RAD * (latlonB.x - latlonA.x);  // deg2rad
    let dLon = ATON.DEG2RAD * (latlonB.y - latlonA.y); 
    let a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(ATON.DEG2RAD * latlonA.x) * Math.cos(ATON.DEG2RAD * latlonB.x) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let d = Phygital.EARTH_R_KM * c; // Distance in km
    
    return d * 1000.0;
};

/**
Get distance (meters) between two geo-locations
re-adapted from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
@param {THREE.Vector2} latlonA - location A (lat,lon)
@param {THREE.Vector2} latlonB - location B (lat,lon)
@returns {number} - distance (meters)
*/
Phygital.geodistance = (latlonA, latlonB)=>{
    let a = 0.5 - Math.cos((latlonB.x - latlonA.x) * ATON.DEG2RAD)/2.0 + 
        Math.cos(latlonA.x * ATON.DEG2RAD) * Math.cos(latlonB.x * ATON.DEG2RAD) * 
        (1.0 - Math.cos((latlonB.y - latlonA.y) * ATON.DEG2RAD))/2.0;

    let d = Phygital.EARTH_D_KM * Math.asin(Math.sqrt(a));

    return d * 1000.0;
};

/**
Add a Geo-POI (point-of-interest) in given physical location (lat,lon) and radius.
You can handle enter/leave POI events using ATON.on("EnterGeoPOI") and ATON.on("LeaveGeoPOI")
@param {THREE.Vector2} P - the (lat,lon) pair
@param {number} r - the radius (meters)
*/
Phygital.addGeoPOI = (P, r)=>{
    let POI = {};
    POI.pos = new THREE.Vector2(P.x,P.y);
    POI.radius = r;

    Phygital._GeoPOIs.push(POI);

    if (!Phygital._bActive) Phygital.enableTracking();

    //console.log("Added POI:");
    //console.log(POI);

    Phygital._handleGeoPOIs();

    return (Phygital._GeoPOIs.length - 1);
};

Phygital.getGeoPOIbyIndex = (i)=>{
    return Phygital._GeoPOIs[i];
};

/**
Get index of closest Geo-POI
@returns {number} - index
*/
Phygital.getClosestGeoPOI = ()=>{
    return Phygital._closestGeoPOI;
};

/**
Get distance (meters) to the closest Geo-POI
@returns {number} - distance (meters)
*/
Phygital.getClosestGeoPOIdistance = ()=>{
    return Phygital._closestGeoPOIdist;
};


// Main update routine
/*
Phygital.update = ()=>{
    if (!Phygital._bActive) return;

    //navigator.geolocation.watchPosition(Phygital._onGeoPosition);

    //let P = Phygital.locationFromLatLon(42.06047573760282, 12.588698649224982);
    //console.log( Phygital.distance(Phygital._currGeoPos, P) );
};
*/

export default Phygital;