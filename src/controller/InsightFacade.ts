import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 *
 */
class MemoDataset {
    // // object containing the in memory dataset variable
    public datasetInMemo: { [key: string]: any };
    // // list of currently in memory insight dataset
    public datasetMemoList: InsightDataset[];
    public datasetMList: string[];

    constructor(datasetMList: string[], datasetMemoList: InsightDataset[], datasetInMemo: { [key: string]: any }) {
        this.datasetMList = datasetMList;
        this.datasetMemoList = datasetMemoList;
        this.datasetInMemo = datasetInMemo;
    }
}

export default class InsightFacade implements IInsightFacade {
    // // object containing the in memory dataset variable
    private dobject: { [key: string]: any } = {};
    // // // list of currently in memory insight dataset
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
            return false;
        }
    }

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
                                return Promise.reject(new InsightError("Not JSON file, fail to parse"));
                            });
                            p.push(jsonFile);
                        }
                    });
                    return Promise.all(p).then((result: any) => {
                        let dataFile: any[] = [];
                        for (let course of result) {
                            if (course === undefined || !("result" in course) || course === null) {
                                continue;
                            }
                            for (let courseSec of course["result"]) {
                                if (that.sectionCheck(courseSec)) {
                                    let courseSection: any = {};
                                    that.datasetKeyConvert(courseSection, courseSec);
                                    dataFile.push(courseSection); }}}
                        if (dataFile.length > 0) {
                            that.updateMemory(id, dataFile, that.memoDataset);
                            return Promise.resolve(that.memoDataset.datasetMList);
                        } else {
                            return Promise.reject(new InsightError("invalid (no valid course section) dataset"));
                        }
                    }).catch((error: any) => {
                        return Promise.reject(new InsightError("promise.all failed"));
                    });
                } else {
                    return Promise.reject(new InsightError("invalid dataset subdirectory"));
                }
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset"));
            }); }
    }

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
                delete this.memoDataset.datasetInMemo[id];
            }
            return Promise.resolve(id);

        }
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList);

    }
}
