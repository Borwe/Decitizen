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

    const result = await new Validator(name!, id!, year!,)
      .begin().catch(reject=>{
        console.log(reject)
        return false
      })
    expect(result).toBeTruthy()
  }, 9999999)

  it("Validator User With Bad Name", async ()=>{
    const name = process.env.BADNAME
    const year = process.env.BADNAMEYEAR
    const id = process.env.BADWORKID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    let failed = false
    const result = await new Validator(name!, id!, year!,)
      .begin().catch(reject=>{
        failed = true
        console.log(reject)
        return false
      })
    expect(failed).toBeFalsy()
    expect(result).toBeFalsy()
  }, 9999999)
})
