/* tslint:disable:no-console */

import {InsightDatasetKind} from "./controller/IInsightFacade";

/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 */
export default class Log {
    public static trace(msg: string): void {
        console.log(`<T> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static info(msg: string): void {
        console.info(`<I> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static warn(msg: string): void {
        console.warn(`<W> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static error(msg: string): void {
        console.error(`<E> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static test(msg: string): void {
        console.log(`<X> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static sectionCheck(courseSec: any): boolean {
        return ("Subject" in courseSec) && ("Course" in courseSec) && ("Avg" in courseSec) && ("Professor" in courseSec)
            && ("Title" in courseSec) && ("Pass" in courseSec) && ("Fail" in courseSec) && ("Audit" in courseSec)
            && ("id" in courseSec) && ("Year" in courseSec);
    }

    public static datasetKeyConvert(courseSection: any, courseSec: any): void {
        courseSection["courses_dept"] = String(courseSec["Subject"]);
        courseSection["courses_id"] = String(courseSec["Course"]);
        courseSection["courses_avg"] = Number(courseSec["Avg"]);
        courseSection["courses_instructor"] = String(courseSec["Professor"]);
        courseSection["courses_title"] = String(courseSec["Title"]);
        courseSection["courses_pass"] = Number(courseSec["Pass"]);
        courseSection["courses_fail"] = Number(courseSec["Fail"]);
        courseSection["courses_audit"] = Number(courseSec["Audit"]);
        courseSection["courses_uuid"] = String(courseSec["id"]);
        if (courseSec["Section"] === "overall") {
            courseSection["courses_year"] = 1900;
        } else {
            courseSection["courses_year"] = Number(courseSec["Year"]);
        }
    }

    public static invalidInputCheck(id: string, content: string, kind: InsightDatasetKind): boolean {
        if (/^\s+$/.test(id) || id === null || id === undefined ||
            kind === null || kind === undefined ||
            /^\s+$/.test(content) || content === null || content === undefined) {
            return true;
        } else if (id.includes(("_")) || (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms)) {
            return true;
        } else {
            return false;
        }
    }

    public static invalidInputCheckRemove(id: string): boolean {
        if (/^\s+$/.test(id) || id === null || id === undefined) {
            return true;
        } else if (id.includes(("_"))) {
            return true;
        } else {
            return false;
        }
    }

    public static findNested(obj: any, key: any, value: any): object[] {
        // Base case
        if (obj[key] === value) {
            return obj;
        } else {
            for (let i = 0, len = Object.keys(obj).length; i < len; i++) {
                let myKey = Object.keys(obj)[i];
                let objectValue = obj[myKey];
                if (myKey !== "parentNode" && typeof objectValue === "object") {
                    let found: any = this.findNested(obj[myKey], key, value);
                    if (found) {
                        return found;
                    }
                }
            }
        }
    }

    public static findNestedBuildingInfo(obj: any, key: any, value: any, attrs: any): object[] {
        // Base case
        if (obj[key] === value && obj[key]["attrs"][0]["value"] === attrs) {
            let test = obj[key]["attrs"][0]["value"];
            return obj;
        } else {
            for (let i = 0, len = Object.keys(obj).length; i < len; i++) {
                let myKey = Object.keys(obj)[i];
                let objectValue = obj[myKey];
                let temp = objectValue["attrs"];
                if (myKey !== "parentNode" && typeof objectValue === "object" && temp !== undefined) {
                    // let tests = obj[myKey]["attrs"][0]["value"];
                    let found: any = this.findNestedBuildingInfo(obj[myKey], key, value, attrs);
                    if (found) {
                        return found;
                    }
                }
            }
        }
    }

    public static findHelper(obj: any, key: string): any[] {
        let output: any[] = [];
        for (let i = 0, len = Object.keys(obj).length; i < len; i++) {
            let myKey = Object.keys(obj)[i];
            if (obj[i]["nodeName"] === key) {
                output.push(obj[myKey]);
            }
        }
        return output;
    }

    public static findNestedAtr(obj: any): any[] {
        let output = this.findHelper(obj, "tr");
        let final: any[] = [];
        for (let i = 0, len = output.length; i < len; i++) {
            let cn1 = output[i]["childNodes"];
            let cn1H = this.findHelper(cn1, "td");
            for (let is = 0, lens = Object.keys(cn1H).length; is < lens; is++) {
                let temp = cn1H[is]["childNodes"];
                if (Object.keys(temp).length > 1) {
                    let a: any = this.findHelper(temp, "a");
                    if (Object.keys(a).length > 0) {
                        let hrefTemp: any = Object.values(a)[0];
                        let href = hrefTemp["attrs"][0]["value"];
                        final.push(href);
                    }
                }
            }
        }
        return final;
    }
}
