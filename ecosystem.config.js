module.exports = {
    apps: [
    {
        name: "content-service",
        script: "services/ATON.SERVICE.vroadcast.js",
        instances: "max",
        exec_mode: "cluster",
        args: "--www ."
    },
    {
        name: "collab-service"
        script: "./services/ATON.SERVICE.vroadcast.js",
        instances: "1",
    }]
}