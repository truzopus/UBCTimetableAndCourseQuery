import * as http from "http";

export default class GeoPoint {

    public static requestGeoPoint(webReplaced: string): Promise<any> {
        return new Promise((resolve, reject) => {
            return http.get(webReplaced, (result) => {
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
                        let geoPoint = [];
                        geoPoint.push(parsedData["lat"]);
                        geoPoint.push(parsedData["lon"]);
                        return resolve(geoPoint);
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
