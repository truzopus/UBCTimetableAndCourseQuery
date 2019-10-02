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

    // helper function to determine and load valid dataset
    // private loadValidDataset(id: string, content: string): Promise<boolean> {
    //     let that = this;
    //     let con = Buffer.from(content, "base64");
    //     let zip = new JSZip();
    //     // tslint:disable-next-line:max-func-body-length
    //     return zip.loadAsync(con, {base64: true}).then(function (body: any) {
    //         let p: any[] = [];
    //         let coursesFolder = body.folder(/courses/);
    //         if (coursesFolder.length === 1) {
    //             body.folder("courses").forEach(function (relativePath: any, file: { dir: any; name: string; }) {
    //                 if (!file.dir) {
    //                     let jsonFile = body.file(file.name).async("text").then((output: any) => {
    //                         return Promise.resolve(JSON.parse(output));
    //                     }).catch(function (error: any) {
    //                         return Promise.reject(new InsightError("Not JSON file, fail to parse"));
    //                     });
    //                     p.push(jsonFile);
    //                 }
    //             });
    //             Promise.all(p).then((result: any) => {
    //                 let allCourses: any[] = [];
    //                 for (let courseSec of result) {
    //                     let courses: any[] = courseSec["result"];
    //                     for (let course of courses) {
    //                         if (("Course" in course) && ("Subject" in course) && ("Avg" in course)
    //                             && ("Title" in course) && ("Professor" in course) && ("Pass" in course)
    //                             && ("Fail" in course) && ("Year" in course)
    //                             && ("id" in course) && ("Audit" in course)) {
    //                             let courseSection: any = {};
    //                             courseSection["courses_dept"] = course["Subject"];
    //                             courseSection["courses_id"] = course["Course"];
    //                             courseSection["courses_avg"] = course["Avg"];
    //                             courseSection["courses_instructor"] = course["Professor"];
    //                             courseSection["courses_title"] = course["Title"];
    //                             courseSection["courses_pass"] = course["Pass"];
    //                             courseSection["courses_fail"] = course["Fail"];
    //                             courseSection["courses_audit"] = course["Audit"];
    //                             courseSection["courses_uuid"] = String(course["id"]);
    //                             courseSection["courses_year"] = Number(course["Year"]);
    //                             allCourses.push(courseSection);
    //                         }
    //                     }
    //                 }
    //                 if (allCourses.length === 0) {
    //                     return Promise.reject(new InsightError("no valid course section"));
    //                 } else {
    //                     let dataset: InsightDataset = {
    //                         id: id, kind: InsightDatasetKind.Courses,
    //                         numRows: allCourses.length
    //                     };
    //                     that.memoDataset.datasetMemoList.push(dataset);
    //                     that.memoDataset.datasetInMemo[id] = allCourses;
    //                     that.memoDataset.datasetMList.push(id)
    //                     // tslint:disable-next-line:no-console
    //                     console.log(that.memoDataset.datasetMList);
    //                     fs.writeFile(diskDir + "/" + id + ".json", JSON.stringify(allCourses), (err: any) => {
    //                         if (err) {
    //                             throw err;
    //                         }
    //                     });
    //                     return Promise.resolve(true);
    //                     // return Promise.resolve(that.memoDataset.datasetMList);
    //                 }
    //             }).catch((error: any) => {
    //                 return Promise.reject(new InsightError("promise.all failed"));
    //             });
    //         } else {
    //             return Promise.reject(new InsightError("invalid dataset subdirectory"));
    //         }
    //     }).catch(function (error: any) {
    //         return Promise.reject(new InsightError("fail to unzip dataset"));
    //     });
    // }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id === "" || id === null || id === undefined ||
            kind === null || kind === undefined ||
            content === "" || content === null || content === undefined) {
            return Promise.reject(new InsightError("empty or null or undefined input parameter"));
        } else if (id.includes(("_")) || (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms)) {
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
                            p.push(jsonFile); }});
                    Promise.all(p).then((result: any) => {
                        let allCourses: any[] = [];
                        for (let courseSec of result) {
                            let courses: any[] = courseSec["result"];
                            for (let course of courses) {
                                if (("Course" in course) && ("Subject" in course) && ("Avg" in course)
                                    && ("Title" in course) && ("Professor" in course) && ("Pass" in course)
                                    && ("Fail" in course) && ("Year" in course)
                                    && ("id" in course) && ("Audit" in course)) {
                                    let courseSection: any = {};
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
                                    allCourses.push(courseSection); }}}
                        if (allCourses.length === 0) {
                            return Promise.reject(new InsightError("no valid course section"));
                        } else {
                            let dataset: InsightDataset = {
                                id: id, kind: InsightDatasetKind.Courses,
                                numRows: allCourses.length};
                            that.memoDataset.datasetMemoList.push(dataset);
                            that.memoDataset.datasetInMemo[id] = allCourses;
                            that.memoDataset.datasetMList.push(id);
                            fs.writeFile(diskDir + "/" + id + ".json", JSON.stringify(allCourses), (err: any) => {
                                if (err) {throw err; }});
                            return Promise.resolve(that.memoDataset.datasetMList); }
                    }).catch((error: any) => {
                        return Promise.reject(new InsightError("promise.all failed")); });
                } else { return Promise.reject(new InsightError("invalid dataset subdirectory")); }
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset")); }); }}

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList);
        // return Promise.reject("Not implemented.");

    }
}
