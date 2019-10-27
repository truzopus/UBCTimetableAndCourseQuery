import {InsightError} from "./controller/IInsightFacade";

export default class KeyAndSort {

    public static appkey(query: any): string[] {
        let applykey: any = [];
        for (let key of query.TRANSFORMATIONS["APPLY"]) {
            let key1 = Object.keys(key)[0];
            if (applykey.includes(key1) || key1.includes("_")) {
                throw new InsightError();
            } else {
                applykey.push(key1);
            }
        }
        return applykey;
    }

    public static retrieverFunction(query: any): string {
        let retriever: string;
        switch (Object.keys(query).length) {
            case 2:
                retriever = (query.OPTIONS.COLUMNS)[0];
                break;
            case 3:
                retriever = (query.TRANSFORMATIONS.GROUP)[0];
                break;
        }
        if (typeof retriever !== "string") {
            throw new InsightError();
        } else {
            return retriever.split("_")[0];
        }
    }

    public static mkeyFunc(id: string): string[] {
        return [(id + "_avg"), (id + "_pass"), (id + "_fail"), (id + "_audit"), (id + "_year"), (id + "_lat"),
            (id + "_lon"), (id + "_seats")];
    }

    public static skeyFunc(id: string): string[] {
        return [(id + "_dept"), (id + "_id"), (id + "_instructor"), (id + "_title"), (id + "_uuid"), (
            id + "_fullname"), (id + "_shortname"), (id + "_number"), (id + "_name"), (id + "_address"),
            (id + "_type"), (id + "_furniture"), (id + "_href")];
    }

    public static deleteKeys(result: any, mkey: string[], skey: string[],
                             groupkey: string[], applykey: string[], query: any) {
        for (let key of mkey.concat(skey).concat(groupkey).concat(applykey)) {
            if (!query.OPTIONS.COLUMNS.includes(key)) {
                result.forEach(function (v: any) {
                    delete v[key];
                });
            }
        }
    }

    public static sortFunction(result: any[], query: any, orderBoolean: boolean): any[] {
        if (Object.keys(query.OPTIONS).length === 2) {
            if (!orderBoolean) {
                let order = query.OPTIONS.ORDER;
                result = this.sort(result, order);
            } else {
                let order = query.OPTIONS.ORDER["keys"];
                let dir = query.OPTIONS.ORDER["dir"];
                result = this.sort2(result, dir, order);
            }
        }
        return result;
    }

    public static sort(result: any[], order: string) {
        return result.sort(function (a, b) {
            let x = a[order];
            let y = b[order];
            return y < x ?  1  : y > x ? -1 : 0;
        });
    }

    public static sort2(result: any[], dir: string, order: string[]): any[] {
        if (dir === "UP") {
            return result.sort(function (a, b) {
                for (let key of order) {
                    let x = a[key];
                    let y = b[key];
                    if (y < x) {
                        return 1;
                    } else if (y > x) {
                        return -1;
                    }
                }
                return 0;
            });
        } else if (dir === "DOWN") {
            return result.sort(function (a, b) {
                for (let key of order) {
                    let x = a[key];
                    let y = b[key];
                    if (y > x) {
                        return 1;
                    } else if (y < x) {
                        return -1;
                    }
                }
                return 0;
            });
        }
    }
}
