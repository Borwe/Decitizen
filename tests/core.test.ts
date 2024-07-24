import { describe, expect, it } from "@jest/globals"
import dotenv from "dotenv"
import { Validator } from "../src/core"

describe("core tests",()=>{
  dotenv.config()

  it("Validator User Correct", async ()=>{
    const name = process.env.WORKNAME
    const year = process.env.WORKYEAR
    const id = process.env.WORKID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const validator = new Validator(name!, id!, year!)
    const result = await validator.begin().catch(reject=>{
        console.log(reject)
        return false
      })
    expect(result).toBeTruthy()
    validator.end()
  }, 9999999)

  it("Validator User With Bad Name", async ()=>{
    const name = process.env.BADNAME
    const year = process.env.BADNAMEYEAR
    const id = process.env.BADID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    let failed = false
    const validator = new Validator(name!, id!, year!)
    const result = await validator.begin().catch(reject=>{
        failed = true
        console.log(reject)
        return false
      })
    expect(failed).toBeFalsy()
    expect(result).toBeFalsy()
    validator.end()
  }, 9999999)


  it("Validator User With Bad YEAR", async ()=>{
    const name = process.env.BADYEARNAME
    const year = process.env.BADYEAR
    const id = process.env.BADYEARID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    let failed = false
    const validator = new Validator(name!, id!, year!)
    const result = await validator.begin().catch(reject=>{
        failed = true
        console.log(reject)
        return false
      })
    expect(failed).toBeFalsy()
    expect(result).toBeFalsy()
    validator.end()
  }, 9999999)


  it("Validator User With Bad ID", async ()=>{
    const name = process.env.BADIDNAME
    const year = process.env.BADIDYEAR
    const id = process.env.BADID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    let failed = false
    const validator = new Validator(name!, id!, year!)
    const result = await validator.begin().catch(reject=>{
        failed = true
        console.log(reject)
        return false
      })
    expect(failed).toBeFalsy()
    expect(result).toBeFalsy()
    validator.end()
  }, 9999999)
})
