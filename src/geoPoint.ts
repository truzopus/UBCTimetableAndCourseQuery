import * as http from "http";

export default class GeoPoint {

    public static requestGeoPoint(website: string): Promise<any> {
        let webReplaced: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team035/" +
            website.replace(/ /g, "%20");
        return new Promise((resolve, reject) => {
            http.get(webReplaced, (result) => {
                let { statusCode } = result;
                let contentType = result.headers["content-type"];
                let error: boolean;
                if (statusCode !== 200) {
                    error = true;
                } else if (!/^application\/json/.test(contentType)) {
                    error = true;
                }
                if (error) {
                    result.resume();
                    return resolve("filterOut");
                }
                result.setEncoding("utf8");
                let rawData = " ";
                result.on("data", (chunk) => {
                    rawData += chunk;
                });
                result.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        let array: any = [];
                        array.push(parsedData["lat"]);
                        array.push(parsedData["lon"]);
                        return resolve(parsedData);
                    } catch (e) {
                        return resolve("filterOut");
                    }
                });
            }).on("error", (e) => {
                return resolve("filterOut");
            });
        });
    }
}
