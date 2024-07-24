import dotenv from "dotenv"
import assert from "assert"
import { Validator } from "./core"

async function main(){
  dotenv.config()
  const name = process.env.WORKNAME
  const year = process.env.WORKYEAR
  const id = process.env.WORKID
  assert(name!=undefined)
  assert(year!=undefined)
  assert(id!=undefined)

  const result = await new Validator(name, id, year,)
    .begin().catch(reject=>{
      console.log(reject)
      return false
    })
  console.log("SUCCESS", result)
}

main()
