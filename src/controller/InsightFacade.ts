import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import * as JSZip from "jszip";
class MemoDataset {
    public datasetInMemo: { [key: string]: any };
    public datasetMemoList: InsightDataset[];
    public datasetMList: string[];
    constructor(datasetMList: string[], datasetMemoList: InsightDataset[], datasetInMemo: { [key: string]: any }) {
        this.datasetMList = datasetMList;
        this.datasetMemoList = datasetMemoList;
        this.datasetInMemo = datasetInMemo; }}
export default class InsightFacade implements IInsightFacade {
    private dobject: { [key: string]: any } = {};
    private dsList: InsightDataset[] = [];
    private dList: string[] = [];
    private memoDataset = new MemoDataset(this.dList, this.dsList, this.dobject);

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    private sectionCheck(courseSec: any): boolean {
        return ("Subject" in courseSec) && ("Course" in courseSec) && ("Avg" in courseSec) && ("Professor" in courseSec)
            && ("Title" in courseSec) && ("Pass" in courseSec) && ("Fail" in courseSec) && ("Audit" in courseSec)
            && ("id" in courseSec) && ("Year" in courseSec); }

    private datasetKeyConvert(courseSection: any, courseSec: any): void {
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
            courseSection["courses_year"] = Number(courseSec["Year"]); }
    }

    private updateMemory(id: string, dataFile: any, memoDataset: MemoDataset): void {
        let dataset: InsightDataset = {
            id: id, kind: InsightDatasetKind.Courses,
            numRows: dataFile.length
        };
        memoDataset.datasetMemoList.push(dataset);
        memoDataset.datasetInMemo[id] = dataFile;
        memoDataset.datasetMList.push(id);
        let diskDir = "./data";
        let fs = require("fs");
        fs.writeFile(diskDir + "/" + id + ".json", JSON.stringify(dataFile), (err: any) => {
            if (err) {
                throw err;
            }
        });
    }

    private invalidInputCheck(id: string, content: string, kind: InsightDatasetKind): boolean {
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

    private invalidInputCheckRemove(id: string): boolean {
        if (/^\s+$/.test(id) || id === null || id === undefined ) {
            return true;
        } else if (id.includes(("_"))) {
            return true;
        } else {
            return false; }}
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.invalidInputCheck(id, content, kind)) {
            return Promise.reject(new InsightError("invalid input parameter"));
        } else if (this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new InsightError("dataset already added"));
        } else {
            let that = this;
            let con = Buffer.from(content, "base64");
            let zip = new JSZip();
            return zip.loadAsync(con, {base64: true}).then(function (body: any) {
                let p: any[] = [];
                let coursesFolder = body.folder(/courses/);
                if (coursesFolder.length === 1) {
                    body.folder("courses").forEach(function (relativePath: any, file: { dir: any; name: string; }) {
                        if (!file.dir) {
                            let jsonFile = body.file(file.name).async("text").then((output: any) => {
                                return Promise.resolve(JSON.parse(output));
                            }).catch(function (error: any) {
                                return Promise.reject(new InsightError("Not JSON file, fail to parse")); });
                            p.push(jsonFile); }});
                    return Promise.all(p).then((result: any) => {
                        let dataFile: any[] = [];
                        for (let course of result) {
                            if (course === undefined || !("result" in course) || course === null) {
                                continue; }
                            for (let courseSec of course["result"]) {
                                if (that.sectionCheck(courseSec)) {
                                    let courseSection: any = {};
                                    that.datasetKeyConvert(courseSection, courseSec);
                                    dataFile.push(courseSection); }}}
                        if (dataFile.length > 0) {
                            that.updateMemory(id, dataFile, that.memoDataset);
                            return Promise.resolve(that.memoDataset.datasetMList);
                        } else {
                            return Promise.reject(new InsightError("invalid (no valid course section) dataset")); }
                    }).catch((error: any) => {
                        return Promise.reject(new InsightError("promise.all failed")); });
                } else {
                    return Promise.reject(new InsightError("invalid dataset subdirectory")); }
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset")); }); }}

    public removeDataset(id: string): Promise<string> {
        if (this.invalidInputCheckRemove(id)) {
            return Promise.reject(new InsightError("invalid input parameter"));
        } else if (!this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new NotFoundError("dataset not yet added"));
        } else {
            let indexMList = this.memoDataset.datasetMList.indexOf(id);
            let indexMemoList = this.memoDataset.datasetMemoList.map(function (item) { return item.id; }).indexOf(id);
            if (indexMList > -1 && indexMemoList > -1) {
                this.memoDataset.datasetMList.splice(indexMList, 1);
                this.memoDataset.datasetMemoList.splice(indexMemoList, 1);
                delete this.memoDataset.datasetInMemo[id]; }
            return Promise.resolve(id); }}

    public performQuery(query: any): Promise<any[]> {
        let that = this;
        return new Promise ((resolve, reject) => {
            try {
                that.syntaxChecker(query);
            } catch (error) {
                return reject(new InsightError()); }
            let optionsArray = Object.keys(query.OPTIONS);
            let columnsArray = query.OPTIONS.COLUMNS;
            if (!columnsArray.length) {
                return reject(new InsightError()); }
            let idRetriever = columnsArray[0];
            let id = idRetriever.split("_")[0];
            let mkey = [(id + "_avg"), (id + "_pass"), (id + "_fail"), (id + "_audit"), (id + "_year")];
            let skey = [(id + "_dept"), (id + "_id"), (id + "_instructor"), (id + "_title"), (id + "_uuid")];
            for (let key of columnsArray) {
                if (!skey.includes(key) && !mkey.includes(key)) {
                    return reject(new InsightError()); }}
            let orderBoolean: boolean;
            try {
                orderBoolean = that.orderChecker(query, true, optionsArray, skey, mkey, columnsArray);
            } catch (error) {
                return reject(new InsightError()); }
            let result: any = [];
            try {
                result = that.databaseToResult(id);
            } catch (error) {
                return reject(new InsightError()); }
            let whereArray = Object.keys(query.WHERE);
            if (whereArray.length > 1) {
                return reject(new InsightError()); }
            try {
                for (let key of whereArray) {
                    result = that.filter(query.WHERE, key, mkey, skey, result);
                }
            } catch (error) {
                return reject(new InsightError()); }
            if (result.length > 5000) {
                return reject(new ResultTooLargeError()); }
            for (let key of mkey.concat(skey)) {
                if (!columnsArray.includes(key)) {
                    result.forEach(function (v: any) {
                        delete v[key]; }); }}
            if (orderBoolean) {
                let order = query.OPTIONS.ORDER;
                result = that.sort(result, order); }
            return resolve(result); }); }
    public filter (query: any, key: string, mkey: string[], skey: string[], result: any[]): any[] {
        if (!this.comparatorErrorCheck(key)) {
            throw new InsightError(); }
        let subArray = Object.keys(query[key]);
        let andArray = query[key];
        if (!subArray.length) {
            throw new InsightError(); }
        if (key === "AND") {
            for (let subKey of andArray) {
                let temp = Object.keys(subKey);
                for (let subSubKey of temp) {
                    result = this.filter(subKey, subSubKey, mkey, skey, result); }}
            return result;
        } else if (key === "OR") {
            let r1: any = []; let r2: any = [];
            for (let subKey of andArray) {
                let temp = Object.keys(subKey);
                for (let subSubKey of temp) {
                    r2 = this.filter(subKey, subSubKey, mkey, skey, result); }
                for (let keyKey of r2) {
                    if (!r1.includes(keyKey)) {
                        r1.push(keyKey); }}}
            result = r1;
            return result;
        } else if (key === "NOT") {
            let temp: any = [];
            temp = result;
            for (let subKey of subArray) {
                temp = this.filter(query.NOT, subKey, mkey, skey, result); }
            result = result.filter(function (item) {
                return !temp.includes(item); });
            return result;
        } else if (key === "GT" || key === "LT" || key === "EQ") {
            if (subArray.length > 1) {
                throw new InsightError(); }
            for (let subKey of subArray) {
                let value = query[key][subKey];
                if (!mkey.includes(subKey) || isNaN(value)) {
                    throw new InsightError(); }
                result = this.filterFunction(result, subKey, value, key); }
            return result;
        } else if (key === "IS") {
            if (subArray.length > 1) {
                throw new InsightError(); }
            for (let subKey of subArray) {
                let value = query[key][subKey];
                if (!skey.includes(subKey) || typeof value !== "string") {
                    throw new InsightError(); }
                result = this.filterFunction(result, subKey, value, key); }}
        return result; }
    public databaseToResult(id: string): any[] {
        if (this.memoDataset.datasetInMemo[id] !== null || this.memoDataset.datasetInMemo[id] !== undefined) {
            return JSON.parse(JSON.stringify(this.memoDataset.datasetInMemo[id]));
        }
    }
    public orderChecker(query: any, orderBoolean: boolean, optionsArray: string[],
                        skey: string[], mkey: string [], columnsArray: string[]): boolean {
        if (optionsArray.length === 1) {
            return false; }
        if (orderBoolean) {
            let order = query.OPTIONS.ORDER;
            if (!skey.includes(order) && !mkey.includes(order)) {
                throw new InsightError(); }
            if (!columnsArray.includes(order)) {
                throw new InsightError(); }}
        return true; }
    public syntaxChecker (query: any) {
        let objArray = Object.keys(query);
        if (objArray.length !== 2 || !objArray.includes("WHERE") || !objArray.includes("OPTIONS")) {
            throw new InsightError(); }
        let optionsArray: string[] = Object.keys(query.OPTIONS);
        if (optionsArray.length !== 1 && optionsArray.length !== 2) {
            throw new InsightError(); }
        if (!optionsArray.includes("COLUMNS")) {
            throw new InsightError(); }
        if (optionsArray.length === 2 && !optionsArray.includes("ORDER")) {
            throw new InsightError(); }}
    public sort (result: any[], order: string) {
        return result.sort(function (a, b) {
            let x = a[order];
            let y = b[order];
            return y < x ?  1
                : y > x ? -1 : 0; }); }
    public filterFunction (result: any[], subKey: string, value: any, comparator: string): any[] {
        if (comparator === "GT") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp > value; });
        } else if (comparator === "LT") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp < value; });
        } else if (comparator === "EQ") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp === value; });
        } else if (comparator === "IS") {
            let input: RegExp = /^([*]?[a-z || , || " " || 0-9]*[*]?)$/;
            if (input.test(value)) {
                return result.filter(function (el) {
                    let temp = el[subKey];
                    return new RegExp("^" + value.replace(/\*/g, ".*") + "$").test(temp);
                }); } else {
                throw new InsightError(); }}}
    public comparatorErrorCheck (key: string): boolean {
        let filters = ["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"];
        return filters.includes(key); }
    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList); }
}
