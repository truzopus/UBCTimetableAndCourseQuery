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

}
