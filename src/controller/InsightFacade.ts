import Log from "../Util";
import PerformQueryHelper from "../performQueryHelper";
import {IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Syntax from "../syntaxHelper";
import QueryLineHelper from "../queryLineHelper";

class MemoDataset {
    public datasetInMemo: { [key: string]: any };
    public datasetMemoList: InsightDataset[];
    public datasetMList: string[];
    constructor(datasetMList: string[], datasetMemoList: InsightDataset[], datasetInMemo: { [key: string]: any }) {
        this.datasetMList = datasetMList;
        this.datasetMemoList = datasetMemoList;
        this.datasetInMemo = datasetInMemo;
    }
}

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
            && ("id" in courseSec) && ("Year" in courseSec);
    }

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
            courseSection["courses_year"] = Number(courseSec["Year"]);
        }
    }

    private updateMemory(id: string, dataFile: any, memoDataset: MemoDataset): void {
        let dataset: InsightDataset = {
            id: id, kind: InsightDatasetKind.Courses,
            numRows: dataFile.length };
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
            return false;
        }
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.invalidInputCheck(id, content, kind) || this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new InsightError());
        } else {
            let that = this;
            let con = Buffer.from(content, "base64");
            let zip = new JSZip();
            return zip.loadAsync(con, {base64: true}).then(function (body: any) {
                let p: any[] = [];
                let coursesFolder = body.folder(/courses/);
                if (coursesFolder.length === 1) {
                    body.folder("courses").forEach(function (relativePath: any, file: any) {
                        if (!file.dir) {
                            p.push(file.async("text"));
                        }
                    });
                }
                return Promise.all(p).then((result: any) => {
                    let dataFile: any[] = [];
                    for (let ele of result) {
                        try {
                            let course = JSON.parse(ele);
                            if (course === undefined || !("result" in course) || course === null) {
                                continue;
                            }
                            for (let courseSec of course["result"]) {
                                if (that.sectionCheck(courseSec)) {
                                    let courseSection: any = {};
                                    that.datasetKeyConvert(courseSection, courseSec);
                                    dataFile.push(courseSection);
                                }
                            }
                        } catch (error) { // ignore
                        }
                    }
                    if (dataFile.length > 0) {
                        that.updateMemory(id, dataFile, that.memoDataset);
                        return Promise.resolve(that.memoDataset.datasetMList);
                    } else {
                        return Promise.reject(new InsightError("invalid (no valid course section) dataset"));
                    }
                }).catch((error: any) => {
                    return Promise.reject(new InsightError("promise.all failed"));
                });
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset"));
            });
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (this.invalidInputCheckRemove(id)) {
            return Promise.reject(new InsightError("invalid input parameter"));
        } else if (!this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new NotFoundError("dataset not yet added"));
        } else {
            let indexMList = this.memoDataset.datasetMList.indexOf(id);
            let indexMemoList = this.memoDataset.datasetMemoList.map(function (item) {
                return item.id;
            }).indexOf(id);
            if (indexMList > -1 && indexMemoList > -1) {
                this.memoDataset.datasetMList.splice(indexMList, 1);
                this.memoDataset.datasetMemoList.splice(indexMemoList, 1);
                delete this.memoDataset.datasetInMemo[id];
            }
            return Promise.resolve(id);
        }
    }

    public performQuery(query: any): Promise<any[]> {
        let that = PerformQueryHelper;
        let syntax = Syntax;
        let that2 = this;
        let helper = QueryLineHelper;
        return new Promise ((resolve, reject) => {
            let id: string;
            try {
                syntax.syntaxChecker(query);
                id = helper.retrieverFunction(query);
            } catch (error) {
                return reject (new InsightError());
            }
            let mkey = helper.mkeyFunc(id);
            let skey = helper.skeyFunc(id);
            let applykey: string[] = [];
            let groupkey: string[] = [];
            let orderBoolean: boolean;
            let result: any = [];
            let where = Object.keys(query.WHERE);
            try {
                orderBoolean = syntax.orderChecker(query, Object.keys(query.OPTIONS), query.OPTIONS.COLUMNS, where);
                result = that2.databaseToResult(id);
                if (where.length === 1) {
                    for (let key of where) {
                        result = that.filter(query.WHERE, key, mkey, skey, result);
                    }
                }
                if (Object.keys(query).length === 3) {
                    applykey = helper.appkey(query);
                    result = that.transformationFunction(result, query.TRANSFORMATIONS, mkey, skey);
                    groupkey = query.TRANSFORMATIONS["GROUP"];
                }
            } catch (error) {
                return reject(new InsightError());
            }
            try {
                syntax.columnChecker(query, groupkey, mkey, skey, applykey);
                helper.deleteKeys(result, mkey, skey, groupkey, applykey, query);
                result = helper.sortFunction(result, query, orderBoolean);
            } catch (error) {
                return reject(error);
            }
            if (result.length > 5000) {
                throw new ResultTooLargeError();
            }
            return resolve(result);
        });
    }

    public databaseToResult(id: string): any[] {
        if (this.memoDataset.datasetInMemo[id] !== null || this.memoDataset.datasetInMemo[id] !== undefined) {
            return JSON.parse(JSON.stringify(this.memoDataset.datasetInMemo[id]));
        } else {
            let fs = require("fs");
            return JSON.parse(fs.readFileSync("./data/" + id + ".json"));
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList);
    }
}
