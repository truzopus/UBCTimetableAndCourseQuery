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

    public static findNestedBuildingInfo(obj: any, roomSection: any[]): any[] {
        let div = this.findHelper(obj["childNodes"], "div");
        let divList: any[] = [];
        for (let i = 0, len = div.length; i < len; i++) {
            divList.push(div[i]["childNodes"]);
        }
        let divSubList: any[] = [];
        for (let j = 0, lens = divList.length; j < lens; j++) {
            let temp = this.findHelper(divList[j], "div");
            if (temp.length > 0) {
                for (let k = 0, l = temp.length; k < l; k++) {
                    divSubList.push(temp[k]);
                }
            }
        }
        let final: any[] = [];
        for (let i = 0, len = divSubList.length; i < len; i++) {
            let attrN = divSubList[i]["attrs"];
            for (let j = 0, lens = attrN.length; j < lens; j++) {
                let myKey = attrN[j]["name"];
                let myValue = attrN[j]["value"];
                if (myKey === "id" && myValue === "main") {
                    final.push(divSubList[i]);
                }
            }
        }
        let sect: any = this.findNested(final[0], "nodeName", "section");
        let sectDivCN: any[] = [];
        for (let i = 0, len = Object.keys(sect["childNodes"]).length; i < len; i++) {
            if (sect["childNodes"][i]["nodeName"] === "div") {
                let child = sect["childNodes"][i]["childNodes"];
                for (let j = 0, lens = child.length; j < lens; j++) {
                    if (child[j]["nodeName"] === "div") {
                        sectDivCN.push(child[j]);
                        let n = 0;
                    }
                }
            }
        }
        let body: any[] = [];
        for (let i = 0, len = sectDivCN.length; i < len; i++) {
            let attrsCN = sectDivCN[i]["attrs"];
            if ( attrsCN[0]["name"] === "class" && attrsCN[0]["value"] === "view-content") {
                body.push(sectDivCN[i]);
            } else if (attrsCN[0]["name"] === "class" && attrsCN[0]["value"] === "view-footer") {
                body.push(sectDivCN[i]);
            }
        }
        return body;
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

    public static parseRoom(roominfo: any[], roomSection: any) {
        let body: any[] = roominfo[0]["childNodes"];
        let table: object = roominfo[1];
        let fieldContent: any[] = [];
        for (let i = 0, len = body.length; i < len; i++) {
            if (body[i]["nodeName"] === "div") {
             fieldContent = body[i]["childNodes"];
            }
        }
        let fCN: any[] = [];
        this.parseHelper(fieldContent, fCN, "div");
        let fCN2: any[] = [];
        this.checkAttr(fCN, "id", "building-info", fCN2);
        for (let i = 0, len = fCN[0]["childNodes"].length; i < len; i++) {
            if (fCN[0]["childNodes"][i]["nodeName"] === "h2") {
                let span = fCN[0]["childNodes"][i]["childNodes"];
                roomSection["rooms_fullname"] = span[0]["childNodes"][0]["value"];
                roomSection["rooms_shortname"] = roomSection["rooms_fullname"].replace(
                    /[^A-Z]/g, "");
                let n = 0;
            }
        }
    }

    public static parseHelper(obj: any[], array: any[], key: string) {
        for (let j = 0, lens = obj.length; j < lens; j++) {
            let objCN = obj[j]["childNodes"];
            if (obj[j]["nodeName"] === key && objCN !== undefined) {
                let objSub = obj[j]["childNodes"];
                for (let i = 0, len = objSub.length; i < len; i++) {
                    if (objSub[i]["nodeName"] === key) {
                        array.push(objSub[i]);
                    }
                }
            }
        }
    }

    public static checkAttr(obj: any[], name: string, value: string, array: any[]) {
        for (let i = 0, len = obj.length; i < len; i++) {
            let attr = obj[i]["attrs"][0];
            if (attr["name"] === name && attr["value"] === value) {
                array.push(obj[i]);
            }
        }
    }
}
