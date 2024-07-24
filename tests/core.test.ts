import { describe, expect, it } from "@jest/globals"
import dotenv from "dotenv"
import { Validator } from "../src/core"

describe("core tests",()=>{
  dotenv.config()
  const name = process.env.WORKNAME
  const year = process.env.WORKYEAR
  const id = process.env.WORKID
  expect(name).toBeTruthy()
  expect(year).toBeTruthy()
  expect(id).toBeTruthy()

  it("Validator User Correct", async ()=>{

    const result = await new Validator(name!, id!, year!,)
      .begin().catch(reject=>{
        console.log(reject)
        return false
      })
    expect(result).toBeTruthy()
  }, 9999999)
})
