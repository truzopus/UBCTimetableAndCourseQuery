import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
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

let fs = require("fs");
let diskDir = "./data";

export default class InsightFacade implements IInsightFacade {
    // // object containing the in memory dataset variable
    private dobject: { [key: string]: any } = {};
    // // // list of currently in memory insight dataset
    private dsList: InsightDataset[] = [];
    private dList: string[] = [];
    private memoDataset = new MemoDataset(this.dList, this.dsList, this.dobject);

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // this.datasetMList = [];
        // this.datasetMemoList = [];
        // this.datasetInMemo = {};
        // let datasetInMemo: object = {};
        // let datasetMemoList: InsightDataset[] = [];
        // let datasetMList: string[] = [];
        // let memoDataset = new MemoDataset(datasetMList, datasetMemoList, datasetInMemo);
    }
    private sectionCheck (course: any): boolean {
        let sc: boolean = (("Course" in course) && ("Subject" in course) && ("Avg" in course)
            && ("Title" in course) && ("Professor" in course) && ("Pass" in course)
            && ("Fail" in course) && ("Year" in course)
            && ("id" in course) && ("Audit" in course));
        return sc;
    }
    private datasetKeyConvert(courseSection: any, course: any): void {
        courseSection["courses_dept"] = course["Subject"];
        courseSection["courses_id"] = course["Course"];
        courseSection["courses_avg"] = course["Avg"];
        courseSection["courses_instructor"] = course["Professor"];
        courseSection["courses_title"] = course["Title"];
        courseSection["courses_pass"] = course["Pass"];
        courseSection["courses_fail"] = course["Fail"];
        courseSection["courses_audit"] = course["Audit"];
        courseSection["courses_uuid"] = String(course["id"]);
        courseSection["courses_year"] = Number(course["Year"]);
    }
    private updateMemory(id: string, allCourses: any, memoDataset: MemoDataset): void {
        let dataset: InsightDataset = {
            id: id, kind: InsightDatasetKind.Courses,
            numRows: allCourses.length
        };
        memoDataset.datasetMemoList.push(dataset);
        memoDataset.datasetInMemo[id] = allCourses;
        memoDataset.datasetMList.push(id);
    }
    private invalidInputCheck(id: string, content: string, kind: InsightDatasetKind): boolean {
        if (/^\s+$/.test(id) || id === null || id === undefined ||
            kind === null || kind === undefined ||
            /^\s+$/.test(content) || content === null || content === undefined){
            return true;
        } else if (id.includes(("_")) || (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms)){
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
                    Promise.all(p).then((result: any) => {
                        let allCourses: any[] = [];
                        for (let courseSec of result) {
                            for (let course of courseSec["result"]) {
                                if (that.sectionCheck(course)) {
                                    let courseSection: any = {};
                                    that.datasetKeyConvert(courseSection, course);
                                    allCourses.push(courseSection);
                                }
                            }
                        }
                        if (allCourses.length >= 0) {
                            that.updateMemory(id, allCourses, that.memoDataset);
                            fs.writeFile(diskDir + "/" + id + ".json", JSON.stringify(allCourses), (err: any) => {
                                if (err) {
                                    throw err;
                                }
                            });
                            return Promise.resolve(that.memoDataset.datasetMList);
                        }
                    }).catch((error: any) => {
                        return Promise.reject(new InsightError("promise.all failed"));
                    });
                } else {
                    return Promise.reject(new InsightError("invalid dataset subdirectory"));
                }
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset"));
            });
        }
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList);

    }
}
