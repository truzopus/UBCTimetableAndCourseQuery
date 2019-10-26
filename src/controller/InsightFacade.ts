import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as http from "http";
let fs = require("fs");
let parse5 = require("parse5");

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

    private updateMemory(id: string, dataFile: any, memoDataset: MemoDataset, kind: InsightDatasetKind): void {
        let dataset: InsightDataset = {
            id: id, kind: kind,
            numRows: dataFile.length
        };
        memoDataset.datasetMemoList.push(dataset);
        memoDataset.datasetInMemo[id] = dataFile;
        memoDataset.datasetMList.push(id);
        let diskDir = "./data";
        fs.writeFile(diskDir + "/" + id + ".json", JSON.stringify(dataFile), (err: any) => {
            if (err) {
                throw err;
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/tslint/config
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (Log.invalidInputCheck(id, content, kind) || this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new InsightError("invalid input parameter"));
        } else {
            let that = this;
            let zip = new JSZip();
            let p: any[] = [];
            let con = Buffer.from(content, "base64");
            // eslint-disable-next-line @typescript-eslint/tslint/config
            return zip.loadAsync(con, {base64: true}).then(function (body: any) {
                if (kind === InsightDatasetKind.Courses) {
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
                                    if (Log.sectionCheck(courseSec)) {
                                        let courseSection: any = {};
                                        Log.datasetKeyConvert(courseSection, courseSec);
                                        dataFile.push(courseSection);
                                    }
                                }
                            } catch (error) { // ignore
                            }
                        }
                        if (dataFile.length > 0) {
                            that.updateMemory(id, dataFile, that.memoDataset, InsightDatasetKind.Courses);
                            return Promise.resolve(that.memoDataset.datasetMList);
                        } else {
                            return Promise.reject(new InsightError("invalid (no valid course section) dataset"));
                        }
                    }).catch((error: any) => {
                        return Promise.reject(new InsightError("promise.all failed"));
                    });
                }
                if (kind === InsightDatasetKind.Rooms) {
                    let roomFolder = body.folder(/rooms/);
                    if (roomFolder.length >= 1) {
                        return body.file("rooms/index.htm").async("text").then(function (data: any) {
                            let indexTree = parse5.parse(data);
                            let test: any = Log.findNested(indexTree["childNodes"], "nodeName", "tbody");
                            let contentTB = test["childNodes"];
                            let indexTemp = Log.findNestedAtr(contentTB);
                            let indexList = [...new Set(indexTemp)];
                            for (let i = 0, len = indexList.length; i < len; i++) {
                                let indB = indexList[i] + ".FILE";
                                let building = fs.readFileSync(indB).toString("base64");
                            }
                            return Promise.resolve(indexTree["nodeName"]);
                        }).catch(function (error: any) {
                            return Promise.reject(new InsightError("no index.htm"));
                        });
                    } else {
                        return Promise.reject("no folder");
                    }
                }
            }).catch(function (error: any) {
                return Promise.reject(new InsightError("fail to unzip dataset"));
            });
        }

    }

    public removeDataset(id: string): Promise<string> {
        if (Log.invalidInputCheckRemove(id)) {
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
        return Promise.reject(new InsightError("not implemented"));
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.memoDataset.datasetMemoList);
    }
}
