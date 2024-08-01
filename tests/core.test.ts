import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import dotenv from "dotenv"
import { Validator } from "../src/core"

describe("core tests",()=>{

  let validator = new Validator()

  beforeEach(async ()=>{
    dotenv.config()
    //add a delay of 3 seconds
    await new Promise((resolve,_)=>{
      setTimeout(()=>{
        resolve(true)
      }, 3000)
    })
  })


  it("Validator User Correct", async ()=>{
    const name = process.env.WORKNAME
    const year = process.env.WORKYEAR
    const id = process.env.WORKID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const result = await validator.validate({name, id, year})
    expect(result).toBe(true)
  }, 9999999)

  it("Validator User With Bad Name", async ()=>{
    const name = process.env.BADNAME
    const year = process.env.BADNAMEYEAR
    const id = process.env.BADID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const result = await validator.validate({name, id, year})
    expect(result).toBe(false)
  }, 9999999)


  it("Validator User With Bad YEAR", async ()=>{
    const name = process.env.BADYEARNAME
    const year = process.env.BADYEAR
    const id = process.env.BADYEARID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const result =await  validator.validate({name, id, year})
    expect(result).toBe(false)
  }, 9999999)


  it("Validator User With Bad ID", async ()=>{
    const name = process.env.BADIDNAME
    const year = process.env.BADIDYEAR
    const id = process.env.BADID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const result = await  validator.validate({name, id, year})
    expect(result).toBe(false)
  }, 9999999)

  it("Validator User Correct Again", async ()=>{
    const name = process.env.WORKNAME
    const year = process.env.WORKYEAR
    const id = process.env.WORKID
    expect(name).toBeTruthy()
    expect(year).toBeTruthy()
    expect(id).toBeTruthy()

    const result = await validator.validate({name, id, year})
    expect(result).toBe(true)
  }, 9999999)  

  afterAll(()=>{
    validator.end()
  })
})
