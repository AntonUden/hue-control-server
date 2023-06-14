import express, { Express, Request, Response } from 'express';
import * as HTTP from 'http';
import * as SocketIO from 'socket.io';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

export default class HueServer {
	private io: SocketIO.Server;
	private express: Express;
	private http: HTTP.Server;
	private limiter;

	constructor(port: number) {
		this.express = express();
		this.express.set("port", port);
		this.http = new HTTP.Server(this.express);
		this.io = new SocketIO.Server(this.http);
		this.express.use(bodyParser.json());
		this.express.use(morgan('combined'));

		this.limiter = rateLimit({
			windowMs: 5 * 1000,
			max: 1,
			message: "You can only make 1 request per 5 seconds. Please wait a moment and try again."
		});

		this.io.on("connection", (socket: SocketIO.Socket) => {
			console.log("Yoooo someone connected to our socket server");
		});

		this.http.listen(port, (): void => {
			console.log("Listening on port " + port);
		});

		this.express.use("/", express.static(__dirname + "/../client"));

		this.express.post("/api/set_color", this.limiter, async (req: any, res: any) => {
			try {
				const body = req.body;
				if (body && typeof body === "object" && body !== null) {
					const { r, g, b } = body;
					if (
						r !== undefined && r >= 0 && r <= 255 &&
						g !== undefined && g >= 0 && g <= 255 &&
						b !== undefined && b >= 0 && b <= 255
					) {
						console.log("Someone requested R: " + r + " G: " + g + " B: " + b);
						res.status(200).send("Color set successfully.");
						this.io.emit("color", {
							r: r,
							g: g,
							b: b
						});
					} else {
						console.log("Out of range");
						throw new Error();
					}
				} else {
					console.log("Bad json");
					throw new Error();
				}
			} catch (error) {
				res.status(400).send("Jesse what the fuck (bad request)");
			}
		});
	}
}