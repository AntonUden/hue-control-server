import HueServer from "./HueServer";

require('console-stamp')(console, '[HH:MM:ss.l]');

const port: number = parseInt(process.env.PORT) || 8080;

new HueServer(port);