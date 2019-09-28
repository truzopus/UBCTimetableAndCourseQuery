import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError,
    NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 *
 */
class MemoDataset {
    // // object containing the in memory dataset variable
    public datasetInMemo: object;
    // // list of currently in memory insight dataset
    public datasetMemoList: InsightDataset[];
    public datasetMList: string[];

    constructor(datasetMList: string[], datasetMemoList: InsightDataset[], datasetInMemo: object) {
        this.datasetMList = datasetMList;
        this.datasetMemoList = datasetMemoList;
        this.datasetInMemo = datasetInMemo;
    }
}
export default class InsightFacade implements IInsightFacade {
    // // object containing the in memory dataset variable
    private dobject: object = {};
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
    private loadValidDataset(content: string): boolean {
        let c = new Buffer(content);
        let b = c.toString("base64");
        let zip = new JSZip();
        zip.loadAsync(b).then()
        return true;
    }
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id === ""  || id === null || id === undefined ||
            kind === null || kind === undefined ||
            content === "" || content === null || content === undefined ) {
            return Promise.reject(new InsightError());
        } else if (id.includes(("_")) || (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms)) {
            return Promise.reject(new InsightError());
        } else if (this.memoDataset.datasetMList.includes(id)) {
            return Promise.reject(new InsightError());
        } else {
            if (this.loadValidDataset( content)) {
                return Promise.resolve(this.memoDataset.datasetMList);
            } else {
                return Promise.reject("Not implemented.");
            }
        }
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
