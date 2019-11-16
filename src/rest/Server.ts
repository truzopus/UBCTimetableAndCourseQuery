/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        let insightFacade = new InsightFacade();
        // eslint-disable-next-line @typescript-eslint/tslint/config
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");
                that.rest = restify.createServer({name: "insightUBC", });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });
                that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind",
                    (req: restify.Request, res: restify.Response, next: restify.Next) => {
                        let kind = Server.checkKind(req.params.kind);
                        return insightFacade.addDataset(req.params.id, req.body, kind).then((result: any) => {
                            res.json(200, {result: result});
                        }).catch((error: any) => {
                            res.json(400, {error: error.message});
                        });
                    });
                that.rest.del("/dataset/:id", (req: restify.Request, res: restify.Response, next: restify.Next) => {
                    return insightFacade.removeDataset(req.params.id).then((result: any) => {
                        res.json(200, {result: result});
                    }).catch((error: any) => {
                        res.json(Server.deleteHelper(error), {error: error.message});
                    });
                });
                that.rest.post("/query", (req: restify.Request, res: restify.Response, next: restify.Next) => {
                    return insightFacade.performQuery(req.body).then((result: any) => {
                        res.json(200, {result: result});
                    }).catch((error: any) => {
                        res.json(400, {error: error.message});
                    });
                });
                that.rest.get("/datasets", (req: restify.Request, res: restify.Response, next: restify.Next) => {
                    return insightFacade.listDatasets().then((result: any) => {
                        res.json(200, {result: result});
                    });
                });
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err: string) {
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    private static checkKind(reqKind: string): InsightDatasetKind {
        if (reqKind === "courses") {
            return InsightDatasetKind.Courses;
        } else if (reqKind === "rooms") {
            return InsightDatasetKind.Rooms;
        }
    }

    private static deleteHelper(error: any): number {
        if (error instanceof InsightError) {
           return 400;
        } else if (error instanceof NotFoundError) {
            return 404;
        }
    }
}
