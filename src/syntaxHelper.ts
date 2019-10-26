import {InsightError} from "./controller/IInsightFacade";

export default class Syntax {
    public static columnChecker(query: any, groupkey: string[], mkey: string[], skey: string[], applykey: string[]) {
        switch (Object.keys(query).length) {
            case 2:
                for (let key of query.OPTIONS.COLUMNS) {
                    if (!mkey.includes(key) && !skey.includes(key)) {
                        throw new InsightError();
                    }
                }
                break;
            case 3:
                for (let key of query.OPTIONS.COLUMNS) {
                    if (!applykey.includes(key) && !groupkey.includes(key)) {
                        throw new InsightError();
                    }
                }
                break;
        }
    }

    public static orderChecker(query: any, optionsArray: string[], columnsArray: string[], where: string[]): boolean {
        if (optionsArray.length !== 1 && optionsArray.length !== 2) {
            throw new InsightError();
        }
        if (optionsArray.length === 2 && !optionsArray.includes("ORDER")) {
            throw new InsightError();
        }
        if (where.length > 1) {
            throw new InsightError();
        }
        let x = query.OPTIONS.ORDER;
        switch (typeof x) {
            case "object":
                let y = Object.keys(x);
                if (!y.includes("dir") || !y.includes("keys") || y.length !== 2 || !x.keys.length) {
                    throw new InsightError();
                }
                if (x["dir"] !== "UP" && x["dir"] !== "DOWN") {
                    throw new InsightError();
                }
                let z = x["keys"];
                for (let key of z) {
                    if (!columnsArray.includes(key)) {
                        throw new InsightError();
                    }
                }
                return true;
            case "string":
                if (!columnsArray.includes(x)) {
                    throw new InsightError();
                }
                return false;
            default:
                throw new InsightError();
        }
    }

    public static syntaxChecker(query: any) {
        let objArray = Object.keys(query);
        if (objArray.length !== 2 && objArray.length !== 3) {
            throw new InsightError();
        }
        if (!objArray.includes("WHERE") || !objArray.includes("OPTIONS")) {
            throw new InsightError();
        }
        if (objArray.length === 3 && !objArray.includes("TRANSFORMATIONS")) {
            throw new InsightError();
        }
        if (objArray.length === 3) {
            let x = Object.keys(query.TRANSFORMATIONS);
            if (x.length !== 2 || !x.includes("GROUP") || !x.includes("APPLY")) {
                throw new InsightError();
            }
        }
        let optionsArray: string[] = Object.keys(query.OPTIONS);
        if (optionsArray.length !== 1 && optionsArray.length !== 2) {
            throw new InsightError();
        }
        if (!optionsArray.includes("COLUMNS")) {
            throw new InsightError();
        }
        if (optionsArray.length === 2 && !optionsArray.includes("ORDER")) {
            throw new InsightError();
        }
    }
}
