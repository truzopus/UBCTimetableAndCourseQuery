import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        under_scoreValid: "./test/data/courses.zip",
        InvalidDatasetEmpty: "./test/data/courses_invalidEmpty.zip",
        InvalidDatasetFileType: "./test/data/Hi",
        InvalidCourseType: "./test/data/courses_invalidCourse.zip",
        InvalidAndValid: "./test/data/validandinvalid.zip",
        InvalidAndValid2: "./test/data/validandinvalid2.zip",
        EmptyCourse: "./test/data/emptycourse.zip",
        MissingType: "./test/data/missingtype.zip",
        ValidSection: "./test/data/validandinvalidsection.zip",
        EmptyType: "./test/data/emptytype.zip",
        NumberType: "./test/data/Numbertype.zip",
        SpaceType: "./test/data/spacekey.zip",
        MispelledType: "./test/data/misspelled key.zip"

    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.info("err message");
            Log.info(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add multiple valid datasets", function () {
        const id: string = "courses";
        const id2: string = "rooms";
        const expected: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        }).then((response: string[]) => {
            expect(response).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add datasets with same id", async () => {
        let response: string[];
        const id: string = "courses";
        const id2: string = "rooms";
        try {
            await insightFacade.addDataset(id, datasets[id2], InsightDatasetKind.Rooms);
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Whitespace not Allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should add file different id", function () {
        const id: string = "courses";
        const expected: string[] = [ "hi", id];
        return insightFacade.addDataset("hi", datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((response: string[]) => {
            expect(response).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("All Undefined", async () => {
        let response: string[];
        try {
            response = await insightFacade.addDataset(undefined, undefined, undefined);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Undefined Error");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("ID Undefined", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            response = await insightFacade.addDataset(undefined, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Undefined Error");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Dataset Undefined", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            response = await insightFacade.addDataset(id, undefined, InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Undefined Error");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Type Undefined", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            response = await insightFacade.addDataset(id, datasets[id], undefined);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Undefined Error");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should throw InsightError when adding dataset with whitespace", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            response = await insightFacade.addDataset(" ", datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Whitespace not Allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should throw InsightError when adding null dataset", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            response = await insightFacade.addDataset(null, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "ID is null");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should throw InsightError when adding dataset with underscore", async () => {
        let response: string[];
        const id: string = "under_scoreValid";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Underscore not Allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should throw InsightError when adding duplicate dataset", async () => {
        let response: string[];
        const id: string = "courses";
        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Duplicates not Allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Wrong Dataset Type", async () => {
        let response: string[];
        const id: string = "InvalidDatasetFileType";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Wrong Dataset Type");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Empty Dataset", async () => {
        let response: string[];
        const id: string = "InvalidDatasetEmpty";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Empty Dataset");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Valid and Invalid Course", function () {
        const id: string = "InvalidAndValid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Valid and wrong file type", async () => {
        const id: string = "InvalidAndValid2";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Empty Course", async () => {
        let response: string[];
        const id: string = "EmptyCourse";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Empty Dataset");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Number Type", async () => {
        let response: string[];
        const id: string = "NumberType";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Key value is not a string.");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should add dataset with 1 valid section", function () {
        const id: string = "ValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add dataset with emptytype in section", function () {
        const id: string = "EmptyType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add dataset with anything in section", function () {
        const id: string = "SpaceType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add with missing type", async () => {
        let response: string[];
        const id: string = "MissingType";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Missing a Type");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not add with mispelled type", async () => {
        let response: string[];
        const id: string = "MispelledType";
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Missing a Type");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should remove valid dataset", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then ((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response: string) => {
            expect(response).to.deep.equal(id);
        }).catch((err: any) => {
            expect.fail(err, id, "Should not have rejected");
        });
    });

    it("Should remove valid dataset when there is more than one", function () {
        const id: string = "courses";
        const id2: string = "rooms";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then ((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        }).then((response: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response2: string) => {
            expect(response2).to.deep.equal(id);
        }).catch((err: any) => {
            expect.fail(err, id, "Should not have rejected");
        });
    });

    it("Remove dataset that hasn't been added error", async () => {
        let response: string;
        const id: string = "courses";
        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(NotFoundError, "Dataset does not exist");
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("Remove wrong dataset", async () => {
        let response: string;
        const id: string = "courses";
        const id2: string = "rooms";
        try {
            await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(NotFoundError, "Dataset does not exist");
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("Check if dataset is removed", async () => {
        let response: string;
        const id: string = "courses";
        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            await insightFacade.removeDataset(id);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(NotFoundError, "Dataset does not exist");
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("Remove whitespace dataset", async () => {
        let response: string;
        const id: string = " ";
        const id2: string = "courses";
        try {
            await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Whitespace not allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Remove Undefined", async () => {
        let response: string;
        const id2: string = "courses";
        try {
            await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(undefined);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Undefined Error");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Remove null dataset", async () => {
        let response: string;
        const id: string = null;
        const id2: string = "courses";
        try {
            await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "ID is null");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Remove underscore dataset", async () => {
        let response: string;
        const id2: string = "courses";
        const id: string = "under_scoreValid";
        try {
            await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(InsightError, "Underscore not allowed");
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("List empty dataset", function () {
        const expected: InsightDataset[] = [];
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("List dataset with one course", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((response: InsightDataset[]) => {
            expect(response).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("List dataset with multiple courses", function () {
        const id: string = "courses";
        const id2: string = "rooms";
        const expected: InsightDataset[] = [{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612}
        , {id: "rooms", kind: InsightDatasetKind.Rooms, numRows: 64612}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then ((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        }).then((response: string[]) => {
            return insightFacade.listDatasets();
        }).then((response2: InsightDataset[]) => {
            expect(response2).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, id, "Should not have rejected");
        });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
